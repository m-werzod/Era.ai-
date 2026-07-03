import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/utils";
import { aiPhotos, aiArt, aiVideo, aiLandscapes } from "@/entities/generation";

const allImages = [...aiPhotos.slice(0, 3), ...aiArt.slice(0, 2), ...aiLandscapes.slice(0, 2), ...aiVideo.slice(0, 3), ...aiPhotos.slice(3, 5), ...aiArt.slice(2, 4)];

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

export function AllModelsSection() {
  const { t } = useTranslation();

  const imageTools = [
    { name: t("home.allModels.imageTools.textToImage"), sub: "Text to Image" },
    { name: t("home.allModels.imageTools.imageToImage"), sub: "Image to Image" },
    { name: t("home.allModels.imageTools.avatars"), sub: "AI Avatars" },
    { name: t("home.allModels.imageTools.logos"), sub: "Logo Generation" },
    { name: t("home.allModels.imageTools.art"), sub: "Art & Illustrations" },
    { name: t("home.allModels.imageTools.photorealism"), sub: "Photorealism" },
    { name: t("home.allModels.imageTools.stickers"), sub: "Stickers & Emoji" },
  ];

  const videoTools = [
    { name: t("home.allModels.videoTools.textToVideo"), sub: "Text to Video" },
    { name: t("home.allModels.videoTools.imageToVideo"), sub: "Image to Video" },
    { name: t("home.allModels.videoTools.motionControl"), sub: "Motion Control" },
    { name: t("home.allModels.videoTools.videoWithAudio"), sub: "Video with Audio" },
    { name: t("home.allModels.videoTools.characterAnimation"), sub: "Character Animation" },
    { name: t("home.allModels.videoTools.cinematicScenes"), sub: "Cinematic Scenes" },
    { name: t("home.allModels.videoTools.shortClips"), sub: "Short Clips" },
  ];

  const [tab, setTab] = useState<"image" | "video">("image");
  const tools = tab === "image" ? imageTools : videoTools;

  return (
    <motion.section
      className="max-w-[1200px] mx-auto px-4"
      style={{ padding: "80px 0" }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={stagger}
    >
      <motion.div variants={fadeUp} className="text-center mb-8">
        <h2 className="text-2xl md:text-[32px] font-bold mb-3">{t("home.allModels.heading")}</h2>
        <p className="text-base text-muted-foreground">
          {t("home.allModels.subheading")}
        </p>
      </motion.div>

      <motion.div variants={fadeUp} className="flex justify-center mb-8">
        <div className="inline-flex gap-1 p-1 rounded-xl bg-muted/50 dark:bg-[rgba(255,255,255,0.06)]">
          <button
            onClick={() => setTab("image")}
            className={cn("px-5 py-2 rounded-[8px] text-sm cursor-pointer", tab === "image" ? "text-foreground font-medium" : "text-muted-foreground")}
            style={tab === "image" ? { background: "linear-gradient(135deg, hsl(var(--primary)), #ff7a3d)" } : undefined}
          >
            {t("home.allModels.tabImages")}
          </button>
          <button
            onClick={() => setTab("video")}
            className={cn("px-5 py-2 rounded-[8px] text-sm cursor-pointer", tab === "video" ? "text-foreground font-medium" : "text-muted-foreground")}
            style={tab === "video" ? { background: "linear-gradient(135deg, hsl(var(--primary)), #ff7a3d)" } : undefined}
          >
            {t("home.allModels.tabVideo")}
          </button>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
        {tools.map((tool, i) => (
          <div
            key={tool.name}
            className="shrink-0 w-[220px] rounded-2xl overflow-hidden cursor-pointer hover:brightness-110 transition-[filter]"
            style={{ border: "1px solid var(--seo-card-border)" }}
          >
            <img
              src={allImages[i % allImages.length]}
              alt=""
              loading="lazy"
              className="h-[140px] w-full object-cover"
            />
            <div className="p-3" style={{ background: "var(--seo-card-bg)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--seo-heading)" }}>{tool.name}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--seo-text-muted)" }}>{tool.sub}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </motion.section>
  );
}
