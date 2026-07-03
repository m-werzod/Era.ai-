import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Paperclip, Send, Globe, Brain, Copy, RefreshCw, ThumbsUp, ThumbsDown, Settings, Trash2 } from "lucide-react";
import { textProviders, textQuickActions } from "@/entities/ai-model";
import { streamAI, type ChatMessage } from "@/services/aiApi";
import { TextModelSelector } from "@/features/model-picker";
import { ModelIcon } from "@/features/model-picker";
import { ModelGlyph } from "@/shared/ui/era/ModelGlyph";
import { cn } from "@/shared/lib/utils";
import { useTheme } from "@/features/theme-switcher";

import { ModelCarousel, type CarouselModel } from "@/components/workspace/ModelCarousel";
import { WorkspaceTabs } from "@/components/workspace/WorkspaceTabs";
import { AssistantsList } from "@/components/text/AssistantsList";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const textCarouselModels: CarouselModel[] = [
  { name: "ChatGPT", desc: "Универсальный ИИ от OpenAI", gradient: "linear-gradient(135deg, #10a37f, #1a7f5a)", badge: "TOP" },
  { name: "Claude", desc: "Глубокий анализ от Anthropic", gradient: "linear-gradient(135deg, #d4a27f, #8b5e3c)", badge: "TOP" },
  { name: "Gemini", desc: "Мультимодальный ИИ от Google", gradient: "linear-gradient(135deg, #4285f4, #1a73e8)", badge: "NEW" },
  { name: "DeepSeek", desc: "Reasoning модель", gradient: "linear-gradient(135deg, #536dfe, #304ffe)", badge: "NEW" },
  { name: "Grok", desc: "ИИ от xAI с поиском", gradient: "linear-gradient(135deg, #1d1d1f, #3a3a3c)" },
  { name: "Perplexity", desc: "Поиск с источниками", gradient: "linear-gradient(135deg, #20b2aa, #008080)" },
  { name: "Qwen", desc: "Мощный китайский ИИ", gradient: "linear-gradient(135deg, #7c3aed, #5b21b6)" },
];

const textUseCases = [
  "Написать пост для Telegram",
  "Составить бизнес-план",
  "Перевести документ",
  "Проанализировать данные",
  "Написать код на Python",
  "Составить резюме",
  "Рерайт статьи",
  "Генерация идей для стартапа",
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
  providerId?: string;
}


const systemPromptPresets = ["Копирайтер", "Программист", "Учитель", "Переводчик"];

// Theme-aware color tokens
function useColors() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  return {
    bg: "var(--bg-primary)",
    headerBorder: "var(--border-primary)",
    pillBg: "var(--bg-pill)",
    pillBorder: "var(--border-primary)",
    pillBorderActive: "hsl(var(--primary))",
    textPrimary: "var(--text-primary)",
    textSecondary: "var(--text-secondary)",
    textMuted: "var(--text-muted)",
    textTertiary: "var(--text-tertiary)",
    textAccent: "hsl(var(--primary))",
    inputBg: "var(--bg-card)",
    inputBorder: "var(--border-primary)",
    inputBorderFocus: "hsl(var(--primary))",
    inputShadowFocus: "0 0 0 3px rgba(232, 84, 32, 0.12), 0 1px 4px rgba(0,0,0,0.2)",
    cardBg: "var(--bg-card)",
    cardBorder: "var(--border-primary)",
    cardBorderHover: "var(--border-hover)",
    cardBgHover: "var(--bg-card-hover)",
    badgeBg: "var(--bg-tag)",
    userBubble: "hsl(var(--primary))",
    assistantBubble: "var(--bg-card)",
    assistantText: "var(--text-primary)",
    sendActive: "hsl(var(--primary))",
    sendActiveShadow: "0 2px 8px rgba(232, 84, 32, 0.3)",
    sendInactive: "var(--bg-pill)",
    sendInactiveText: "var(--text-muted)",
    divider: "var(--border-primary)",
    dot: "var(--text-muted)",
    footerText: "var(--text-muted)",
    dark,
  };
}

const TextPage = () => {
  const [providerId, setProviderId] = useState("chatgpt");
  const [subModelId, setSubModelId] = useState("gpt-5.2");
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [systemDrawerOpen, setSystemDrawerOpen] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [inputFocused, setInputFocused] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelTriggerRef = useRef<HTMLButtonElement>(null);

  const provider = textProviders.find((p) => p.id === providerId) || textProviders[0];
  const subModel = provider.subModels.find((s) => s.id === subModelId) || provider.subModels[0];
  const hasMessages = messages.length > 0;
  const c = useColors();

  useEffect(() => { document.title = "ERA2 — Текстовые нейросети"; }, []);
  useEffect(() => {
    if (messages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  useEffect(() => {
    const saved = sessionStorage.getItem("era2_draft_text");
    if (saved) setInput(saved);
  }, []);
  useEffect(() => {
    sessionStorage.setItem("era2_draft_text", input);
  }, [input]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
  }, []);

  const streamResponse = useCallback(async (history: ChatMessage[], assistantId: string) => {
    setIsGenerating(true);
    try {
      const stream = streamAI(providerId, subModelId, history, systemPrompt || undefined);
      for await (const chunk of stream) {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Неизвестная ошибка";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: `Ошибка: ${msg}` } : m,
        ),
      );
    } finally {
      setIsGenerating(false);
    }
  }, [providerId, subModelId, systemPrompt]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isGenerating) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      model: subModel.name,
      providerId: provider.id,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    sessionStorage.removeItem("era2_draft_text");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const history: ChatMessage[] = [...messages, userMsg].map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    await streamResponse(history, assistantId);
  };

  const handleRegenerate = useCallback(async () => {
    if (isGenerating || messages.length === 0) return;

    // Find the last assistant message index and slice history up to (not including) it
    let lastAssistantIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") { lastAssistantIdx = i; break; }
    }
    const history = lastAssistantIdx >= 0 ? messages.slice(0, lastAssistantIdx) : messages;
    if (history.length === 0 || history[history.length - 1].role !== "user") return;

    const assistantId = Date.now().toString();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      model: subModel.name,
      providerId: provider.id,
    };
    setMessages(lastAssistantIdx >= 0
      ? [...messages.slice(0, lastAssistantIdx), assistantMsg]
      : [...messages, assistantMsg]
    );

    const chatHistory: ChatMessage[] = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    await streamResponse(chatHistory, assistantId);
  }, [isGenerating, messages, subModel, provider, streamResponse]);

  const handleSelect = (pId: string, sId: string) => {
    setProviderId(pId);
    setSubModelId(sId);
    const p = textProviders.find((pr) => pr.id === pId);
    const s = p?.subModels.find((sm) => sm.id === sId);
    if (s && !s.hasWeb) setWebSearch(false);
    if (s && !s.hasThinking) setThinking(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  return (
    <ErrorBoundary>
    <div className="flex flex-col h-[calc(100vh-var(--header-height,64px))] mesh-background" style={{ background: c.bg }}>
      {/* ─── Chat area ─── */}
      <div className="flex-1 overflow-y-auto relative z-[1]">
        <div className="sticky top-0 z-20 flex justify-center py-2" style={{ background: "color-mix(in oklab, var(--c-bg) 85%, transparent)", backdropFilter: "blur(12px)" }}>
          <div className="relative">
            <button
              ref={modelTriggerRef}
              onClick={() => setSelectorOpen(!selectorOpen)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-medium hover:opacity-90 transition-opacity"
              style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-line)", color: c.textPrimary }}
            >
              <ModelGlyph name={provider.name} size={20} />
              <span>{provider.name}</span>
              <span className="text-muted-foreground">·</span>
              <span className="font-mono text-xs" style={{ color: "var(--c-accent-2)" }}>{subModel.name}</span>
              <span className="font-mono text-xs" style={{ color: "var(--c-accent-2)" }}>{subModel.credits} cr</span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>
            <TextModelSelector
              open={selectorOpen}
              onClose={() => setSelectorOpen(false)}
              selectedProviderId={providerId}
              selectedSubModelId={subModelId}
              onSelect={(pId, sId) => { handleSelect(pId, sId); setSelectorOpen(false); }}
              anchorRef={modelTriggerRef}
            />
          </div>
        </div>
        {!hasMessages ? (
          <WelcomeScreen providerId={providerId} providerName={provider.name} subModelName={subModel.name} onQuickAction={handleQuickAction} colors={c} />
        ) : (
          <ChatMessages messages={messages} isGenerating={isGenerating} currentModel={subModel.name} currentProviderId={provider.id} colors={c} onRegenerate={handleRegenerate} />
        )}
        <div ref={chatEndRef} />

        {/* Каталог — только до первого сообщения */}
        {!hasMessages && (
          <div className="px-3 sm:px-4 lg:px-8 py-6 space-y-6 border-t mt-8 sm:mt-16" style={{ borderColor: c.divider }}>
            <ModelCarousel
              models={textCarouselModels}
              onSelect={(name) => {
                const p = textProviders.find((pr) => pr.name.toLowerCase() === name.toLowerCase());
                if (p) handleSelect(p.id, p.subModels[0]?.id ?? subModelId);
              }}
            />

            <div>
              <h2 className="text-base font-bold mb-4" style={{ color: c.textPrimary }}>Сценарии использования</h2>
              <div className="flex flex-wrap gap-2">
                {textUseCases.map((uc) => (
                  <button
                    key={uc}
                    onClick={() => setInput(uc)}
                    className="px-4 py-2 rounded-[14px] text-[13px] transition-colors"
                    style={{ background: c.pillBg, border: `1px solid ${c.pillBorder}`, color: c.textSecondary }}
                  >
                    {uc}
                  </button>
                ))}
              </div>
            </div>

            <AssistantsList
              onPick={(name) => {
                setSystemPrompt(`Ты — ${name}. Отвечай в этой роли.`);
                setInput("");
                setTimeout(() => textareaRef.current?.focus(), 50);
              }}
            />
          </div>
        )}

      </div>

      {/* ─── Input area ─── */}
      <div className="shrink-0 px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2 relative z-[1]" style={{ background: c.bg }}>
        <div className="max-w-[780px] mx-auto">
          <WorkspaceTabs variant="attached" />

          <div className={isGenerating ? "glow-border-active" : "glow-border-idle"}>
          <div
            className="rounded-[22px] rounded-tl-none p-3 sm:p-4 transition-all duration-200"
            style={{
              background: c.inputBg,
              border: inputFocused ? `1px solid ${c.inputBorderFocus}` : `1px solid ${c.inputBorder}`,
              boxShadow: inputFocused ? c.inputShadowFocus : "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Напишите сообщение..."
              rows={3}
              className="w-full bg-transparent outline-none resize-none text-[15px] min-h-[80px] max-h-[240px] py-3 px-1"
              style={{ color: c.textPrimary, fontFamily: '"DM Sans", sans-serif' }}
            />

            <div className="flex items-center gap-2 mt-2 pt-2 overflow-x-auto no-scrollbar" style={{ borderTop: `1px solid ${c.divider}` }}>
              <button
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: c.textSecondary }}
                onMouseEnter={(e) => { e.currentTarget.style.background = c.pillBg; e.currentTarget.style.color = c.textPrimary; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = c.textSecondary; }}
                title="Прикрепить файл"
              >
                <Paperclip className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => setSystemDrawerOpen(true)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: systemPrompt ? c.textAccent : c.textSecondary }}
                onMouseEnter={(e) => { e.currentTarget.style.background = c.pillBg; e.currentTarget.style.color = c.textPrimary; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                title="Системный промпт"
              >
                <Settings className="w-4.5 h-4.5" />
              </button>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: c.textSecondary }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = c.pillBg; e.currentTarget.style.color = "#ef4444"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = c.textSecondary; }}
                  title="Очистить чат"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              )}

              <button
                onClick={() => setSelectorOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
                style={{ background: c.pillBg, border: `1px solid ${c.pillBorder}` }}
              >
                <ModelIcon providerId={providerId} size={16} />
                <span className="font-medium" style={{ color: c.textPrimary }}>{subModel.name}</span>
                <span style={{ color: c.dot }}>·</span>
                <span className="font-mono" style={{ color: c.textAccent, background: c.badgeBg, padding: "1px 6px", borderRadius: "999px" }}>{subModel.credits} cr</span>
                <ChevronDown className="w-3 h-3" style={{ color: c.textSecondary }} />
              </button>

              {subModel.hasWeb && (
                <button
                  onClick={() => setWebSearch(!webSearch)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border transition-colors",
                    webSearch
                      ? ""
                      : ""
                  )}
                  style={
                    webSearch
                      ? { borderColor: c.textAccent, background: `${c.textAccent}1a`, color: c.textAccent }
                      : { background: c.pillBg, borderColor: c.pillBorder, color: c.textSecondary }
                  }
                >
                  <Globe className="w-3 h-3" /> Веб
                </button>
              )}

              {subModel.hasThinking && (
                <button
                  onClick={() => setThinking(!thinking)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border transition-colors",
                  )}
                  style={
                    thinking
                      ? { borderColor: c.textAccent, background: `${c.textAccent}1a`, color: c.textAccent }
                      : { background: c.pillBg, borderColor: c.pillBorder, color: c.textSecondary }
                  }
                >
                  <Brain className="w-3 h-3" /> Думать
                </button>
              )}

              <button
                onClick={handleSend}
                disabled={!input.trim() || isGenerating}
                className={cn(
                  "ml-auto w-9 h-9 flex items-center justify-center rounded-xl transition-all",
                  input.trim() && !isGenerating ? "text-white" : "cursor-not-allowed"
                )}
                style={
                  input.trim() && !isGenerating
                    ? { background: c.sendActive, boxShadow: c.sendActiveShadow }
                    : { background: c.sendInactive, color: c.sendInactiveText }
                }
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          </div>

        </div>
      </div>

      {systemDrawerOpen && (
        <SystemPromptDrawer value={systemPrompt} onChange={setSystemPrompt} onClose={() => setSystemDrawerOpen(false)} />
      )}
    </div>
    </ErrorBoundary>
  );
};

/* ─── Lightweight markdown renderer ─── */
function MdText({ text }: { text: string }) {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      result.push(
        <pre key={i} className="my-2 rounded-xl overflow-x-auto p-3 text-[12px] font-mono leading-relaxed" style={{ background: "var(--bg-pill)" }}>
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      i++;
      continue;
    }

    // Headings
    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^(#{1,3})/)?.[1].length ?? 1;
      const txt = line.replace(/^#{1,3}\s/, "");
      const cls = level === 1 ? "text-base font-bold mt-3 mb-1" : level === 2 ? "text-[15px] font-semibold mt-2 mb-1" : "text-sm font-semibold mt-1.5 mb-0.5";
      result.push(<p key={i} className={cls}>{inlineFormat(txt)}</p>);
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      result.push(
        <blockquote key={i} className="border-l-2 pl-3 my-1 italic text-muted-foreground" style={{ borderColor: "hsl(var(--primary))" }}>
          {inlineFormat(line.slice(2))}
        </blockquote>
      );
      i++;
      continue;
    }

    // Unordered list
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s/, ""));
        i++;
      }
      result.push(
        <ul key={i} className="my-1 pl-4 list-disc space-y-0.5">
          {items.map((item, j) => <li key={j}>{inlineFormat(item)}</li>)}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      result.push(
        <ol key={i} className="my-1 pl-4 list-decimal space-y-0.5">
          {items.map((item, j) => <li key={j}>{inlineFormat(item)}</li>)}
        </ol>
      );
      continue;
    }

    // Empty line → paragraph break
    if (line.trim() === "") {
      result.push(<div key={i} className="h-1.5" />);
      i++;
      continue;
    }

    // Normal paragraph line
    result.push(<p key={i} className="leading-relaxed">{inlineFormat(line)}</p>);
    i++;
  }

  return <div className="space-y-0.5 text-sm">{result}</div>;
}

function inlineFormat(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Matches: `code`, **bold**, *italic*
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("`"))
      parts.push(<code key={key++} className="px-1 py-0.5 rounded text-[12px] font-mono" style={{ background: "var(--bg-pill)", color: "hsl(var(--primary))" }}>{token.slice(1, -1)}</code>);
    else if (token.startsWith("**"))
      parts.push(<strong key={key++} className="font-semibold">{token.slice(2, -2)}</strong>);
    else
      parts.push(<em key={key++} className="italic">{token.slice(1, -1)}</em>);
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}

/* ─── Welcome screen ─── */

function WelcomeScreen({ providerId, providerName, subModelName, onQuickAction, colors: c }: {
  providerId: string; providerName: string; subModelName: string; onQuickAction: (prompt: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <ModelIcon providerId={providerId} size={40} className="mb-3" />
        <h1
          className="text-[22px] font-semibold mb-0.5 tracking-tight"
          style={{ color: c.textPrimary }}
        >
          {providerName}
        </h1>
        <p className="text-[13px] mb-0.5 font-mono tabular-nums" style={{ color: c.textSecondary }}>{subModelName}</p>
        <p className="text-[13px] mb-5" style={{ color: c.textTertiary }}>Единый доступ к 90+ нейросетям</p>

        <div className="flex flex-wrap justify-center gap-2 max-w-lg">
          {textQuickActions.map((action) => (
            <button
              key={action.title}
              onClick={() => onQuickAction(action.prompt)}
              className="px-4 py-2.5 rounded-full text-[13px] text-muted-foreground font-medium transition-all hover:text-foreground"
              style={{ border: "1px solid hsl(var(--border))", background: "hsl(var(--secondary))" }}
            >
              {action.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Chat messages ─── */

function ChatMessages({ messages, isGenerating, currentModel, currentProviderId, colors: c, onRegenerate }: {
  messages: Message[]; isGenerating: boolean; currentModel: string; currentProviderId: string;
  colors: ReturnType<typeof useColors>;
  onRegenerate?: () => void;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyMsg = (id: string, content: string) => {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="max-w-[780px] mx-auto py-6 px-4 space-y-5">
      {messages.map((msg) => (
        <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
          {msg.role === "assistant" && (
            <ModelIcon providerId={msg.providerId || currentProviderId} size={24} className="mt-1" />
          )}
          <div className="max-w-[75%]">
            {msg.role === "assistant" && (
              <div className="text-[11px] mb-1 font-medium" style={{ color: c.textMuted }}>{msg.model || currentModel}</div>
            )}
            <div
              className={cn(
                "rounded-[14px] px-4 py-3 text-sm leading-relaxed",
                msg.role === "user" ? "rounded-br-[4px] whitespace-pre-wrap" : ""
              )}
              style={
                msg.role === "user"
                  ? { background: c.userBubble, color: "#FFFFFF" }
                  : { background: c.assistantBubble, color: c.assistantText }
              }
            >
              {msg.role === "user" ? msg.content : <MdText text={msg.content} />}
            </div>
            {msg.role === "assistant" && (
              <div className="flex items-center gap-1 mt-1.5 opacity-0 hover:opacity-100 transition-opacity">
                <button
                  onClick={() => copyMsg(msg.id, msg.content)}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                  style={{ color: copiedId === msg.id ? c.textAccent : c.textSecondary }}
                  title="Копировать"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onRegenerate}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                  style={{ color: c.textSecondary }}
                  title="Регенерировать"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button className="w-7 h-7 rounded-md flex items-center justify-center transition-colors" style={{ color: c.textSecondary }} title="Нравится">
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button className="w-7 h-7 rounded-md flex items-center justify-center transition-colors" style={{ color: c.textSecondary }} title="Не нравится">
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {isGenerating && (
        <div className="flex gap-3">
          <ModelIcon providerId={currentProviderId} size={24} className="mt-1" />
          <div>
            <div className="text-[11px] mb-1 font-medium" style={{ color: c.textMuted }}>{currentModel}</div>
            <div className="flex items-center gap-1.5 px-2 py-3">
              {[0, 150, 300].map((delay) => (
                <span key={delay} className="w-2 h-2 rounded-full animate-bounce" style={{ background: c.textAccent, animationDelay: `${delay}ms` }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── System prompt drawer ─── */

function SystemPromptDrawer({ value, onChange, onClose }: { value: string; onChange: (v: string) => void; onClose: () => void }) {
  const c = useColors();
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl shadow-2xl p-5 max-h-[280px] overflow-y-auto border-t"
      style={{ background: c.bg, borderColor: c.headerBorder }}
    >
      <div className="max-w-[780px] mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: c.textPrimary }}>Системный промпт</h3>
          <button onClick={onClose} className="text-sm" style={{ color: c.textSecondary }}>✕</button>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ты профессиональный помощник..."
          rows={4}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
          style={{ background: c.inputBg, border: `1px solid ${c.inputBorder}`, color: c.textPrimary }}
        />
        <div className="flex items-center gap-2 flex-wrap">
          {systemPromptPresets.map((p) => (
            <button
              key={p}
              onClick={() => onChange(`Ты ${p.toLowerCase()}`)}
              className="px-3 py-1.5 rounded-full text-xs transition-colors"
              style={{ background: c.pillBg, border: `1px solid ${c.pillBorder}`, color: c.textSecondary }}
            >
              {p}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <button onClick={() => onChange("")} className="px-4 py-1.5 rounded-full text-xs transition-colors" style={{ background: c.pillBg, border: `1px solid ${c.pillBorder}`, color: c.textSecondary }}>
              Очистить
            </button>
            <button onClick={onClose} className="px-4 py-1.5 rounded-full text-xs text-white font-medium" style={{ background: c.sendActive }}>
              Применить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TextPage;
