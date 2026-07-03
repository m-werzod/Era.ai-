import { Play, Pause, Copy, Share2, Download, Heart, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useCopyToast } from "@/features/copy-toast";
import { ModelGlyph } from "@/shared/ui/era/ModelGlyph";

export interface MediaGeneration {
  id: string;
  prompt: string;
  model: string;
  subModel: string;
  createdAt: Date;
  type: "image" | "video" | "audio";
  // image
  images?: { width: number; height: number }[];
  imageUrls?: string[];
  aspect?: string;
  quality?: string;
  // video
  videoUrl?: string;
  duration?: string;
  resolution?: string;
  // audio
  audioDuration?: string;
  audioUrl?: string;
}

interface Props {
  generations: MediaGeneration[];
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* Deterministic waveform bars */
const WAVE_BARS = Array.from({ length: 36 }, (_, i) =>
  Math.round(22 + Math.abs(Math.sin(i * 1.7)) * 65 + Math.abs(Math.cos(i * 0.9)) * 15),
);

// ─── Audio ────────────────────────────────────────────────────────────────────

function AudioResult({ gen }: { gen: MediaGeneration }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState(false);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); }
    else {
      const p = el.play();
      if (p) p.catch(() => setAudioError(true));
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  if (gen.audioUrl && !audioError) {
    return (
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}
      >
        <audio
          ref={audioRef}
          src={gen.audioUrl}
          onTimeUpdate={() => {
            const el = audioRef.current;
            if (el) setProgress(el.currentTime / (el.duration || 1));
          }}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
          onEnded={() => { setPlaying(false); setProgress(0); }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => setAudioError(true)}
        />

        {/* Waveform + play row */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)), #ff7a3d)",
              boxShadow: "0 4px 14px rgba(232,84,32,0.4)",
            }}
          >
            {playing
              ? <Pause className="w-4 h-4" fill="currentColor" />
              : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />}
          </button>

          {/* Animated waveform */}
          <div className="flex-1 flex items-center gap-[2px] h-10 overflow-hidden">
            {WAVE_BARS.map((h, i) => {
              const filled = i / WAVE_BARS.length < progress;
              return (
                <div
                  key={i}
                  className="w-[3px] rounded-full shrink-0 transition-colors"
                  style={{
                    height: `${Math.max(15, h)}%`,
                    background: filled
                      ? "linear-gradient(to top, hsl(var(--primary)), #ff7a3d)"
                      : "color-mix(in oklab, hsl(var(--muted-foreground)) 35%, transparent)",
                  }}
                />
              );
            })}
          </div>

          <span
            className="text-[11px] font-mono tabular-nums shrink-0"
            style={{ color: "var(--text-tertiary)" }}
          >
            {fmt(progress * duration)} / {fmt(duration)}
          </span>
        </div>

        {/* Seek bar */}
        <input
          type="range" min={0} max={1} step={0.001} value={progress}
          onChange={(e) => {
            const el = audioRef.current;
            const v = parseFloat(e.target.value);
            if (el) el.currentTime = v * (el.duration || 0);
            setProgress(v);
          }}
          className="w-full h-1 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: "hsl(var(--primary))" }}
        />

        <a
          href={gen.audioUrl}
          download={`era2-audio-${gen.id}.mp3`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Скачать MP3
        </a>
      </div>
    );
  }

  /* Placeholder / error state */
  return (
    <div
      className="rounded-xl p-3 flex items-center gap-3"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}
    >
      <button
        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: "hsl(var(--primary))" }}
      >
        <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
      </button>
      <div className="flex-1 flex items-center gap-[2px] h-9">
        {WAVE_BARS.map((h, i) => (
          <span
            key={i}
            className="w-[3px] rounded-sm"
            style={{ height: `${h}%`, background: "hsl(var(--primary) / 0.55)" }}
          />
        ))}
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span
          className="font-mono text-[11px] tabular-nums shrink-0"
          style={{ color: "var(--text-tertiary)" }}
        >
          {gen.audioDuration || "0:30"}
        </span>
        {audioError && (
          <span className="text-[10px] text-red-400">Ошибка загрузки</span>
        )}
      </div>
    </div>
  );
}

// ─── Image ────────────────────────────────────────────────────────────────────

function ImageResult({ gen }: { gen: MediaGeneration }) {
  const images = gen.images && gen.images.length > 0 ? gen.images : [{ width: 512, height: 512 }];
  const aspect = gen.aspect?.replace(":", "/") ?? "1/1";
  const [status, setStatus] = useState<Record<number, "loading" | "done" | "error">>({});
  // key to force re-mount the img (retry)
  const [retryKey, setRetryKey] = useState(0);

  // Safety timeout — if image doesn't load in 90 s, show error state with retry
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    gen.imageUrls?.forEach((_, i) => {
      if ((status[i] ?? "loading") === "loading") {
        timers.push(
          setTimeout(() => setStatus((p) => p[i] === "loading" ? { ...p, [i]: "error" } : p), 90_000),
        );
      }
    });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gen.imageUrls, retryKey]);

  const retry = (i: number) => {
    setStatus((p) => ({ ...p, [i]: "loading" }));
    setRetryKey((k) => k + 1);
  };

  return (
    <div className={`grid gap-2 ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
      {images.map((img, i) => {
        const url = gen.imageUrls?.[i];
        const st = status[i] ?? "loading";
        return (
          <div
            key={i}
            className="relative rounded-xl overflow-hidden"
            style={{ background: "var(--bg-pill)", aspectRatio: aspect }}
          >
            {url && st !== "error" ? (
              <>
                {/* Loading shimmer */}
                {st === "loading" && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, var(--bg-card), var(--bg-pill))" }}
                  >
                    <div className="w-7 h-7 rounded-full border-2 border-white/20 border-t-orange-400 animate-spin" />
                    <span className="text-[11px] font-mono opacity-50">Генерирую… ~5–10с</span>
                  </div>
                )}

                {/* Image — becomes visible once loaded */}
                <img
                  key={retryKey} /* new key forces re-fetch on retry */
                  src={url}
                  alt={gen.prompt}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                  style={{ opacity: st === "done" ? 1 : 0 }}
                  onLoad={() => setStatus((p) => ({ ...p, [i]: "done" }))}
                  onError={() => setStatus((p) => ({ ...p, [i]: "error" }))}
                />

                {/* Open-original button */}
                {st === "done" && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center bg-black/50 hover:bg-black/70 transition-colors"
                    title="Открыть оригинал"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )}
              </>
            ) : (
              /* Error / no-URL state */
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-40">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <span className="text-[11px] font-mono opacity-50">
                  {url ? "Ошибка загрузки" : "Изображение"}
                </span>
                {url && (
                  <button
                    onClick={() => retry(i)}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg transition-colors"
                    style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}
                  >
                    <RefreshCw className="w-3 h-3" /> Повторить
                  </button>
                )}
              </div>
            )}

            {/* Dimension badge */}
            <span className="absolute bottom-2 right-2 font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded bg-black/60 text-white pointer-events-none">
              {img.width}×{img.height}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Video ────────────────────────────────────────────────────────────────────

// Smaller, faster-loading demo clips (all < 30 MB)
const DEMO_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
];

function pickDemoVideo(prompt: string): string {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) hash = (hash * 31 + prompt.charCodeAt(i)) >>> 0;
  return DEMO_VIDEOS[hash % DEMO_VIDEOS.length];
}

function VideoResult({ gen }: { gen: MediaGeneration }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // "idle" → metadata loaded, ready to play (shows first frame)
  // "buffering" → user clicked play, waiting for canplay
  // "playing" → actively playing
  // "paused" → was playing, now paused
  const [state, setState] = useState<"loading" | "idle" | "buffering" | "playing" | "paused">("loading");

  const src = gen.videoUrl ?? pickDemoVideo(gen.prompt);
  const isDemo = !gen.videoUrl;
  const aspectStyle = gen.aspect ? { aspectRatio: gen.aspect.replace(":", "/") } : { aspectRatio: "16/9" };

  const toggle = () => {
    const el = videoRef.current;
    if (!el) return;
    if (state === "playing") {
      el.pause();
    } else {
      setState("buffering");
      el.play().catch(() => setState("idle"));
    }
  };

  const isPlaying = state === "playing";
  const showSpinner = state === "loading" || state === "buffering";
  const showPlay = !isPlaying && state !== "loading";

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{ ...aspectStyle, background: "linear-gradient(135deg, #1a1a2e, #16213e)" }}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        playsInline
        preload="metadata"    /* downloads first frame + duration; NOT the full file */
        onLoadedMetadata={() => setState("idle")}
        onCanPlay={() => { if (state === "buffering") setState("playing"); }}
        onPlay={() => setState("playing")}
        onPause={() => setState("paused")}
        onEnded={() => setState("idle")}
        onWaiting={() => { if (state === "playing") setState("buffering"); }}
        onError={() => setState("idle")}
      />

      {/* Gradient overlay so play button is always readable */}
      {!isPlaying && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)" }}
        />
      )}

      {/* Spinner — only while loading metadata or buffering after play */}
      {showSpinner && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
        </div>
      )}

      {/* Play / Pause — clickable overlay */}
      <button
        onClick={toggle}
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: "transparent" }}
        aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
        disabled={state === "loading"}
      >
        {showPlay && (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-105"
            style={{
              background: "rgba(232,84,32,0.95)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 4px rgba(255,255,255,0.15)",
            }}
          >
            <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
          </div>
        )}
        {isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
              <Pause className="w-5 h-5 text-white" fill="currentColor" />
            </div>
          </div>
        )}
      </button>

      {/* Duration badge */}
      {gen.duration && (
        <span className="absolute bottom-2 right-2 font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded bg-black/70 text-white pointer-events-none z-10">
          {gen.duration}
        </span>
      )}

      {/* Demo badge */}
      {isDemo && (
        <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded font-medium bg-black/70 text-white/80 pointer-events-none z-10">
          Демо-видео
        </span>
      )}
    </div>
  );
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

export function MediaChatFeed({ generations }: Props) {
  const copy = useCopyToast();
  return (
    <div className="max-w-[780px] mx-auto py-6 px-4 space-y-6">
      {generations.map((gen) => (
        <div key={gen.id} className="space-y-4">
          {/* User bubble */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex justify-end"
          >
            <div
              className="max-w-[75%] rounded-[14px] rounded-br-[4px] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
              style={{ background: "hsl(var(--primary))", color: "#fff" }}
            >
              {gen.prompt}
            </div>
          </motion.div>

          {/* Assistant bubble */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            className="flex gap-3"
          >
            <ModelGlyph name={gen.model} size={24} className="mt-1" />
            <div className="flex-1 min-w-0 max-w-[75%]">
              <div
                className="text-[11px] mb-1 font-medium flex items-center gap-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                <span>{gen.subModel || gen.model}</span>
                <span>·</span>
                <span className="font-mono tabular-nums">{formatTime(gen.createdAt)}</span>
              </div>

              {gen.type === "image" && <ImageResult gen={gen} />}
              {gen.type === "video" && <VideoResult gen={gen} />}
              {gen.type === "audio" && <AudioResult gen={gen} />}

              <div
                className="flex items-center gap-2 mt-1.5 font-mono text-[11px] tabular-nums"
                style={{ color: "var(--text-muted)" }}
              >
                {gen.aspect && <span>{gen.aspect}</span>}
                {gen.quality && <span>· {gen.quality}</span>}
                {gen.resolution && <span>· {gen.resolution}</span>}
                {gen.duration && gen.type !== "video" && <span>· {gen.duration}</span>}
              </div>

              <div className="flex items-center gap-1 mt-2 -ml-2">
                <button
                  onClick={() => copy(gen.prompt, "Промпт скопирован")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[12px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" /> Промпт
                </button>
                <button
                  onClick={() => copy(`https://era2.ai/share/${gen.id}`, "Ссылка скопирована")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[12px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5" /> Поделиться
                </button>
                <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[12px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <Download className="h-3.5 w-3.5" /> Скачать
                </button>
                <button className="inline-flex items-center justify-center w-7 h-7 rounded-[8px] text-muted-foreground hover:text-primary hover:bg-secondary transition-colors">
                  <Heart className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      ))}
    </div>
  );
}
