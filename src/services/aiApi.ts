// OpenAI API integration — streaming chat + DALL-E 3 image generation.
// Add your key to .env.local: VITE_OPENAI_API_KEY=sk-...

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
const BASE = "https://api.openai.com/v1";

// ERA2 display model IDs → real OpenAI model names
const CHAT_MODEL_MAP: Record<string, string> = {
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

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export function hasOpenAIKey(): boolean {
  return !!OPENAI_KEY;
}

/** Streaming chat completion — yields text chunks as they arrive. */
export async function* streamChatCompletion(
  modelId: string,
  messages: ChatMessage[],
  systemPrompt?: string,
): AsyncGenerator<string, void, unknown> {
  if (!OPENAI_KEY) {
    // Demo fallback when no key is configured
    const demo =
      "Это демо-режим.\n\nЧтобы получать настоящие ответы, добавьте `VITE_OPENAI_API_KEY` в файл `.env.local` в корне проекта и перезапустите сервер.";
    for (const char of demo) {
      yield char;
      await new Promise((r) => setTimeout(r, 12));
    }
    return;
  }

  const msgs: ChatMessage[] = [];
  if (systemPrompt?.trim()) msgs.push({ role: "system", content: systemPrompt });
  msgs.push(...messages);

  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODEL_MAP[modelId] ?? "gpt-4o-mini",
      messages: msgs,
      stream: true,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? `OpenAI error ${res.status}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") return;
      try {
        const parsed = JSON.parse(raw) as { choices?: [{ delta?: { content?: string } }] };
        const chunk = parsed.choices?.[0]?.delta?.content;
        if (chunk) yield chunk;
      } catch {
        // skip malformed SSE chunks
      }
    }
  }
}

// ─── Image generation ────────────────────────────────────────────────────────

function toDallESize(aspect: string): "1024x1024" | "1792x1024" | "1024x1792" {
  if (aspect === "16:9" || aspect === "21:9") return "1792x1024";
  if (aspect === "9:16" || aspect === "3:4" || aspect === "4:5") return "1024x1792";
  return "1024x1024";
}

/**
 * Generate an image with DALL-E 3.
 * Returns array of URL strings.
 * Throws Error("NO_KEY") when VITE_OPENAI_API_KEY is not set.
 */
export async function generateImageDallE(
  prompt: string,
  aspect = "1:1",
): Promise<string[]> {
  if (!OPENAI_KEY) throw new Error("NO_KEY");

  const res = await fetch(`${BASE}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: toDallESize(aspect),
      response_format: "url",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? `DALL-E error ${res.status}`);
  }

  const data = await res.json() as { data: Array<{ url: string }> };
  return data.data.map((img) => img.url);
}
