import { Play, Pause, Copy, Share2, Download, Heart, RefreshCw, Volume2, AlertCircle } from "lucide-react";
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
  images?: { width: number; height: number }[];
  imageUrls?: string[];
  aspect?: string;
  quality?: string;
  videoUrl?: string;
  duration?: string;
  resolution?: string;
  audioDuration?: string;
  audioUrl?: string;
}

interface Props {
  generations: MediaGeneration[];
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const WAVE_BARS = Array.from({ length: 36 }, (_, i) =>
  Math.round(22 + Math.abs(Math.sin(i * 1.7)) * 65 + Math.abs(Math.cos(i * 0.9)) * 15),
);

// ─── Audio ────────────────────────────────────────────────────────────────────

function AudioResult({ gen }: { gen: MediaGeneration }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  // "ready" = audio loaded OK  |  "synth" = fell back to browser TTS  |  "error" = both failed
  const [mode, setMode] = useState<"ready" | "synth" | "error">("ready");
  const [synthPlaying, setSynthPlaying] = useState(false);

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  // ── Browser TTS fallback ────────────────────────────────────────────────────
  const toggleSynth = () => {
    if (!("speechSynthesis" in window)) { setMode("error"); return; }
    if (synthPlaying) {
      window.speechSynthesis.cancel();
      setSynthPlaying(false);
    } else {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(gen.prompt.slice(0, 600));
      utt.rate = 0.9;
      utt.lang = /[а-яё]/i.test(gen.prompt) ? "ru-RU" : "en-US";
      utt.onstart = () => setSynthPlaying(true);
      utt.onend = () => setSynthPlaying(false);
      utt.onerror = () => { setSynthPlaying(false); setMode("error"); };
      window.speechSynthesis.speak(utt);
    }
  };

  // ── External audio player ───────────────────────────────────────────────────
  const toggleAudio = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) el.pause();
    else el.play().catch(() => setMode("synth"));
  };

  if (!gen.audioUrl || mode === "synth" || mode === "error") {
    const hasSynth = "speechSynthesis" in window;
    return (
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={hasSynth ? toggleSynth : undefined}
            disabled={!hasSynth || mode === "error"}
            className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), #ff7a3d)" }}
          >
            {synthPlaying
              ? <Pause className="w-4 h-4" fill="currentColor" />
              : <Volume2 className="w-4 h-4" />}
          </button>

          <div className="flex-1 min-w-0">
            {synthPlaying ? (
              <div className="flex items-center gap-[2px] h-8">
                {WAVE_BARS.slice(0, 28).map((h, i) => (
                  <div
                    key={i}
                    className="w-[3px] rounded-full"
                    style={{
                      height: `${Math.max(15, h * 0.6)}%`,
                      background: "linear-gradient(to top, hsl(var(--primary)), #ff7a3d)",
                      animation: `pulse ${0.4 + (i % 5) * 0.08}s ease-in-out infinite alternate`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  {mode === "error" ? "Аудио недоступно" : "Воспроизвести через браузер"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {mode === "synth"
                    ? "TTS-сервис недоступен — используется голос браузера"
                    : mode === "error"
                    ? "Нет поддержки синтеза речи"
                    : "Нажмите для прослушивания"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Normal audio player
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
        onError={() => setMode("synth")} /* external TTS failed → switch to browser TTS */
      />

      <div className="flex items-center gap-3">
        <button
          onClick={toggleAudio}
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

        <span className="text-[11px] font-mono tabular-nums shrink-0" style={{ color: "var(--text-tertiary)" }}>
          {fmt(progress * duration)} / {fmt(duration || 0)}
        </span>
      </div>

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
        <Download className="w-3.5 h-3.5" /> Скачать MP3
      </a>
    </div>
  );
}

// ─── Image ────────────────────────────────────────────────────────────────────

function ImageResult({ gen }: { gen: MediaGeneration }) {
  const images = gen.images && gen.images.length > 0 ? gen.images : [{ width: 512, height: 512 }];
  const aspect = gen.aspect?.replace(":", "/") ?? "1/1";
  const [status, setStatus] = useState<Record<number, "pending" | "loading" | "done" | "error">>({});
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    gen.imageUrls?.forEach((_, i) => {
      // Stagger when each tile actually starts fetching — firing several
      // requests to the free image API in the same tick makes rate-limiting
      // (429s) far more likely than spacing them out a little.
      const startDelay = i * 500;
      timers.push(
        setTimeout(() => setStatus((p) => (p[i] ? p : { ...p, [i]: "loading" })), startDelay),
      );
      timers.push(
        setTimeout(
          () => setStatus((p) => (p[i] === "loading" ? { ...p, [i]: "error" } : p)),
          startDelay + 90_000,
        ),
      );
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
        const st = status[i] ?? (i === 0 ? "loading" : "pending");
        return (
          <div
            key={i}
            className="relative rounded-xl overflow-hidden"
            style={{ background: "var(--bg-pill)", aspectRatio: aspect }}
          >
            {url && st !== "error" ? (
              <>
                {(st === "loading" || st === "pending") && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, var(--bg-card), var(--bg-pill))" }}
                  >
                    <div className="w-7 h-7 rounded-full border-2 border-white/20 border-t-orange-400 animate-spin" />
                    <span className="text-[11px] font-mono opacity-50">Генерирую… ~5–10с</span>
                  </div>
                )}
                {/* Only mount the <img> (and thus start its network request) once its staggered turn arrives */}
                {st !== "pending" && (
                  <img
                    key={retryKey}
                    src={url}
                    alt={gen.prompt}
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                    style={{ opacity: st === "done" ? 1 : 0 }}
                    onLoad={() => setStatus((p) => ({ ...p, [i]: "done" }))}
                    onError={() => setStatus((p) => ({ ...p, [i]: "error" }))}
                  />
                )}
                {st === "done" && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center bg-black/50 hover:bg-black/70 transition-colors"
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

// Smaller Google CDN files — reliable, public domain
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

// Picsum poster: a stable, instant-loading image keyed to the prompt
function posterUrl(prompt: string, w = 640, h = 360): string {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) hash = (hash * 31 + prompt.charCodeAt(i)) >>> 0;
  return `https://picsum.photos/seed/${hash % 1000}/${w}/${h}`;
}

function VideoResult({ gen }: { gen: MediaGeneration }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Two independent booleans — much simpler than a string state machine
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const src = gen.videoUrl ?? pickDemoVideo(gen.prompt);
  const isDemo = !gen.videoUrl;
  const aspectStyle = gen.aspect
    ? { aspectRatio: gen.aspect.replace(":", "/") }
    : { aspectRatio: "16/9" };

  const [posterW, posterH] =
    gen.aspect === "9:16" || gen.aspect === "4:5" ? [360, 640] :
    gen.aspect === "1:1"                          ? [480, 480] :
                                                    [640, 360];

  const toggle = () => {
    const el = videoRef.current;
    if (!el || isBuffering || failed) return; // ignore clicks while buffering or broken
    if (isPlaying) {
      el.pause();
    } else {
      setIsBuffering(true);
      // preload="none" means the browser hasn't downloaded anything yet —
      // el.play() triggers the download + buffering. The spinner shows until
      // onPlaying (first frame decoded and rendered) fires.
      el.play().catch(() => setIsBuffering(false));
    }
  };

  const retry = () => {
    setFailed(false);
    setIsBuffering(false);
    setRetryKey((k) => k + 1); // remounts <video> so it re-attempts the network fetch
  };

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{ ...aspectStyle, background: "#0a0a1a" }}
    >
      <video
        key={retryKey}
        ref={videoRef}
        src={src}
        /* poster shows instantly — no black screen before play */
        poster={posterUrl(gen.prompt, posterW, posterH)}
        className="w-full h-full object-cover"
        playsInline
        /* preload="none" = nothing downloaded until user presses play */
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        /* onWaiting fires when video stalls mid-playback */
        onWaiting={() => setIsBuffering(true)}
        /* onPlaying fires when first decoded frame is actually rendered */
        onPlaying={() => { setIsPlaying(true); setIsBuffering(false); }}
        onCanPlay={() => setIsBuffering(false)}
        onError={() => { setIsBuffering(false); setFailed(true); }}
      />

      {/* Subtle vignette so controls are always readable */}
      {!isPlaying && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.08) 55%, transparent 100%)",
          }}
        />
      )}

      {failed ? (
        /* Visible error state — previously onError just silently cleared the
           spinner, leaving a video that looked idle but could never play. */
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
        >
          <AlertCircle className="w-7 h-7 text-white/70" />
          <span className="text-[12px] text-white/80">Видео не удалось загрузить</span>
          <button
            onClick={retry}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg transition-colors"
            style={{ background: "rgba(232,84,32,0.9)", color: "white" }}
          >
            <RefreshCw className="w-3 h-3" /> Повторить
          </button>
        </div>
      ) : (
        /* Single clickable overlay — shows play OR spinner OR pause-on-hover */
        <button
          onClick={toggle}
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "transparent", cursor: isBuffering ? "wait" : "pointer" }}
          aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
        >
          {isBuffering ? (
            /* Spinner while buffering after play clicked */
            <div className="w-14 h-14 rounded-full border-[3px] border-white/20 border-t-white animate-spin" />
          ) : isPlaying ? (
            /* Pause button visible only on hover while playing */
            <div className="opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center w-12 h-12 rounded-full bg-black/50">
              <Pause className="w-5 h-5 text-white" fill="currentColor" />
            </div>
          ) : (
            /* Play button — always visible when not playing and not buffering */
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-105"
              style={{
                background: "rgba(232,84,32,0.95)",
                boxShadow:
                  "0 8px 32px rgba(0,0,0,0.5), 0 0 0 4px rgba(255,255,255,0.15)",
              }}
            >
              <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
            </div>
          )}
        </button>
      )}

      {gen.duration && (
        <span className="absolute bottom-2 right-2 font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded bg-black/70 text-white pointer-events-none z-10">
          {gen.duration}
        </span>
      )}
      {isDemo && (
        <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded font-medium bg-black/70 text-white/80 pointer-events-none z-10">
          Превью
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
