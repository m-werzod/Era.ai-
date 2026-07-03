/**
 * Multi-provider AI API service.
 * Add keys to .env.local — see .env.example for the full list.
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse OpenAI-compatible SSE stream, yield text chunks. */
async function* parseOpenAIStream(res: Response): AsyncGenerator<string> {
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
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") return;
      try {
        const p = JSON.parse(raw) as { choices?: [{ delta?: { content?: string } }] };
        const t = p.choices?.[0]?.delta?.content;
        if (t) yield t;
      } catch { /* skip */ }
    }
  }
}

/** Generic OpenAI-compatible streaming chat (OpenAI, DeepSeek, xAI, Perplexity). */
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

/** Demo fallback — types a message letter by letter when no key is configured. */
async function* demoBotReply(providerName: string, subModelName: string, userMsg: string): AsyncGenerator<string> {
  const reply = [
    `**${providerName}** (демо-режим)\n\n`,
    `Вы спросили: _"${userMsg.slice(0, 120)}${userMsg.length > 120 ? "…" : ""}"_\n\n`,
    `Чтобы получать реальные ответы от ${providerName} (${subModelName}), `,
    `добавьте нужный API-ключ в файл \`.env.local\`:\n\n`,
    providerName === "ChatGPT" ? "```\nVITE_OPENAI_API_KEY=sk-...\n```"
      : providerName === "Claude" ? "```\nVITE_ANTHROPIC_API_KEY=sk-ant-...\n```"
      : providerName === "Gemini" ? "```\nVITE_GOOGLE_API_KEY=AIza...\n```"
      : providerName === "DeepSeek" ? "```\nVITE_DEEPSEEK_API_KEY=sk-...\n```"
      : providerName === "Grok" ? "```\nVITE_XAI_API_KEY=xai-...\n```"
      : providerName === "Perplexity" ? "```\nVITE_PERPLEXITY_API_KEY=pplx-...\n```"
      : "```\nSee .env.example for the correct variable name.\n```",
    "\n\nПосле добавления ключа перезапустите сервер — и всё заработает ✓",
  ].join("");

  for (const char of reply) {
    yield char;
    await new Promise((r) => setTimeout(r, 8));
  }
}

// ─── Provider streaming functions ────────────────────────────────────────────

async function* streamOpenAI(modelId: string, messages: ChatMessage[], sys?: string): AsyncGenerator<string> {
  if (!K.openai) { yield* demoBotReply("ChatGPT", modelId, messages.at(-1)?.content ?? ""); return; }
  yield* openAICompatible("https://api.openai.com/v1", K.openai, OPENAI_MODELS[modelId] ?? "gpt-4o-mini", messages, sys);
}

async function* streamClaude(modelId: string, messages: ChatMessage[], sys?: string): AsyncGenerator<string> {
  if (!K.anthropic) { yield* demoBotReply("Claude", modelId, messages.at(-1)?.content ?? ""); return; }

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
  if (!K.google) { yield* demoBotReply("Gemini", modelId, messages.at(-1)?.content ?? ""); return; }

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
  if (!K.deepseek) { yield* demoBotReply("DeepSeek", modelId, messages.at(-1)?.content ?? ""); return; }
  yield* openAICompatible("https://api.deepseek.com/v1", K.deepseek, DEEPSEEK_MODELS[modelId] ?? "deepseek-chat", messages, sys);
}

async function* streamGrok(modelId: string, messages: ChatMessage[], sys?: string): AsyncGenerator<string> {
  if (!K.xai) { yield* demoBotReply("Grok", modelId, messages.at(-1)?.content ?? ""); return; }
  yield* openAICompatible("https://api.x.ai/v1", K.xai, XAI_MODELS[modelId] ?? "grok-2-1212", messages, sys);
}

async function* streamPerplexity(modelId: string, messages: ChatMessage[], sys?: string): AsyncGenerator<string> {
  if (!K.perplexity) { yield* demoBotReply("Perplexity", modelId, messages.at(-1)?.content ?? ""); return; }
  yield* openAICompatible("https://api.perplexity.ai", K.perplexity, PERPLEXITY_MODELS[modelId] ?? "sonar", messages, sys);
}

// ─── Public: unified text streaming ─────────────────────────────────────────

/**
 * Stream a chat completion from whichever provider matches `providerId`.
 * Falls back to a typed demo message when no API key is configured.
 */
export async function* streamAI(
  providerId: string,
  subModelId: string,
  messages: ChatMessage[],
  systemPrompt?: string,
): AsyncGenerator<string> {
  switch (providerId) {
    case "chatgpt":   yield* streamOpenAI(subModelId, messages, systemPrompt);    break;
    case "claude":    yield* streamClaude(subModelId, messages, systemPrompt);    break;
    case "gemini":    yield* streamGemini(subModelId, messages, systemPrompt);    break;
    case "deepseek":  yield* streamDeepSeek(subModelId, messages, systemPrompt); break;
    case "grok":      yield* streamGrok(subModelId, messages, systemPrompt);      break;
    case "perplexity":yield* streamPerplexity(subModelId, messages, systemPrompt);break;
    // Qwen / Alibaba — use DeepSeek key as fallback or OpenAI
    default:          yield* streamOpenAI(subModelId, messages, systemPrompt);    break;
  }
}

// Keep old name for backward-compat (TextPage might still call it)
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

/**
 * Generate an image with DALL-E 3.
 * Throws Error("NO_KEY") when VITE_OPENAI_API_KEY is not set.
 */
export async function generateImageDallE(prompt: string, aspect = "1:1"): Promise<string[]> {
  if (!K.openai) throw new Error("NO_KEY");

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${K.openai}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size: toDallESize(aspect), response_format: "url" }),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(e.error?.message ?? `DALL-E error ${res.status}`);
  }
  const data = await res.json() as { data: Array<{ url: string }> };
  return data.data.map((img) => img.url);
}

// ─── ElevenLabs TTS ──────────────────────────────────────────────────────────

/** Maps our voice display names → ElevenLabs voice IDs (free/public voices). */
const EL_VOICE_IDS: Record<string, string> = {
  "Dmitry D":  "pNInz6obpgDQGcFmaJgB", // Adam — deep male
  "Mikhail K": "TxGEqnHWrfWFTfGW9XjX", // Josh
  "Sergey V":  "VR6AewLTigWG4xSOukaG", // Arnold
  "Anton R":   "ErXwobaYiN019PkySvjV", // Antoni
  "Anna S":    "EXAVITQu4vr4xnSDxMaL", // Bella
  "Elena V":   "21m00Tcm4TlvDq8ikWAM", // Rachel
  "Maria T":   "MF3mGyEYCl7XYWbV9V6O", // Elli
  "Olga N":    "AZnzlk1XvdvUeBnXmlld", // Domi
  "James":     "TxGEqnHWrfWFTfGW9XjX", // Josh
  "Sarah":     "21m00Tcm4TlvDq8ikWAM", // Rachel
  "Alex":      "ErXwobaYiN019PkySvjV", // Antoni
  "Emily":     "MF3mGyEYCl7XYWbV9V6O", // Elli
};

/**
 * Convert text to speech via ElevenLabs.
 * Returns a blob: URL for the MP3 audio.
 * Throws Error("NO_KEY") when VITE_ELEVENLABS_API_KEY is not set.
 */
export async function textToSpeech(
  text: string,
  voiceName = "Anna S",
  modelId = "eleven_multilingual_v2",
): Promise<string> {
  if (!K.elevenlabs) throw new Error("NO_KEY");

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
