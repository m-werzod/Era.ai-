interface GenerationLoaderProps {
  type: "text" | "image" | "video" | "audio";
  model?: string;
  progress?: number; // 0–1
}

const messages: Record<GenerationLoaderProps["type"], string[]> = {
  text:  ["Генерирую ответ"],
  image: ["Создаю изображение", "Прорисовываю детали", "Финализирую качество"],
  video: ["Анализирую запрос", "Генерирую кадры", "Рендеринг сцены", "Применяю эффекты", "Финализирую видео"],
  audio: ["Обрабатываю текст", "Синтезирую голос", "Финализирую аудио"],
};

export function GenerationLoader({ type, model, progress }: GenerationLoaderProps) {
  const steps = messages[type];
  const stepIdx = progress != null ? Math.min(steps.length - 1, Math.floor(progress * steps.length)) : 0;
  const pct = Math.round((progress ?? 0) * 100);

  return (
    <div className="max-w-[780px] mx-auto px-4 py-6">
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        {/* Top row: spinner + label */}
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 shrink-0">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="17" fill="none" stroke="var(--c-line)" strokeWidth="2" />
              <circle
                cx="20"
                cy="20"
                r="17"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="107"
                strokeDashoffset={progress != null ? 107 - progress * 107 : undefined}
                className={progress != null ? undefined : "animate-progress-ring"}
                style={{ transition: "stroke-dashoffset 0.3s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[14px] font-bold gradient-accent-text">
              {progress != null ? `${pct}%` : "E"}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{steps[stepIdx]}…</span>
              {model && (
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded-full text-muted-foreground"
                  style={{ background: "var(--bg-pill)", border: "1px solid var(--border-primary)" }}
                >
                  {model}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))] animate-pulse"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Progress bar (shown when progress is provided) */}
        {progress != null && (
          <div className="space-y-1.5">
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-pill)" }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, hsl(var(--primary)), #ff7a3d)",
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground font-mono tabular-nums">
              <span>Шаг {stepIdx + 1} / {steps.length}</span>
              <span>{pct}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
