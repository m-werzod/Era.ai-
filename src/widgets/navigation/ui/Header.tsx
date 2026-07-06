import { useEffect, useRef } from "react";
import { Link } from "@/shared/routing";
import { Clock, Menu, Moon, Search, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/utils";
import { useTheme } from "@/features/theme-switcher";
import { useAuth } from "@/features/auth";
import { useCommandPalette } from "@/features/command-palette";
import { LanguageSwitcher } from "@/features/language-switcher";
import { UserDropdown } from "./UserDropdown";
import { NavMegaMenu } from "./NavMegaMenu";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { PromoBanner } from "@/features/promo";
import { PROMO_ACTIVE, PROMO_LABEL } from "@/config/promo";

interface HeaderProps {
  onToggleSidebar: () => void;
  showBurger?: boolean;
}

const iconBtn =
  "relative w-9 h-9 rounded-full bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-card transition-colors flex items-center justify-center";

export function Header({ onToggleSidebar, showBurger = true }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { isAuthed } = useAuth();
  const { setOpen } = useCommandPalette();
  const { t } = useTranslation();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Workspace pages size their content as `100dvh - var(--header-height)`. The
  // promo banner (unauthenticated only) adds extra height on top of the fixed
  // 64px header, so we measure the real combined height instead of assuming
  // a constant — otherwise mobile content (incl. the generate button) ends up
  // taller than the viewport and gets pushed off-screen.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const setHeight = () => {
      document.documentElement.style.setProperty("--header-height", `${el.offsetHeight}px`);
    };
    setHeight();
    const ro = new ResizeObserver(setHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isAuthed]);

  return (
    <div ref={wrapperRef}>
      {!isAuthed && <PromoBanner />}
      <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-4 md:px-6 bg-background/85 backdrop-blur-md border-b border-border">
      {/* Left: burger + logo */}
      <div className="flex items-center gap-3">
        {showBurger && isAuthed && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-full hover:bg-secondary transition-colors"
            aria-label={t("header.menuAria")}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
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
            <span className="font-mono text-[13px] font-normal ml-0.5" style={{ color: "var(--c-fg-mute)" }}>.ai</span>
          </span>
        </Link>
      </div>

      {/* Center: mega menu (desktop only) */}
      <div className="hidden lg:flex flex-1 justify-center">
        <NavMegaMenu />
      </div>

      {/* Right: utility cluster */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* ⌘K search — full on md+, icon-only on mobile */}
        <button
          onClick={() => setOpen(true)}
          className="hidden md:inline-flex items-center gap-2 h-9 px-3 bg-secondary border border-border rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span>{t("header.searchModels")}</span>
          <span className="bg-card rounded-md px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">⌘K</span>
        </button>
        <button
          onClick={() => setOpen(true)}
          className={cn(iconBtn, "md:hidden")}
          aria-label={t("header.searchAria")}
        >
          <Search className="h-4 w-4" />
        </button>

        {/* History (desktop) */}
        <Link
          to="/history"
          className="hidden lg:inline-flex items-center gap-2 h-9 px-3 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Clock className="h-3.5 w-3.5" />
          {t("header.history")}
        </Link>

        {/* Promo (desktop only) */}
        {PROMO_ACTIVE && (
          <Link
            to="/pricing"
            className="hidden xl:inline-flex items-center gap-2 h-9 px-3 bg-[hsl(var(--accent))] border border-primary/30 rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-primary"
              style={{ boxShadow: "0 0 8px var(--c-accent)" }}
            />
            <span className="font-mono tabular-nums text-primary">{PROMO_LABEL}</span>
            <span className="text-foreground">{t("footer.product.pricing")}</span>
          </Link>
        )}

        {/* Notifications */}
        {isAuthed && <NotificationsDropdown />}

        {/* Language */}
        <LanguageSwitcher />

        {/* Theme */}
        <button onClick={toggleTheme} className={iconBtn} aria-label={t("header.themeToggleAria")}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Avatar / auth */}
        {isAuthed ? (
          <UserDropdown />
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              to="/auth"
              className="hidden sm:inline-flex items-center h-9 px-4 rounded-full text-sm font-medium border transition-colors"
              style={{ borderColor: "var(--c-line)", color: "var(--c-fg)", background: "transparent" }}
            >
              {t("header.login")}
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center h-9 px-4 sm:px-5 rounded-full text-sm font-medium text-white transition-colors"
              style={{ background: "var(--c-accent)", boxShadow: "0 4px 16px -4px rgba(232, 84, 32, 0.5)" }}
            >
              {t("header.start")}
            </Link>
          </div>
        )}
      </div>
      </header>
    </div>
  );
}
