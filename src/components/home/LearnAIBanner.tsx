import { useTranslation } from "react-i18next";

export function LearnAIBanner() {
  const { t } = useTranslation();
  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 rounded-[22px] px-8 md:px-10 py-8"
        style={{
          background: "linear-gradient(135deg, rgba(232, 84, 32,0.08), rgba(255, 122, 61,0.05))",
          border: "1px solid rgba(232, 84, 32,0.15)",
        }}
      >
        <h3 className="text-[22px] font-bold" style={{ color: "var(--text-primary)" }}>
          {t("home.learnBanner.titlePrefix")}{" "}
          <span
            className="italic"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)), #ff7a3d)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {t("home.learnBanner.titleHighlight")}
          </span>{" "}
          {t("home.learnBanner.titleSuffix")}
        </h3>
        <a
          href="https://coursehub.store"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-7 py-3 rounded-[8px] text-[14px] font-semibold text-white hover:opacity-90 transition-opacity shrink-0"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)), #ff7a3d)" }}
        >
          {t("home.learnBanner.cta")}
        </a>
      </div>
    </section>
  );
}
