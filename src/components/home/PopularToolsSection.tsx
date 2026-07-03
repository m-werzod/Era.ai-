import { Link } from "@/shared/routing";
import {
  Image as ImageIcon,
  Video,
  MessageSquare,
  AudioLines,
  Sparkles,
  Bot,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export function PopularToolsSection() {
  const { t } = useTranslation();
  const TOOLS = [
    {
      Icon: ImageIcon,
      title: t("home.popularTools.items.images.title"),
      desc: t("home.popularTools.items.images.desc"),
      to: "/tools/image-generation",
    },
    {
      Icon: Video,
      title: t("home.popularTools.items.video.title"),
      desc: t("home.popularTools.items.video.desc"),
      to: "/tools/video-generation",
    },
    {
      Icon: MessageSquare,
      title: t("home.popularTools.items.text.title"),
      desc: t("home.popularTools.items.text.desc"),
      to: "/tools/text-generation",
    },
    {
      Icon: AudioLines,
      title: t("home.popularTools.items.audio.title"),
      desc: t("home.popularTools.items.audio.desc"),
      to: "/tools/audio-generation",
    },
    {
      Icon: Sparkles,
      title: t("home.popularTools.items.nanoBanana.title"),
      desc: t("home.popularTools.items.nanoBanana.desc"),
      to: "/tools/nano-banana",
    },
    {
      Icon: Bot,
      title: t("home.popularTools.items.agents.title"),
      desc: t("home.popularTools.items.agents.desc"),
      to: "/tools/agents",
    },
  ] as const;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">{t("home.popularTools.heading")}</h2>
        <p className="text-muted-foreground">{t("home.popularTools.subheading")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TOOLS.map(({ Icon, title, desc, to }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-2xl border p-5 transition-all"
            style={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(232, 84, 32, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "hsl(var(--border))";
            }}
          >
            <div
              className="flex items-center justify-center rounded-xl"
              style={{
                width: 40,
                height: 40,
                background: "var(--c-accent-soft)",
                color: "var(--c-accent-2)",
              }}
            >
              <Icon size={20} strokeWidth={1.8} />
            </div>

            <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
            <p
              className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed overflow-hidden"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {desc}
            </p>

            <div className="flex justify-between items-center mt-4">
              <span />
              <span className="flex items-center gap-1 text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">
                {t("home.popularTools.learnMore")}
                <ArrowRight
                  size={12}
                  className="transition-transform group-hover:translate-x-1"
                />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
