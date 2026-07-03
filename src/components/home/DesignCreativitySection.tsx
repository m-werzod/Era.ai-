import { useState } from "react";
import { Link } from "@/shared/routing";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/utils";
import { aiPhotos, aiVideo } from "@/entities/generation";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

export function DesignCreativitySection() {
  const { t } = useTranslation();
  const photoModels = [
    { id: "midjourney", name: "Midjourney", desc: t("home.designCreativity.photoModels.midjourney.desc") },
    { id: "nano-banana", name: "Nano Banana", desc: t("home.designCreativity.photoModels.nanoBanana.desc") },
    { id: "seedream", name: "Seedream", desc: t("home.designCreativity.photoModels.seedream.desc") },
    { id: "gpt-image", name: "GPT Image", desc: t("home.designCreativity.photoModels.gptImage.desc") },
    { id: "flux", name: "Flux", desc: t("home.designCreativity.photoModels.flux.desc") },
    { id: "imagen4", name: "Imagen 4", desc: t("home.designCreativity.photoModels.imagen4.desc") },
  ];

  const videoModels = [
    { id: "kling", name: "Kling", desc: t("home.designCreativity.videoModels.kling.desc") },
    { id: "seedance", name: "Seedance", desc: t("home.designCreativity.videoModels.seedance.desc") },
    { id: "veo", name: "Veo", desc: t("home.designCreativity.videoModels.veo.desc") },
    { id: "sora", name: "Sora", desc: t("home.designCreativity.videoModels.sora.desc") },
    { id: "wan-ai", name: "Wan AI", desc: t("home.designCreativity.videoModels.wan.desc") },
    { id: "hailuo", name: "Hailuo AI", desc: t("home.designCreativity.videoModels.hailuo.desc") },
  ];

  const [tab, setTab] = useState<"photo" | "video">("photo");
  const models = tab === "photo" ? photoModels : videoModels;
  const [activeModel, setActiveModel] = useState(0);
  const active = models[activeModel];

  const handleTabChange = (t: "photo" | "video") => {
    setTab(t);
    setActiveModel(0);
  };

  return (
    <motion.section
      className="max-w-300 mx-auto px-4"
      style={{ padding: "80px 0" }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={stagger}
    >
      <motion.div variants={fadeUp} className="text-center mb-8">
        <h2 className="text-2xl md:text-[32px] font-bold mb-3">{t("home.designCreativity.heading")}</h2>
        <p className="text-base text-muted-foreground">
          {t("home.designCreativity.subheading")}
        </p>
      </motion.div>

      <motion.div variants={fadeUp} className="flex justify-center mb-6">
        <div className="inline-flex gap-1 p-1 rounded-xl bg-muted/50 dark:bg-[rgba(255,255,255,0.06)]">
          <button
            onClick={() => handleTabChange("photo")}
            className={cn("px-5 py-2 rounded-sm text-sm cursor-pointer", tab === "photo" ? "text-foreground font-medium" : "text-muted-foreground")}
            style={tab === "photo" ? { background: "linear-gradient(135deg, hsl(var(--primary)), #ff7a3d)" } : undefined}
          >
            {t("home.designCreativity.tabPhoto")}
          </button>
          <button
            onClick={() => handleTabChange("video")}
            className={cn("px-5 py-2 rounded-sm text-sm cursor-pointer", tab === "video" ? "text-foreground font-medium" : "text-muted-foreground")}
            style={tab === "video" ? { background: "linear-gradient(135deg, hsl(var(--primary)), #ff7a3d)" } : undefined}
          >
            {t("home.designCreativity.tabVideo")}
          </button>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2 mb-8">
        {models.map((m, i) => (
          <button
            key={m.id}
            onClick={() => setActiveModel(i)}
            className="text-[13px] cursor-pointer px-4 py-1.5 rounded-lg"
            style={
              i === activeModel
                ? { background: "linear-gradient(135deg, hsl(var(--primary)), #ff7a3d)", color: "#fff", border: "1px solid transparent" }
                : { background: "transparent", border: "1px solid var(--seo-pill-border)", color: "var(--seo-pill-text)" }
            }
          >
            {m.name}
          </button>
        ))}
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="flex flex-col md:flex-row overflow-hidden"
        style={{ background: "var(--seo-card-bg)", border: "1px solid var(--seo-card-border)", borderRadius: 24, minHeight: 300, boxShadow: "var(--seo-card-shadow)" }}
      >
        <div className="md:w-[40%] p-8 md:p-10 flex flex-col justify-center">
          <h3 className="text-3xl md:text-[48px] font-extrabold leading-tight" style={{ fontStyle: "italic", color: "var(--seo-heading)" }}>
            {active.name}
          </h3>
          <p className="text-sm mt-4 mb-6 line-clamp-3" style={{ color: "var(--seo-text)" }}>
            {active.desc}
          </p>
          <Link
            to={tab === "photo" ? "/design" : "/video"}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-[8px] text-white text-sm font-semibold hover:opacity-90 transition-opacity w-fit"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), #ff7a3d)" }}
          >
            {t("home.designCreativity.cta")}
          </Link>
        </div>
        <div
          className="md:w-[60%] p-6 grid grid-cols-2 md:grid-cols-3 gap-3"
          style={{ background: "var(--seo-gradient-placeholder)" }}
        >
          {(tab === "photo" ? aiPhotos : aiVideo).slice(0, 6).map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              loading="lazy"
              className="rounded-xl w-full h-full object-cover"
              style={{ aspectRatio: i % 3 === 0 ? "3/4" : "4/3" }}
            />
          ))}
        </div>
      </motion.div>
    </motion.section>
  );
}
