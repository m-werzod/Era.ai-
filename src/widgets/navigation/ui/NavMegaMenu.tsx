import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@/shared/routing";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  MessageSquare,
  PenLine,
  Globe,
  FileSearch,
  Languages,
  Code,
  Lightbulb,
  Image as ImageIcon,
  Camera,
  Paintbrush,
  Eraser,
  Scissors,
  ZoomIn,
  RefreshCw,
  Video,
  Sparkles,
  Film,
  User,
  TrendingUp,
  Music,
  AudioLines,
  Mic,
  Volume2,
  Activity,
  VolumeX,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { ModelGlyph } from "@/shared/ui/era/ModelGlyph";

interface FeatureItem {
  icon: LucideIcon;
  title: string;
  desc: string;
}
interface ModelItem {
  name: string;
  desc: string;
  badge?: string;
}
interface TabConfig {
  key: string;
  label: string;
  route: string;
  features?: FeatureItem[];
  models?: ModelItem[];
  modelsTitle?: string;
}

function buildTabs(t: (key: string) => string): TabConfig[] {
  const ft = (tab: string, id: string) => ({
    title: t(`nav.tabs.${tab}.features.${id}.title`),
    desc: t(`nav.tabs.${tab}.features.${id}.desc`),
  });
  const md = (tab: string, id: string) => t(`nav.tabs.${tab}.models.${id}.desc`);

  return [
    {
      key: "text",
      label: t("nav.tabs.text.label"),
      route: "/text",
      features: [
        { icon: MessageSquare, ...ft("text", "chat") },
        { icon: PenLine, ...ft("text", "write") },
        { icon: Globe, ...ft("text", "search") },
        { icon: FileSearch, ...ft("text", "docs") },
        { icon: Languages, ...ft("text", "translate") },
        { icon: Code, ...ft("text", "code") },
        { icon: Lightbulb, ...ft("text", "ideas") },
      ],
      models: [
        { name: "ChatGPT", desc: md("text", "chatgpt") },
        { name: "Claude", desc: md("text", "claude") },
        { name: "Gemini", desc: md("text", "gemini") },
        { name: "Perplexity", desc: md("text", "perplexity") },
        { name: "Grok", desc: md("text", "grok") },
        { name: "Qwen", desc: md("text", "qwen") },
        { name: "DeepSeek", desc: md("text", "deepseek") },
      ],
    },
    {
      key: "design",
      label: t("nav.tabs.design.label"),
      route: "/design",
      features: [
        { icon: ImageIcon, ...ft("design", "createImage") },
        { icon: Camera, ...ft("design", "aiPhoto") },
        { icon: Paintbrush, ...ft("design", "photoEditor") },
        { icon: Eraser, ...ft("design", "removeBg") },
        { icon: Scissors, ...ft("design", "removeObject") },
        { icon: ZoomIn, ...ft("design", "upscale") },
        { icon: RefreshCw, ...ft("design", "faceSwap") },
      ],
      models: [
        { name: "Nano Banana", desc: md("design", "nanoBanana") },
        { name: "MidJourney", desc: md("design", "midjourney") },
        { name: "Seedream", desc: md("design", "seedream") },
        { name: "GPT Image", desc: md("design", "gptImage") },
        { name: "Flux", desc: md("design", "flux") },
        { name: "Imagen", desc: md("design", "imagen") },
        { name: "Higgsfield", desc: md("design", "higgsfield") },
      ],
    },
    {
      key: "video",
      label: t("nav.tabs.video.label"),
      route: "/video",
      features: [
        { icon: Video, ...ft("video", "createVideo") },
        { icon: Sparkles, ...ft("video", "animatePhoto") },
        { icon: Film, ...ft("video", "videoEditor") },
        { icon: User, ...ft("video", "aiAvatar") },
        { icon: TrendingUp, ...ft("video", "upscale") },
      ],
      models: [
        { name: "Kling", desc: md("video", "kling") },
        { name: "Veo", desc: md("video", "veo") },
        { name: "Runway", desc: md("video", "runway") },
        { name: "Seedance", desc: md("video", "seedance") },
        { name: "Hailuo", desc: md("video", "hailuo") },
        { name: "Wan", desc: md("video", "wan") },
        { name: "Sora", desc: md("video", "sora") },
        { name: "HeyGen", desc: md("video", "heygen") },
        { name: "Hedra", desc: md("video", "hedra") },
      ],
    },
    {
      key: "audio",
      label: t("nav.tabs.audio.label"),
      route: "/audio",
      features: [
        { icon: Music, ...ft("audio", "createSong") },
        { icon: AudioLines, ...ft("audio", "textToSpeech") },
        { icon: Mic, ...ft("audio", "voiceClone") },
        { icon: Volume2, ...ft("audio", "voiceChange") },
        { icon: Activity, ...ft("audio", "soundFx") },
        { icon: VolumeX, ...ft("audio", "denoise") },
      ],
      models: [
        { name: "ElevenLabs", desc: md("audio", "elevenlabs") },
        { name: "Suno", desc: md("audio", "suno"), badge: "TOP" },
      ],
    },
    {
      key: "agents",
      label: t("nav.tabs.agents.label"),
      route: "/agents",
      modelsTitle: t("nav.common.poweredByHeading"),
      features: [
        { icon: TrendingUp, ...ft("agents", "marketer") },
        { icon: PenLine, ...ft("agents", "copywriter") },
        { icon: Code, ...ft("agents", "developer") },
        { icon: Languages, ...ft("agents", "translator") },
        { icon: FileSearch, ...ft("agents", "lawyer") },
        { icon: Lightbulb, ...ft("agents", "ideas") },
      ],
      models: [
        { name: "ChatGPT", desc: md("agents", "chatgpt") },
        { name: "Claude", desc: md("agents", "claude") },
        { name: "Gemini", desc: md("agents", "gemini") },
        { name: "DeepSeek", desc: md("agents", "deepseek") },
      ],
    },
  ];
}

export function NavMegaMenu() {
  const { t } = useTranslation();
  const TABS = buildTabs(t);
  const [active, setActive] = useState<string | null>(null);
  const navigate = useNavigate();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = (key: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActive(key);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActive(null), 200);
  };

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  const activeTab = TABS.find((t) => t.key === active && t.features);

  return (
    <div className="relative flex items-center gap-1" onMouseLeave={scheduleClose}>
      {TABS.map((tab) => {
        const isHot = active === tab.key && tab.features;
        const handleEnter = () => {
          if (tab.features) {
            if (closeTimer.current) clearTimeout(closeTimer.current);
            closeTimer.current = setTimeout(() => open(tab.key), active ? 80 : 0);
          } else {
            if (closeTimer.current) clearTimeout(closeTimer.current);
            setActive(null);
          }
        };
        return (
          <Link
            key={tab.key}
            to={tab.route}
            onMouseEnter={handleEnter}
            onClick={() => setActive(null)}
            className="px-3 h-9 inline-flex items-center rounded-full text-sm font-medium transition-colors"
            style={{
              color: isHot ? "var(--c-fg)" : "var(--c-fg-dim)",
              background: isHot ? "var(--c-bg-2)" : "transparent",
            }}
          >
            {tab.label}
          </Link>
        );
      })}

      <AnimatePresence>
        {activeTab && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onMouseEnter={() => open(activeTab.key)}
            onMouseLeave={scheduleClose}
            className="absolute left-0 top-full z-50 pt-1"
            style={{ width: "min(720px, 92vw)" }}
          >
            <div
              className="grid grid-cols-2 gap-6 p-5"
              style={{
                background: "var(--c-bg-1)",
                border: "1px solid var(--c-line)",
                borderRadius: 22,
                boxShadow: "0 30px 80px -30px rgba(0,0,0,0.6)",
              }}
            >
              {/* Features */}
              <div className="flex flex-col">
                <div
                  className="font-mono text-[11px] uppercase tracking-[0.14em] mb-3"
                  style={{ color: "var(--c-fg-mute)" }}
                >
                  {t("nav.common.featuresHeading")}
                </div>
                <div className="flex flex-col gap-0.5">
                  {activeTab.features!.map((f) => (
                    <button
                      key={f.title}
                      onClick={() => {
                        setActive(null);
                        navigate({ to: activeTab.route });
                      }}
                      className="flex items-center gap-3 px-3 py-2 rounded-[8px] text-left transition-colors hover:bg-[var(--c-bg-2)]"
                    >
                      <span
                        className="inline-flex items-center justify-center shrink-0"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: "var(--c-bg-2)",
                          color: "var(--c-fg-dim)",
                        }}
                      >
                        <f.icon size={18} strokeWidth={1.75} />
                      </span>
                      <span className="flex flex-col min-w-0">
                        <span
                          className="text-[14px] font-medium leading-tight truncate"
                          style={{ color: "var(--c-fg)" }}
                        >
                          {f.title}
                        </span>
                        <span
                          className="text-[12px] truncate"
                          style={{ color: "var(--c-fg-mute)" }}
                        >
                          {f.desc}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
                <Link
                  to={activeTab.route}
                  onClick={() => setActive(null)}
                  className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium px-3"
                  style={{ color: "var(--c-accent)" }}
                >
                  {t("nav.common.allFeatures")} <ArrowRight size={12} />
                </Link>
              </div>

              {/* Models */}
              <div className="flex flex-col">
                <div
                  className="font-mono text-[11px] uppercase tracking-[0.14em] mb-3"
                  style={{ color: "var(--c-fg-mute)" }}
                >
                  {activeTab.modelsTitle || t("nav.common.modelsHeading")}
                </div>
                <div className="flex flex-col gap-0.5">
                  {activeTab.models!.map((m) => (
                    <button
                      key={m.name}
                      onClick={() => {
                        setActive(null);
                        navigate({ to: activeTab.route });
                      }}
                      className="flex items-center gap-3 px-3 py-2 rounded-[8px] text-left transition-colors hover:bg-[var(--c-bg-2)]"
                    >
                      <ModelGlyph name={m.name} size={32} />
                      <span className="flex flex-col min-w-0">
                        <span
                          className="text-[14px] font-medium leading-tight truncate flex items-center"
                          style={{ color: "var(--c-fg)" }}
                        >
                          {m.name}
                          {m.badge && (
                            <span
                              className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full ml-1"
                              style={{
                                background: "rgba(232,84,32,0.12)",
                                color: "hsl(var(--primary))",
                              }}
                            >
                              {m.badge}
                            </span>
                          )}
                        </span>
                        <span
                          className="text-[12px] truncate"
                          style={{ color: "var(--c-fg-mute)" }}
                        >
                          {m.desc}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
                <Link
                  to="/toolkit"
                  onClick={() => setActive(null)}
                  className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium px-3"
                  style={{ color: "var(--c-accent)" }}
                >
                  {t("nav.common.allModels")} <ArrowRight size={12} />
                </Link>
                {activeTab.key === "text" && (
                  <Link
                    to="/tools/text-generation"
                    onClick={() => setActive(null)}
                    className="flex items-center gap-1.5 mt-3 pt-3 mx-3 text-[12px] font-medium transition-colors hover:opacity-80 border-t"
                    style={{
                      borderColor: "hsl(var(--border))",
                      color: "hsl(var(--primary))",
                    }}
                  >
                    {t("nav.common.allTextModels")} →
                  </Link>
                )}
                {activeTab.key === "design" && (
                  <Link
                    to="/tools/image-generation"
                    onClick={() => setActive(null)}
                    className="flex items-center gap-1.5 mt-3 pt-3 mx-3 text-[12px] font-medium transition-colors hover:opacity-80 border-t"
                    style={{
                      borderColor: "hsl(var(--border))",
                      color: "hsl(var(--primary))",
                    }}
                  >
                    {t("nav.common.allImageModels")} →
                  </Link>
                )}
                {activeTab.key === "video" && (
                  <Link
                    to="/tools/video-generation"
                    onClick={() => setActive(null)}
                    className="flex items-center gap-1.5 mt-3 pt-3 mx-3 text-[12px] font-medium transition-colors hover:opacity-80 border-t"
                    style={{
                      borderColor: "hsl(var(--border))",
                      color: "hsl(var(--primary))",
                    }}
                  >
                    {t("nav.common.allVideoModels")} →
                  </Link>
                )}
                {activeTab.key === "audio" && (
                  <Link
                    to="/tools/audio-generation"
                    onClick={() => setActive(null)}
                    className="flex items-center gap-1.5 mt-3 pt-3 mx-3 text-[12px] font-medium transition-colors hover:opacity-80 border-t"
                    style={{
                      borderColor: "hsl(var(--border))",
                      color: "hsl(var(--primary))",
                    }}
                  >
                    {t("nav.common.allAudioModels")} →
                  </Link>
                )}
                {activeTab.key === "agents" && (
                  <Link
                    to="/tools/agents"
                    onClick={() => setActive(null)}
                    className="flex items-center gap-1.5 mt-3 pt-3 mx-3 text-[12px] font-medium transition-colors hover:opacity-80 border-t"
                    style={{
                      borderColor: "hsl(var(--border))",
                      color: "hsl(var(--primary))",
                    }}
                  >
                    {t("nav.common.allAgents")} →
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
