import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/utils";

const FAQ_KEYS = ["free", "models", "credits", "vpn", "payment", "expiry", "commercial"] as const;

export function HomeFAQ() {
  const { t } = useTranslation();
  const faqItems = FAQ_KEYS.map((key) => ({
    q: t(`home.faq.items.${key}.q`),
    a: t(`home.faq.items.${key}.a`),
  }));
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section style={{ padding: "80px 0" }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-[60px]">
          {/* Left column */}
          <div className="lg:w-[30%] shrink-0">
            <h2 className="text-[32px] font-extrabold leading-[1.2]" style={{ color: "var(--text-primary)" }}>{t("home.faq.heading")}</h2>
            <p className="text-[14px] mt-4" style={{ color: "var(--text-tertiary)" }}>
              {t("home.faq.subheading")}
            </p>
            <a
              href="https://t.me/era2_support"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 px-5 py-3 rounded-[8px] text-[14px] text-[hsl(var(--primary))] border border-[rgba(232, 84, 32,0.2)] hover:bg-[rgba(232, 84, 32,0.15)] transition-colors"
              style={{ background: "rgba(232, 84, 32,0.1)" }}
            >
              {t("home.faq.contactSupport")}
            </a>
          </div>

          {/* Right column */}
          <div className="flex-1 space-y-2">
            {faqItems.map((item, i) => (
              <div
                key={i}
                className="rounded-xl transition-colors"
                style={{
                  border: "1px solid var(--border-primary)",
                  padding: "20px 24px",
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border-primary)"; }}
              >
                <button
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="text-[15px] font-medium" style={{ color: "var(--text-primary)" }}>{item.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 ml-4 transition-transform duration-200",
                      openIdx === i && "rotate-180"
                    )}
                    style={{ color: "var(--text-tertiary)" }}
                  />
                </button>
                <div className={cn("overflow-hidden transition-all duration-200", openIdx === i ? "max-h-40 pt-3" : "max-h-0")}>
                  <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
