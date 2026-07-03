import { useTranslation } from "react-i18next";
import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { cn } from "@/shared/lib/utils";
import { GBFlag, RUFlag, UZFlag, type FlagComponent } from "./FlagIcon";
import type { SupportedLanguage } from "../model/i18n";

// Each language is always shown by its own native autonym, regardless of the
// current UI language — otherwise a user who can't read the active language
// would not be able to find their own in the list.
const LANGUAGES: { code: SupportedLanguage; Flag: FlagComponent; nativeName: string }[] = [
  { code: "ru", Flag: RUFlag, nativeName: "Русский" },
  { code: "en", Flag: GBFlag, nativeName: "English" },
  { code: "uz", Flag: UZFlag, nativeName: "O'zbekcha" },
];

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={t("languageSwitcher.label")}
          className="relative h-9 px-2.5 gap-1.5 rounded-full bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-card transition-colors inline-flex items-center"
        >
          <span className="w-5 h-[14px] rounded-[3px] overflow-hidden shrink-0 ring-1 ring-black/10">
            <current.Flag className="w-full h-full" />
          </span>
          <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wide">
            {current.code}
          </span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[210px] p-1.5 bg-card border border-border rounded-2xl shadow-xl"
      >
        {LANGUAGES.map(({ code, Flag, nativeName }) => {
          const active = i18n.language === code;
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => i18n.changeLanguage(code)}
              className={cn(
                "flex items-center gap-3 h-10 px-2.5 rounded-xl cursor-pointer text-sm transition-colors",
                active ? "bg-secondary text-foreground font-medium" : "text-foreground"
              )}
            >
              <span className="w-6 h-[17px] rounded-[3px] overflow-hidden shrink-0 ring-1 ring-black/10">
                <Flag className="w-full h-full" />
              </span>
              <span className="flex-1">{nativeName}</span>
              {active && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
