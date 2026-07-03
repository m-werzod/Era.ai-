import { Play, Pause, Copy, Share2, Download, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { useCopyToast } from "@/features/copy-toast";
import { ModelGlyph } from "@/shared/ui/era/ModelGlyph";
import { Placeholder } from "@/shared/ui/era";

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

function AudioResult({ gen }: { gen: MediaGeneration }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play(); setPlaying(true); }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  if (gen.audioUrl) {
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
        />

        {/* Waveform + play row */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), #ff7a3d)", boxShadow: "0 4px 14px rgba(232,84,32,0.4)" }}
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
                  className="w-[3px] rounded-full shrink-0 transition-all"
                  style={{
                    height: `${Math.max(15, playing ? h * (0.6 + 0.4 * Math.sin(Date.now() / 200 + i)) : h)}%`,
                    background: filled
                      ? "linear-gradient(to top, hsl(var(--primary)), #ff7a3d)"
                      : "color-mix(in oklab, hsl(var(--muted-foreground)) 35%, transparent)",
                    animation: playing ? `pulse ${0.4 + (i % 5) * 0.08}s ease-in-out infinite alternate` : "none",
                  }}
                />
              );
            })}
          </div>

          <span className="text-[11px] font-mono tabular-nums shrink-0" style={{ color: "var(--text-tertiary)" }}>
            {playing || progress > 0 ? fmt(progress * duration) : fmt(duration)} / {fmt(duration)}
          </span>
        </div>

        {/* Seek bar */}
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={progress}
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

  /* Placeholder when no real audio yet */
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
      <span className="font-mono text-[11px] tabular-nums shrink-0" style={{ color: "var(--text-tertiary)" }}>
        {gen.audioDuration || "0:30"}
      </span>
    </div>
  );
}

function ImageResult({ gen }: { gen: MediaGeneration }) {
  const images = gen.images && gen.images.length > 0 ? gen.images : [{ width: 1024, height: 1024 }];
  const aspect = gen.aspect?.replace(":", "/") ?? "1/1";
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});

  return (
    <div className={`grid gap-2 ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
      {images.map((img, i) => {
        const url = gen.imageUrls?.[i];
        return (
          <div key={i} className="relative rounded-xl overflow-hidden bg-secondary">
            {url ? (
              <>
                {/* Shimmer while Pollinations image loads */}
                {!loaded[i] && (
                  <div
                    className="absolute inset-0 animate-pulse"
                    style={{ background: "linear-gradient(135deg, var(--bg-card), var(--bg-pill))", aspectRatio: aspect }}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-40">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                      <span className="text-[11px] font-mono">Генерирую…</span>
                    </div>
                  </div>
                )}
                <img
                  src={url}
                  alt={gen.prompt}
                  className="w-full h-auto object-cover block transition-opacity duration-500"
                  style={{ aspectRatio: aspect, opacity: loaded[i] ? 1 : 0 }}
                  loading="lazy"
                  onLoad={() => setLoaded((prev) => ({ ...prev, [i]: true }))}
                />
              </>
            ) : (
              <Placeholder tone={i % 2 === 0 ? "rust" : "ember"} aspect="1/1" label="IMAGE" />
            )}
            <span className="absolute bottom-2 right-2 font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded bg-black/60 text-white">
              {img.width}×{img.height}
            </span>
            {url && (
              <a
                href={url}
                download={`era2-${gen.id}-${i}.png`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center bg-black/50 hover:bg-black/70 transition-colors"
                title="Скачать"
                onClick={(e) => e.stopPropagation()}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 15V3M8 11l4 4 4-4M3 19h18" />
                </svg>
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Curated demo video clips matched to common topics — returned as an array so
// we can pick one based on the prompt to give a relevant-feeling result.
const DEMO_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
];

function pickDemoVideo(prompt: string): string {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) hash = (hash * 31 + prompt.charCodeAt(i)) >>> 0;
  return DEMO_VIDEOS[hash % DEMO_VIDEOS.length];
}

function VideoResult({ gen }: { gen: MediaGeneration }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const demoSrc = pickDemoVideo(gen.prompt);

  const toggle = () => {
    const el = videoRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play(); setPlaying(true); }
  };

  return (
    <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "16/9" }}>
      <video
        ref={videoRef}
        src={demoSrc}
        className="w-full h-full object-cover"
        playsInline
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
      {/* Overlay with play/pause */}
      <button
        onClick={toggle}
        className="absolute inset-0 flex items-center justify-center transition-opacity"
        style={{ opacity: playing ? 0 : 1 }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: "rgba(232,84,32,0.92)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
        >
          <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
        </div>
      </button>
      {playing && (
        <button
          onClick={toggle}
          className="absolute inset-0"
          style={{ background: "transparent" }}
        />
      )}
      {gen.duration && (
        <span className="absolute bottom-2 right-2 font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded bg-black/60 text-white">
          {gen.duration}
        </span>
      )}
      <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded font-medium bg-black/60 text-white/70">
        Демо-видео
      </span>
    </div>
  );
}

export function MediaChatFeed({ generations }: Props) {
  const copy = useCopyToast();
  return (
    <div className="max-w-[780px] mx-auto py-6 px-4 space-y-6">
      {generations.map((gen) => (
        <div key={gen.id} className="space-y-4">
          {/* User message */}
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

          {/* Assistant response */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            className="flex gap-3"
          >
            <ModelGlyph name={gen.model} size={24} className="mt-1" />
            <div className="flex-1 min-w-0 max-w-[75%]">
              <div className="text-[11px] mb-1 font-medium flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                <span>{gen.subModel || gen.model}</span>
                <span>·</span>
                <span className="font-mono tabular-nums">{formatTime(gen.createdAt)}</span>
              </div>
              {gen.type === "image" && <ImageResult gen={gen} />}
              {gen.type === "video" && <VideoResult gen={gen} />}
              {gen.type === "audio" && <AudioResult gen={gen} />}
              <div className="flex items-center gap-2 mt-1.5 font-mono text-[11px] tabular-nums" style={{ color: "var(--text-muted)" }}>
                {gen.aspect && <span>{gen.aspect}</span>}
                {gen.quality && <span>· {gen.quality}</span>}
                {gen.resolution && <span>· {gen.resolution}</span>}
                {gen.duration && gen.type !== "video" && <span>· {gen.duration}</span>}
              </div>
              <div className="flex items-center gap-1 mt-2 -ml-2">
                <button
                  onClick={() => copy(gen.prompt, "Промпт скопирован")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[12px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  title="Копировать промпт"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Промпт
                </button>
                <button
                  onClick={() => copy(`https://era2.ai/share/${gen.id}`, "Ссылка скопирована")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[12px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  title="Поделиться"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Поделиться
                </button>
                <button
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[12px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  title="Скачать"
                >
                  <Download className="h-3.5 w-3.5" />
                  Скачать
                </button>
                <button
                  className="inline-flex items-center justify-center w-7 h-7 rounded-[8px] text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                  title="В избранное"
                >
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
