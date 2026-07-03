/**
 * Multi-provider AI API service.
 * When a provider key is set it uses the real API.
 * When NO key is set it falls back to Pollinations.ai (free, no key required)
 * so every feature works out of the box.
 */

const K = {
  openai:      import.meta.env.VITE_OPENAI_API_KEY      as string | undefined,
  anthropic:   import.meta.env.VITE_ANTHROPIC_API_KEY   as string | undefined,
  google:      import.meta.env.VITE_GOOGLE_API_KEY      as string | undefined,
  deepseek:    import.meta.env.VITE_DEEPSEEK_API_KEY    as string | undefined,
  xai:         import.meta.env.VITE_XAI_API_KEY         as string | undefined,
  perplexity:  import.meta.env.VITE_PERPLEXITY_API_KEY  as string | undefined,
  elevenlabs:  import.meta.env.VITE_ELEVENLABS_API_KEY  as string | undefined,
};

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// ─── Model ID mappings ───────────────────────────────────────────────────────

const OPENAI_MODELS: Record<string, string> = {
  "gpt-web":       "gpt-4o",
  "gpt-4.1":       "gpt-4o",
  "gpt-4.1-mini":  "gpt-4o-mini",
  "gpt-4.1-nano":  "gpt-4o-mini",
  "gpt-5.1":       "gpt-4o",
  "gpt-5.2":       "gpt-4o",
  "gpt-5.3":       "gpt-4o",
  "gpt-5.4":       "gpt-4o",
  "gpt-5.4-pro":   "gpt-4o",
};

const CLAUDE_MODELS: Record<string, string> = {
  "claude-3.5-haiku":   "claude-3-5-haiku-20241022",
  "claude-4-sonnet":    "claude-3-5-sonnet-20241022",
  "claude-4-opus":      "claude-opus-4-5-20250514",
  "claude-4.1-opus":    "claude-opus-4-5-20250514",
  "claude-4.5-sonnet":  "claude-3-5-sonnet-20241022",
  "claude-4.5-opus":    "claude-opus-4-5-20250514",
  "claude-4.6-opus":    "claude-opus-4-5-20250514",
  "claude-4.6-sonnet":  "claude-3-5-sonnet-20241022",
};

const GEMINI_MODELS: Record<string, string> = {
  "gemini-2.0-flash":  "gemini-2.0-flash-exp",
  "gemini-2.0-pro":    "gemini-2.0-flash-exp",
  "gemini-1.5-pro":    "gemini-1.5-pro-latest",
  "gemini-1.5-flash":  "gemini-1.5-flash-latest",
};

const DEEPSEEK_MODELS: Record<string, string> = {
  "deepseek-v3":  "deepseek-chat",
  "deepseek-r1":  "deepseek-reasoner",
};

const XAI_MODELS: Record<string, string> = {
  "grok-3":       "grok-2-1212",
  "grok-3-mini":  "grok-3-mini-beta",
};

const PERPLEXITY_MODELS: Record<string, string> = {
  "sonar":      "sonar",
  "sonar-pro":  "sonar-pro",
};

// ─── Pollinations.ai model mapping (free fallback) ──────────────────────────
// Only use models confirmed available on Pollinations as of 2025
const POLLINATIONS_TEXT_MODEL: Record<string, string> = {
  chatgpt:    "openai",
  claude:     "openai",
  gemini:     "openai",
  deepseek:   "deepseek",
  grok:       "openai",
  perplexity: "openai",
  default:    "openai",
};

// ─── SSE / stream helpers ────────────────────────────────────────────────────

async function* parseOpenAIStream(res: Response): AsyncGenerator<string> {
  // No streaming body — parse as a single JSON or text response
  if (!res.body) {
    const text = await res.text();
    try {
      const j = JSON.parse(text) as { choices?: Array<{ message?: { content?: string }; delta?: { content?: string } }> };
      const t = j.choices?.[0]?.message?.content ?? j.choices?.[0]?.delta?.content;
      if (t) yield t;
    } catch {
      if (text.trim()) yield text.trim();
    }
    return;
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
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
        const p = JSON.parse(raw) as { choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }> };
        const t = p.choices?.[0]?.delta?.content ?? p.choices?.[0]?.message?.content;
        if (t) yield t;
      } catch { /* skip malformed lines */ }
    }
  }
}

async function* openAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  systemPrompt?: string,
): AsyncGenerator<string> {
  const msgs: ChatMessage[] = [];
  if (systemPrompt?.trim()) msgs.push({ role: "system", content: systemPrompt });
  msgs.push(...messages);

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: msgs, stream: true, max_tokens: 2048 }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(e.error?.message ?? `API error ${res.status}`);
  }
  yield* parseOpenAIStream(res);
}

// ─── Pollinations.ai free text ───────────────────────────────────────────────

async function* streamPollinations(
  providerId: string,
  messages: ChatMessage[],
  systemPrompt?: string,
): AsyncGenerator<string> {
  const model = POLLINATIONS_TEXT_MODEL[providerId] ?? "openai";
  const msgs: ChatMessage[] = [];
  if (systemPrompt?.trim()) msgs.push({ role: "system", content: systemPrompt });
  msgs.push(...messages.filter((m) => m.role !== "system"));

  let yielded = false;

  // ── Attempt 1: streaming POST (OpenAI-compatible SSE) ──────────────────────
  try {
    const res = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: msgs,
        model,
        stream: true,
        seed: Math.floor(Math.random() * 999999),
      }),
    });
    if (res.ok) {
      for await (const chunk of parseOpenAIStream(res)) {
        yield chunk;
        yielded = true;
      }
    }
  } catch { /* network error / CORS — fall through to GET */ }

  if (yielded) return;

  // ── Attempt 2: simple GET endpoint (always returns plain text) ─────────────
  // Only uses the last user message — good enough for one-shot and follow-up queries.
  const lastUser = msgs.filter((m) => m.role === "user").pop()?.content ?? "";
  if (!lastUser) return;

  const sysParam = msgs.find((m) => m.role === "system")?.content ?? "";
  const getUrl = [
    `https://text.pollinations.ai/${encodeURIComponent(lastUser)}`,
    `?model=${model}`,
    `&seed=${Math.floor(Math.random() * 999999)}`,
    sysParam ? `&system=${encodeURIComponent(sysParam.slice(0, 300))}` : "",
  ].join("");

  const getRes = await fetch(getUrl);
  if (!getRes.ok) throw new Error(`Pollinations error ${getRes.status}`);
  const text = await getRes.text();
  if (text.trim()) yield text.trim();
}

// ─── Provider streaming functions ────────────────────────────────────────────

async function* streamOpenAI(modelId: string, messages: ChatMessage[], sys?: string): AsyncGenerator<string> {
  if (!K.openai) {
    yield* streamPollinations("chatgpt", messages, sys);
    return;
  }
  yield* openAICompatible("https://api.openai.com/v1", K.openai, OPENAI_MODELS[modelId] ?? "gpt-4o-mini", messages, sys);
}

async function* streamClaude(modelId: string, messages: ChatMessage[], sys?: string): AsyncGenerator<string> {
  if (!K.anthropic) {
    yield* streamPollinations("claude", messages, sys);
    return;
  }

  const model = CLAUDE_MODELS[modelId] ?? "claude-3-5-haiku-20241022";
  const body: Record<string, unknown> = {
    model,
    max_tokens: 2048,
    messages: messages.filter((m) => m.role !== "system"),
    stream: true,
  };
  if (sys?.trim()) body.system = sys;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": K.anthropic,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(e.error?.message ?? `Anthropic error ${res.status}`);
  }

  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const p = JSON.parse(line.slice(6)) as { type?: string; delta?: { type?: string; text?: string } };
        if (p.type === "content_block_delta" && p.delta?.type === "text_delta" && p.delta.text) {
          yield p.delta.text;
        }
      } catch { /* skip */ }
    }
  }
}

async function* streamGemini(modelId: string, messages: ChatMessage[], sys?: string): AsyncGenerator<string> {
  if (!K.google) {
    yield* streamPollinations("gemini", messages, sys);
    return;
  }

  const model = GEMINI_MODELS[modelId] ?? "gemini-1.5-flash-latest";
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

  const body: Record<string, unknown> = { contents };
  if (sys?.trim()) body.systemInstruction = { parts: [{ text: sys }] };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${K.google}&alt=sse`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(e.error?.message ?? `Gemini error ${res.status}`);
  }

  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
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
        const text = p.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) yield text;
      } catch { /* skip */ }
    }
  }
}

async function* streamDeepSeek(modelId: string, messages: ChatMessage[], sys?: string): AsyncGenerator<string> {
  if (!K.deepseek) {
    yield* streamPollinations("deepseek", messages, sys);
    return;
  }
  yield* openAICompatible("https://api.deepseek.com/v1", K.deepseek, DEEPSEEK_MODELS[modelId] ?? "deepseek-chat", messages, sys);
}

async function* streamGrok(modelId: string, messages: ChatMessage[], sys?: string): AsyncGenerator<string> {
  if (!K.xai) {
    yield* streamPollinations("grok", messages, sys);
    return;
  }
  yield* openAICompatible("https://api.x.ai/v1", K.xai, XAI_MODELS[modelId] ?? "grok-2-1212", messages, sys);
}

async function* streamPerplexity(modelId: string, messages: ChatMessage[], sys?: string): AsyncGenerator<string> {
  if (!K.perplexity) {
    yield* streamPollinations("perplexity", messages, sys);
    return;
  }
  yield* openAICompatible("https://api.perplexity.ai", K.perplexity, PERPLEXITY_MODELS[modelId] ?? "sonar", messages, sys);
}

// ─── Public: unified text streaming ─────────────────────────────────────────

export async function* streamAI(
  providerId: string,
  subModelId: string,
  messages: ChatMessage[],
  systemPrompt?: string,
): AsyncGenerator<string> {
  switch (providerId) {
    case "chatgpt":    yield* streamOpenAI(subModelId, messages, systemPrompt);     break;
    case "claude":     yield* streamClaude(subModelId, messages, systemPrompt);     break;
    case "gemini":     yield* streamGemini(subModelId, messages, systemPrompt);     break;
    case "deepseek":   yield* streamDeepSeek(subModelId, messages, systemPrompt);   break;
    case "grok":       yield* streamGrok(subModelId, messages, systemPrompt);       break;
    case "perplexity": yield* streamPerplexity(subModelId, messages, systemPrompt); break;
    default:           yield* streamPollinations(providerId, messages, systemPrompt); break;
  }
}

// Backward-compat alias
export const streamChatCompletion = (
  modelId: string,
  messages: ChatMessage[],
  sys?: string,
) => streamAI("chatgpt", modelId, messages, sys);

// ─── Image generation ────────────────────────────────────────────────────────

function toDallESize(aspect: string): "1024x1024" | "1792x1024" | "1024x1792" {
  if (aspect === "16:9" || aspect === "21:9") return "1792x1024";
  if (aspect === "9:16" || aspect === "3:4" || aspect === "4:5") return "1024x1792";
  return "1024x1024";
}

function pollinationsImageUrl(prompt: string, aspect = "1:1"): string {
  const [w, h] =
    aspect === "16:9" || aspect === "21:9"  ? [1344, 768]  :
    aspect === "9:16" || aspect === "4:5"   ? [768, 1344]  :
    aspect === "4:3"                        ? [1152, 864]  :
    aspect === "3:4"                        ? [864, 1152]  :
                                              [1024, 1024];
  const encoded = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 999999);
  // nologo=true removes the Pollinations watermark; enhance=false skips extra AI processing for faster response
  return `https://image.pollinations.ai/prompt/${encoded}?width=${w}&height=${h}&seed=${seed}&nologo=true&model=flux`;
}

/**
 * Generate an image.
 * Uses DALL-E 3 if VITE_OPENAI_API_KEY is set, otherwise uses Pollinations.ai (free).
 */
export async function generateImageDallE(prompt: string, aspect = "1:1"): Promise<string[]> {
  // Free fallback: Pollinations.ai generates real AI images with no key
  if (!K.openai) {
    const url = pollinationsImageUrl(prompt, aspect);
    // Return the URL directly — the browser fetches the actual image
    return [url];
  }

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${K.openai}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size: toDallESize(aspect), response_format: "url" }),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { error?: { message?: string } };
    // Fallback to Pollinations on API error too
    if (res.status === 429 || res.status === 402 || res.status === 401) {
      return [pollinationsImageUrl(prompt, aspect)];
    }
    throw new Error(e.error?.message ?? `DALL-E error ${res.status}`);
  }
  const data = await res.json() as { data: Array<{ url: string }> };
  return data.data.map((img) => img.url);
}

// ─── ElevenLabs TTS ──────────────────────────────────────────────────────────

const EL_VOICE_IDS: Record<string, string> = {
  "Dmitry D":  "pNInz6obpgDQGcFmaJgB",
  "Mikhail K": "TxGEqnHWrfWFTfGW9XjX",
  "Sergey V":  "VR6AewLTigWG4xSOukaG",
  "Anton R":   "ErXwobaYiN019PkySvjV",
  "Anna S":    "EXAVITQu4vr4xnSDxMaL",
  "Elena V":   "21m00Tcm4TlvDq8ikWAM",
  "Maria T":   "MF3mGyEYCl7XYWbV9V6O",
  "Olga N":    "AZnzlk1XvdvUeBnXmlld",
  "James":     "TxGEqnHWrfWFTfGW9XjX",
  "Sarah":     "21m00Tcm4TlvDq8ikWAM",
  "Alex":      "ErXwobaYiN019PkySvjV",
  "Emily":     "MF3mGyEYCl7XYWbV9V6O",
};

// ─── Free TTS fallback (StreamElements, no key required) ─────────────────────

const SE_VOICES: Record<string, string> = {
  "Dmitry D":  "Brian",
  "Mikhail K": "Brian",
  "Sergey V":  "Matthew",
  "Anton R":   "Joey",
  "Anna S":    "Amy",
  "Elena V":   "Amy",
  "Maria T":   "Salli",
  "Olga N":    "Kimberly",
  "James":     "Brian",
  "Sarah":     "Amy",
  "Alex":      "Matthew",
  "Emily":     "Joanna",
};

function textToSpeechFree(text: string, voiceName: string): string {
  const voice = SE_VOICES[voiceName] ?? "Brian";
  // StreamElements has ~500 char limit — truncate at a sentence boundary
  const truncated = text.length > 450
    ? text.slice(0, 450).replace(/[^.!?]*$/, "").trim() || text.slice(0, 450)
    : text;
  // Return URL directly — <audio src="..."> loads cross-origin audio without CORS restrictions.
  // No fetch() needed, so no CORS preflight, guaranteed to work from any origin.
  return `https://api.streamelements.com/kappa/v2/speech?voice=${encodeURIComponent(voice)}&text=${encodeURIComponent(truncated)}`;
}

/**
 * Convert text to speech.
 * Uses ElevenLabs when key is set; falls back to StreamElements free TTS otherwise.
 */
export async function textToSpeech(
  text: string,
  voiceName = "Anna S",
  modelId = "eleven_multilingual_v2",
): Promise<string> {
  if (!K.elevenlabs) {
    return textToSpeechFree(text, voiceName);
  }

  const voiceId = EL_VOICE_IDS[voiceName] ?? "EXAVITQu4vr4xnSDxMaL";
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": K.elevenlabs,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true },
    }),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { detail?: { message?: string } };
    throw new Error(e.detail?.message ?? `ElevenLabs error ${res.status}`);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export function hasOpenAIKey(): boolean { return !!K.openai; }
