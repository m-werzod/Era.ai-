import { Link } from "@/shared/routing";
import { Youtube } from "lucide-react";
import { SiTelegram, SiX } from "@icons-pack/react-simple-icons";
import { useTranslation } from "react-i18next";

function FooterColumn({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <h4 className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
        {title}
      </h4>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              to={link.to}
              className="text-sm text-[hsl(var(--foreground))] hover:text-[#ff7a3d] transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const { t } = useTranslation();

  const productLinks = [
    { label: t("footer.product.home"), to: "/" },
    { label: t("footer.product.text"), to: "/tools/text-generation" },
    { label: t("footer.product.images"), to: "/tools/image-generation" },
    { label: t("footer.product.video"), to: "/tools/video-generation" },
    { label: t("footer.product.audio"), to: "/tools/audio-generation" },
    { label: t("footer.product.agents"), to: "/tools/agents" },
    { label: t("footer.product.pricing"), to: "/pricing" },
  ];

  const resourcesLinks = [
    { label: t("footer.resources.docs"), to: "#" },
    { label: t("footer.resources.changelog"), to: "#" },
    { label: t("footer.resources.faq"), to: "#" },
  ];

  const companyLinks = [
    { label: t("footer.company.about"), to: "#" },
    { label: t("footer.company.contacts"), to: "#" },
    { label: t("footer.company.support"), to: "#" },
    { label: t("footer.company.telegram"), to: "#" },
  ];

  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] mt-20">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-[1.6fr_1fr_1fr_1fr] gap-12">
        {/* Brand */}
        <div>
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <span
              className="flex items-center justify-center font-bold text-white select-none"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, #E85420, #ff7a3d)",
                fontSize: 18,
                letterSpacing: "-0.02em",
                boxShadow: "0 2px 8px rgba(232, 84, 32, 0.3)",
              }}
            >
              E
            </span>
            <span className="text-[20px] font-semibold tracking-tight" style={{ color: "var(--c-fg)" }}>
              era<span style={{ color: "var(--c-accent-2)" }}>2</span>
            </span>
          </Link>
          <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))] max-w-[320px] leading-relaxed">
            {t("footer.tagline")}
          </p>
          <div className="flex gap-2 mt-5">
            {[
              { Icon: SiTelegram, label: "Telegram" },
              { Icon: Youtube, label: "YouTube" },
              { Icon: SiX, label: "X" },
            ].map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="w-9 h-9 inline-flex items-center justify-center rounded-full text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[#ff7a3d] transition-colors"
              >
                <Icon className="h-[18px] w-[18px]" />
              </a>
            ))}
          </div>
        </div>

        <FooterColumn title={t("footer.columns.product")} links={productLinks} />
        <FooterColumn title={t("footer.columns.resources")} links={resourcesLinks} />
        <FooterColumn title={t("footer.columns.company")} links={companyLinks} />
      </div>

      <div className="border-t border-[hsl(var(--border))]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
            <span
              className="flex items-center justify-center font-bold text-white select-none"
              style={{ width: 20, height: 20, borderRadius: 5, background: "linear-gradient(135deg, #E85420, #ff7a3d)", fontSize: 11 }}
            >
              E
            </span>
            <span className="text-xs">
              © 2026 era<span style={{ color: "var(--c-accent-2)" }}>2</span>.ai
            </span>
          </span>
          <span className="font-mono text-xs text-[hsl(var(--muted-foreground))]">
            v1.0.0
          </span>
        </div>
      </div>
    </footer>
  );
}
