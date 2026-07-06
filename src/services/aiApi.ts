/**
 * Multi-provider AI API service.
 *
 * Priority:
 *   1. Real provider API (when env key is set)
 *   2. Pollinations.ai (free, CORS-enabled, no key)  — POST streaming then GET fallback
 *
 * Every fetch call has an AbortController timeout so the UI never hangs forever.
 */

const K = {
  openai:     import.meta.env.VITE_OPENAI_API_KEY     as string | undefined,
  anthropic:  import.meta.env.VITE_ANTHROPIC_API_KEY  as string | undefined,
  google:     import.meta.env.VITE_GOOGLE_API_KEY     as string | undefined,
  deepseek:   import.meta.env.VITE_DEEPSEEK_API_KEY   as string | undefined,
  xai:        import.meta.env.VITE_XAI_API_KEY        as string | undefined,
  perplexity: import.meta.env.VITE_PERPLEXITY_API_KEY as string | undefined,
  elevenlabs: import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined,
};

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// ─── Model ID mappings ────────────────────────────────────────────────────────

const OPENAI_MODELS: Record<string, string> = {
  "gpt-web": "gpt-4o", "gpt-4.1": "gpt-4o", "gpt-4.1-mini": "gpt-4o-mini",
  "gpt-4.1-nano": "gpt-4o-mini", "gpt-5.1": "gpt-4o", "gpt-5.2": "gpt-4o",
  "gpt-5.3": "gpt-4o", "gpt-5.4": "gpt-4o", "gpt-5.4-pro": "gpt-4o",
};

const CLAUDE_MODELS: Record<string, string> = {
  "claude-3.5-haiku": "claude-3-5-haiku-20241022",
  "claude-4-sonnet": "claude-3-5-sonnet-20241022",
  "claude-4-opus": "claude-opus-4-5-20250514",
  "claude-4.1-opus": "claude-opus-4-5-20250514",
  "claude-4.5-sonnet": "claude-3-5-sonnet-20241022",
  "claude-4.5-opus": "claude-opus-4-5-20250514",
  "claude-4.6-opus": "claude-opus-4-5-20250514",
  "claude-4.6-sonnet": "claude-3-5-sonnet-20241022",
};

const GEMINI_MODELS: Record<string, string> = {
  "gemini-2.0-flash": "gemini-2.0-flash-exp",
  "gemini-2.0-pro": "gemini-2.0-flash-exp",
  "gemini-1.5-pro": "gemini-1.5-pro-latest",
  "gemini-1.5-flash": "gemini-1.5-flash-latest",
};

const DEEPSEEK_MODELS: Record<string, string> = {
  "deepseek-v3": "deepseek-chat",
  "deepseek-r1": "deepseek-reasoner",
};

const XAI_MODELS: Record<string, string> = {
  "grok-3": "grok-2-1212",
  "grok-3-mini": "grok-3-mini-beta",
};

const PERPLEXITY_MODELS: Record<string, string> = {
  "sonar": "sonar",
  "sonar-pro": "sonar-pro",
};

// ─── Fetch with timeout ───────────────────────────────────────────────────────

function fetchWithTimeout(url: string, options: RequestInit = {}, ms = 20_000): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...options, signal: ctrl.signal }).finally(() => clearTimeout(id));
}

// ─── OpenAI-compatible SSE parser ────────────────────────────────────────────

async function* parseSSE(res: Response): AsyncGenerator<string> {
  if (!res.body) {
    // Non-streaming response: try JSON then plain text
    const txt = await res.text();
    try {
      const j = JSON.parse(txt) as {
        choices?: Array<{ message?: { content?: string }; delta?: { content?: string } }>;
      };
      const t = j.choices?.[0]?.message?.content ?? j.choices?.[0]?.delta?.content;
      if (t) yield t;
    } catch { if (txt.trim()) yield txt.trim(); }
    return;
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") return;
        try {
          const p = JSON.parse(raw) as {
            choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
          };
          const t = p.choices?.[0]?.delta?.content ?? p.choices?.[0]?.message?.content;
          if (t) yield t;
        } catch { /* skip malformed SSE line */ }
      }
    }
  } finally { reader.releaseLock(); }
}

// ─── OpenAI-compatible provider helper ───────────────────────────────────────

async function* openAICompatible(
  baseUrl: string, apiKey: string, model: string,
  messages: ChatMessage[], systemPrompt?: string,
): AsyncGenerator<string> {
  const msgs: ChatMessage[] = [];
  if (systemPrompt?.trim()) msgs.push({ role: "system", content: systemPrompt });
  msgs.push(...messages);

  const res = await fetchWithTimeout(
    `${baseUrl}/chat/completions`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: msgs, stream: true, max_tokens: 2048 }),
    },
    25_000,
  );
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(e.error?.message ?? `API ${res.status}`);
  }
  yield* parseSSE(res);
}

// ─── Pollinations.ai free text ────────────────────────────────────────────────

async function* streamPollinations(
  providerId: string,
  messages: ChatMessage[],
  systemPrompt?: string,
): AsyncGenerator<string> {
  const msgs: ChatMessage[] = [];
  if (systemPrompt?.trim()) msgs.push({ role: "system", content: systemPrompt });
  msgs.push(...messages.filter((m) => m.role !== "system"));

  let yielded = false;

  // ── Attempt 1: streaming POST ─────────────────────────────────────────────
  try {
    const res = await fetchWithTimeout(
      "https://text.pollinations.ai/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: msgs,
          model: "openai",
          stream: true,
          seed: Math.floor(Math.random() * 999999),
        }),
      },
      15_000, // 15 s — if no chunk by then, fall through to GET
    );
    if (res.ok) {
      for await (const chunk of parseSSE(res)) {
        yield chunk;
        yielded = true;
      }
    }
  } catch { /* timeout / network / CORS → try GET */ }

  if (yielded) return;

  // ── Attempt 2: simple GET (no streaming, always works from browser) ────────
  const lastUser = msgs.filter((m) => m.role === "user").pop()?.content ?? "";
  if (!lastUser) return;

  const sys = msgs.find((m) => m.role === "system")?.content ?? "";
  const url =
    `https://text.pollinations.ai/${encodeURIComponent(lastUser.slice(0, 800))}` +
    `?model=openai&seed=${Math.floor(Math.random() * 999999)}` +
    (sys ? `&system=${encodeURIComponent(sys.slice(0, 300))}` : "");

  const r = await fetchWithTimeout(url, {}, 25_000);
  if (!r.ok) throw new Error(`AI недоступен (${r.status}). Попробуйте позже.`);
  const text = await r.text();
  if (text.trim()) yield text.trim();
}

// ─── Provider streaming functions ────────────────────────────────────────────

async function* streamOpenAI(id: string, msgs: ChatMessage[], sys?: string): AsyncGenerator<string> {
  if (!K.openai) { yield* streamPollinations("chatgpt", msgs, sys); return; }
  yield* openAICompatible("https://api.openai.com/v1", K.openai, OPENAI_MODELS[id] ?? "gpt-4o-mini", msgs, sys);
}

async function* streamClaude(id: string, msgs: ChatMessage[], sys?: string): AsyncGenerator<string> {
  if (!K.anthropic) { yield* streamPollinations("claude", msgs, sys); return; }

  const model = CLAUDE_MODELS[id] ?? "claude-3-5-haiku-20241022";
  const body: Record<string, unknown> = {
    model, max_tokens: 2048,
    messages: msgs.filter((m) => m.role !== "system"),
    stream: true,
  };
  if (sys?.trim()) body.system = sys;

  const res = await fetchWithTimeout(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "x-api-key": K.anthropic,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    },
    30_000,
  );
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(e.error?.message ?? `Anthropic ${res.status}`);
  }

  if (!res.body) return;
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const p = JSON.parse(line.slice(6)) as {
            type?: string; delta?: { type?: string; text?: string };
          };
          if (p.type === "content_block_delta" && p.delta?.type === "text_delta" && p.delta.text)
            yield p.delta.text;
        } catch { /* skip */ }
      }
    }
  } finally { reader.releaseLock(); }
}

async function* streamGemini(id: string, msgs: ChatMessage[], sys?: string): AsyncGenerator<string> {
  if (!K.google) { yield* streamPollinations("gemini", msgs, sys); return; }

  const model = GEMINI_MODELS[id] ?? "gemini-1.5-flash-latest";
  const contents = msgs
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

  const body: Record<string, unknown> = { contents };
  if (sys?.trim()) body.systemInstruction = { parts: [{ text: sys }] };

  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${K.google}&alt=sse`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    30_000,
  );
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(e.error?.message ?? `Gemini ${res.status}`);
  }

  if (!res.body) return;
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const p = JSON.parse(line.slice(6)) as {
            candidates?: [{ content?: { parts?: [{ text?: string }] } }];
          };
          const t = p.candidates?.[0]?.content?.parts?.[0]?.text;
          if (t) yield t;
        } catch { /* skip */ }
      }
    }
  } finally { reader.releaseLock(); }
}

async function* streamDeepSeek(id: string, msgs: ChatMessage[], sys?: string): AsyncGenerator<string> {
  if (!K.deepseek) { yield* streamPollinations("deepseek", msgs, sys); return; }
  yield* openAICompatible("https://api.deepseek.com/v1", K.deepseek, DEEPSEEK_MODELS[id] ?? "deepseek-chat", msgs, sys);
}

async function* streamGrok(id: string, msgs: ChatMessage[], sys?: string): AsyncGenerator<string> {
  if (!K.xai) { yield* streamPollinations("grok", msgs, sys); return; }
  yield* openAICompatible("https://api.x.ai/v1", K.xai, XAI_MODELS[id] ?? "grok-2-1212", msgs, sys);
}

async function* streamPerplexity(id: string, msgs: ChatMessage[], sys?: string): AsyncGenerator<string> {
  if (!K.perplexity) { yield* streamPollinations("perplexity", msgs, sys); return; }
  yield* openAICompatible("https://api.perplexity.ai", K.perplexity, PERPLEXITY_MODELS[id] ?? "sonar", msgs, sys);
}

// ─── Public: unified text streaming ──────────────────────────────────────────

export async function* streamAI(
  providerId: string, subModelId: string,
  messages: ChatMessage[], systemPrompt?: string,
): AsyncGenerator<string> {
  switch (providerId) {
    case "chatgpt":    yield* streamOpenAI(subModelId, messages, systemPrompt);    break;
    case "claude":     yield* streamClaude(subModelId, messages, systemPrompt);    break;
    case "gemini":     yield* streamGemini(subModelId, messages, systemPrompt);    break;
    case "deepseek":   yield* streamDeepSeek(subModelId, messages, systemPrompt);  break;
    case "grok":       yield* streamGrok(subModelId, messages, systemPrompt);      break;
    case "perplexity": yield* streamPerplexity(subModelId, messages, systemPrompt);break;
    default:           yield* streamPollinations(providerId, messages, systemPrompt);break;
  }
}

export const streamChatCompletion = (id: string, msgs: ChatMessage[], sys?: string) =>
  streamAI("chatgpt", id, msgs, sys);

// ─── Image generation ─────────────────────────────────────────────────────────

export interface ImageGenOptions {
  quality?: string;   // "1K" | "2K" | "4K"
  quantity?: number;  // number of images to produce
  turbo?: boolean;    // true = fast/lower-fidelity, false = best quality
}

function pollinationsImageUrl(prompt: string, aspect = "1:1", opts: ImageGenOptions = {}): string {
  const { quality = "2K", turbo = false } = opts;

  // "flux" (FLUX.1-schnell) is far more photorealistic/detailed than the legacy
  // "turbo" (SDXL-Turbo) model — only trade quality for speed when Turbo is ON.
  const model = turbo ? "turbo" : "flux";

  // Long-side resolution scales with the requested quality tier.
  const base = quality === "4K" ? 1600 : quality === "1K" ? 768 : 1152;
  const [w, h] =
    aspect === "16:9" || aspect === "21:9" ? [base, Math.round(base * 9 / 16)] :
    aspect === "9:16" || aspect === "4:5"  ? [Math.round(base * 9 / 16), base] :
    aspect === "4:3"                       ? [base, Math.round(base * 3 / 4)] :
    aspect === "3:4"                       ? [Math.round(base * 3 / 4), base] :
                                             [base, base];
  const seed = Math.floor(Math.random() * 999_999);
  return (
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=${w}&height=${h}&seed=${seed}&nologo=true&model=${model}`
  );
}

function gptImageSize(aspect: string): string {
  if (["16:9", "21:9", "3:2", "5:4"].includes(aspect)) return "1536x1024";
  if (["9:16", "4:5", "3:4", "2:3"].includes(aspect)) return "1024x1536";
  return "1024x1024";
}

export async function generateImageDallE(
  prompt: string, aspect = "1:1", opts: ImageGenOptions = {},
): Promise<string[]> {
  const { quality = "2K", quantity = 1, turbo = false } = opts;

  if (!K.openai) {
    return Array.from({ length: quantity }, () => pollinationsImageUrl(prompt, aspect, { quality, turbo }));
  }

  // gpt-image-1 — OpenAI's current-generation image model (replaces dall-e-3),
  // notably better photorealism and prompt adherence. Always returns b64_json.
  const res = await fetchWithTimeout(
    "https://api.openai.com/v1/images/generations",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${K.openai}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        n: Math.min(Math.max(quantity, 1), 4),
        size: gptImageSize(aspect),
        quality: quality === "4K" ? "high" : quality === "1K" ? "low" : "medium",
      }),
    },
    120_000,
  );
  if (!res.ok) {
    // fall back on any error (e.g. org not verified for gpt-image-1, quota, etc.)
    return Array.from({ length: quantity }, () => pollinationsImageUrl(prompt, aspect, { quality, turbo }));
  }
  const data = await res.json() as { data: Array<{ url?: string; b64_json?: string }> };
  return data.data.map((d) => d.url ?? `data:image/png;base64,${d.b64_json}`);
}

// ─── Text-to-Speech ───────────────────────────────────────────────────────────

const EL_VOICE_IDS: Record<string, string> = {
  "Dmitry D": "pNInz6obpgDQGcFmaJgB", "Mikhail K": "TxGEqnHWrfWFTfGW9XjX",
  "Sergey V":  "VR6AewLTigWG4xSOukaG", "Anton R":   "ErXwobaYiN019PkySvjV",
  "Anna S":    "EXAVITQu4vr4xnSDxMaL", "Elena V":   "21m00Tcm4TlvDq8ikWAM",
  "Maria T":   "MF3mGyEYCl7XYWbV9V6O", "Olga N":    "AZnzlk1XvdvUeBnXmlld",
  "James":     "TxGEqnHWrfWFTfGW9XjX", "Sarah":     "21m00Tcm4TlvDq8ikWAM",
  "Alex":      "ErXwobaYiN019PkySvjV",  "Emily":     "MF3mGyEYCl7XYWbV9V6O",
};

// StreamElements voice names (best match per persona)
const SE_VOICES: Record<string, string> = {
  "Dmitry D": "Brian", "Mikhail K": "Brian", "Sergey V": "Matthew",
  "Anton R":  "Joey",  "Anna S":    "Amy",   "Elena V":  "Amy",
  "Maria T":  "Salli", "Olga N":    "Kimberly",
  "James":    "Brian", "Sarah":     "Amy",   "Alex":     "Matthew", "Emily": "Joanna",
};

/**
 * Returns a TTS audio URL or blob-URL.
 * ElevenLabs → when key set (returns blob URL).
 * StreamElements → free fallback, returns direct URL (no CORS needed for <audio>).
 */
export async function textToSpeech(
  text: string, voiceName = "Anna S", modelId = "eleven_multilingual_v2",
): Promise<string> {
  if (!K.elevenlabs) {
    const voice = SE_VOICES[voiceName] ?? "Brian";
    const truncated = text.length > 450
      ? text.slice(0, 450).replace(/[^.!?]*$/, "").trim() || text.slice(0, 450)
      : text;
    // Direct URL — <audio src="..."> loads cross-origin audio without CORS preflight
    return `https://api.streamelements.com/kappa/v2/speech?voice=${encodeURIComponent(voice)}&text=${encodeURIComponent(truncated)}`;
  }

  const voiceId = EL_VOICE_IDS[voiceName] ?? "EXAVITQu4vr4xnSDxMaL";
  const res = await fetchWithTimeout(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: { "xi-api-key": K.elevenlabs, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text, model_id: modelId,
        voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true },
      }),
    },
    30_000,
  );
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { detail?: { message?: string } };
    throw new Error(e.detail?.message ?? `ElevenLabs ${res.status}`);
  }
  return URL.createObjectURL(await res.blob());
}

export function hasOpenAIKey(): boolean { return !!K.openai; }
export function hasGoogleKey(): boolean { return !!K.google; }

// ─── Video generation (Google Veo 3, via Gemini API) ─────────────────────────

const VEO_MODEL = "veo-3.0-generate-001";

function veoAspectRatio(aspect?: string): string {
  return aspect === "9:16" ? "9:16" : "16:9"; // Veo currently only outputs these two
}

/**
 * Generates a real AI video with Google Veo 3.
 * Requires VITE_GOOGLE_API_KEY on a project with Veo access/billing enabled —
 * throws otherwise so the caller can fall back to a preview experience.
 * The key is used directly from the browser (no backend in this app), so it
 * is visible in network requests and every call is billed on that key.
 */
export async function generateVideoVeo(prompt: string, aspect = "16:9"): Promise<string> {
  if (!K.google) throw new Error("NO_KEY");

  const startRes = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${VEO_MODEL}:predictLongRunning`,
    {
      method: "POST",
      headers: { "x-goog-api-key": K.google, "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { aspectRatio: veoAspectRatio(aspect) },
      }),
    },
    30_000,
  );
  if (!startRes.ok) {
    const e = await startRes.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(e.error?.message ?? `Veo ${startRes.status}`);
  }
  const { name } = await startRes.json() as { name: string };
  if (!name) throw new Error("Veo не вернул operation id");

  // Veo generation is a long-running operation — poll until done (typically 1-3 min).
  const deadline = Date.now() + 6 * 60_000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 5_000));

    const opRes = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/${name}`,
      { headers: { "x-goog-api-key": K.google } },
      20_000,
    );
    if (!opRes.ok) continue;

    const op = await opRes.json() as {
      done?: boolean;
      error?: { message?: string };
      response?: { generateVideoResponse?: { generatedSamples?: Array<{ video?: { uri?: string } }> } };
    };
    if (op.error) throw new Error(op.error.message ?? "Veo generation failed");
    if (!op.done) continue;

    const uri = op.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
    if (!uri) throw new Error("Veo вернул пустой результат");

    const videoRes = await fetchWithTimeout(
      `${uri}${uri.includes("?") ? "&" : "?"}key=${K.google}`,
      {},
      60_000,
    );
    if (!videoRes.ok) throw new Error(`Не удалось скачать видео (${videoRes.status})`);
    return URL.createObjectURL(await videoRes.blob());
  }
  throw new Error("Превышено время ожидания генерации видео");
}
