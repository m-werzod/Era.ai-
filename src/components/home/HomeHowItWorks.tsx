import { useTranslation } from "react-i18next";

export function HomeHowItWorks() {
  const { t } = useTranslation();
  const steps = [
    { num: "01", title: t("home.howItWorks.steps.choose.title"), desc: t("home.howItWorks.steps.choose.desc") },
    { num: "02", title: t("home.howItWorks.steps.prompt.title"), desc: t("home.howItWorks.steps.prompt.desc") },
    { num: "03", title: t("home.howItWorks.steps.result.title"), desc: t("home.howItWorks.steps.result.desc") },
  ];

  return (
    <section className="max-w-[900px] mx-auto" style={{ padding: "80px 16px" }}>
      <h2 className="text-foreground" style={{ fontSize: 28, fontWeight: 700, textAlign: "center", marginBottom: 48 }}>{t("home.howItWorks.heading")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((s) => (
          <div key={s.num}>
            <span className="font-mono tabular-nums" style={{ fontSize: 56, fontWeight: 500, lineHeight: 1, color: "hsl(var(--primary))", letterSpacing: "-0.02em" }}>
              {s.num}
            </span>
            <h3 className="text-foreground" style={{ fontSize: 18, fontWeight: 600, marginTop: 12 }}>{s.title}</h3>
            <p className="text-muted-foreground" style={{ fontSize: 14, marginTop: 8 }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
