import { useState, useEffect } from "react";
import { Link, useNavigate } from "@/shared/routing";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth";
import { ArrowUp, ArrowRight, Star } from "lucide-react";
import { Eyebrow, ModelGlyph } from "@/shared/ui/era";
import { PromptWindow, type GenType } from "@/components/workspace/PromptWindow";

import { Footer } from "@/components/shared/Footer";
import { motion } from "framer-motion";
import { DesignCreativitySection } from "@/components/home/DesignCreativitySection";
import { AllModelsSection } from "@/components/home/AllModelsSection";
import { TextAssistantsSection } from "@/components/home/TextAssistantsSection";
import { ModelTagsCloud } from "@/components/home/ModelTagsCloud";
import { StartCreatingSection } from "@/components/home/StartCreatingSection";
import { LearnAIBanner } from "@/components/home/LearnAIBanner";
import { HomeFAQ } from "@/components/home/HomeFAQ";
import { ModelsMarquee } from "@/components/home/ModelsMarquee";
import { QuickActions } from "@/components/home/QuickActions";
import { HomeHowItWorks } from "@/components/home/HomeHowItWorks";
import { HomeShowcase } from "@/components/home/HomeShowcase";
import { PopularToolsSection } from "@/components/home/PopularToolsSection";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

const PROOF_MODELS = ["ChatGPT", "Claude", "Gemini", "Midjourney", "Sora", "Suno"];

const Index = () => {
  const { t } = useTranslation();
  const { isAuthed } = useAuth();
  const navigate = useNavigate();
  const ctaLink = isAuthed ? "/design" : "/auth";
  const [showTop, setShowTop] = useState(false);
  const [genType, setGenType] = useState<GenType>("image");
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    document.title = "ERA2.ai — Агрегатор нейросетей";
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    if (!isAuthed) {
      navigate({ to: "/auth" });
      return;
    }
    const routeMap: Record<GenType, string> = {
      text: "/text",
      image: "/design",
      video: "/video",
      audio: "/audio",
    };
    navigate({ to: routeMap[genType] as never });
  };

  const handlePickPrompt = (preset: string) => {
    setPrompt(preset);
    // best-effort focus into the prompt textarea (we can't touch PromptWindow)
    setTimeout(() => {
      const ta = document.querySelector<HTMLTextAreaElement>(".max-w-\\[880px\\] textarea");
      if (ta) {
        ta.focus();
        const len = ta.value.length;
        ta.setSelectionRange(len, len);
        ta.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 0);
  };

  return (
    <div className="min-w-0">
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(232,84,32,0.18) 0%, rgba(255,122,61,0.06) 40%, transparent 70%), radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "auto, 26px 26px",
            backgroundPosition: "center, center",
            maskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />
        <motion.div
          className="relative max-w-3xl mx-auto text-center px-4 pt-16 pb-10 md:pt-24 md:pb-12"
          initial="hidden"
          animate="show"
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-4 inline-block">
            <Eyebrow>{t("home.hero.eyebrow")}</Eyebrow>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-[38px] md:text-[60px] lg:text-[68px] font-bold leading-[1.02] tracking-tight mb-5 text-balance"
          >
            {t("home.hero.titleLine1")}
            <br />
            <span className="gradient-accent-text">{t("home.hero.titleLine2")}</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-7 leading-relaxed"
          >
            {t("home.hero.subtitle")}
          </motion.p>

          {/* ── CTA buttons ── */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center justify-center gap-3 mb-8"
          >
            <Link
              to={ctaLink}
              className="inline-flex items-center gap-2 h-12 px-7 rounded-full text-[15px] font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), #ff7a3d)",
                boxShadow: "0 8px 28px -6px rgba(232,84,32,0.55)",
              }}
            >
              {t("home.hero.ctaStart")}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/tools/text-generation"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full text-[15px] font-medium border transition-all hover:bg-secondary"
              style={{ borderColor: "hsl(var(--border))", color: "var(--c-fg)" }}
            >
              {t("nav.common.allModels")}
            </Link>
          </motion.div>

          {/* ── Model logos ── */}
          <motion.div
            variants={fadeUp}
            className="flex items-center justify-center gap-2 mb-6 flex-wrap"
          >
            {PROOF_MODELS.map((m) => (
              <ModelGlyph key={m} name={m} size={32} />
            ))}
            <span className="text-xs text-muted-foreground ml-1">+84 {t("nav.common.allModels").split(" ").pop()}</span>
          </motion.div>

          {/* ── Social proof pills ── */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center justify-center gap-2.5 text-sm"
          >
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}
            >
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-[#ffb27a] text-[#ffb27a]" />
                ))}
              </div>
              <span className="text-muted-foreground text-xs">{t("home.hero.badge")}</span>
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground"
              style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              90+ нейросетей
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground"
              style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Без VPN
            </div>
          </motion.div>
        </motion.div>

        {/* ─── Interactive prompt window ─── */}
        <div className="relative max-w-[780px] mx-auto px-4 pb-16 md:pb-24">
          <PromptWindow
            type={genType}
            onTypeChange={setGenType}
            prompt={prompt}
            onPromptChange={setPrompt}
            onGenerate={handleGenerate}
          />
        </div>

        {/* ─── Showcase: models carousel + use cases (per active type) ─── */}
        <div className="relative pb-12">
          <HomeShowcase type={genType} onPickPrompt={handlePickPrompt} />
        </div>
      </section>

      <ModelsMarquee />
      <QuickActions />

      {!isAuthed && <PopularToolsSection />}

      <DesignCreativitySection />
      <AllModelsSection />

      <section className="py-16 md:py-20 border-t border-border">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-[32px] font-bold mb-8 text-center">
            {t("home.categories.heading")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: t("home.categories.text"), to: "/tools/text-generation", emoji: "💬" },
              { label: t("home.categories.images"), to: "/tools/image-generation", emoji: "🎨" },
              { label: t("home.categories.video"), to: "/tools/video-generation", emoji: "🎬" },
              { label: t("home.categories.audio"), to: "/tools/audio-generation", emoji: "🎵" },
              { label: t("home.categories.agents"), to: "/tools/agents", emoji: "🤖" },
              { label: t("home.categories.nanoBanana"), to: "/tools/nano-banana", emoji: "🍌" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-secondary hover:bg-card hover:border-primary/30 transition-all"
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <TextAssistantsSection />

      <StartCreatingSection />
      <LearnAIBanner />

      <HomeHowItWorks />

      {/* ─── ERA2 ecosystem ─── */}
      <section className="bg-card border-y border-border">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-20">
          <div className="flex flex-col md:flex-row md:items-start gap-10">
            <div className="flex-1 space-y-8">
              <div>
                <h2 className="text-[28px] md:text-[36px] font-bold mb-2">
                  {t("home.ecosystem.heading")}
                </h2>
                <p className="text-5xl font-bold gradient-accent-text">ERA2</p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold italic mb-1">{t("home.ecosystem.learning.title")}</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(t("home.ecosystem.learning.tags", { returnObjects: true }) as string[]).map((tag) => (
                      <span key={tag} className="text-xs text-muted-foreground">
                        {tag} •
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("home.ecosystem.learning.desc")}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-1">{t("home.ecosystem.community.title")}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("home.ecosystem.community.desc")}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-1">{t("home.ecosystem.media.title")}</h3>
                  <p className="text-xs text-muted-foreground mb-1">{t("home.ecosystem.media.tagline")}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("home.ecosystem.media.desc")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ModelTagsCloud />
      <HomeFAQ />
      <Footer />

      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 w-10 h-10 rounded-full gradient-accent text-white flex items-center justify-center glow-accent hover:opacity-90 transition-opacity z-40"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Index;
