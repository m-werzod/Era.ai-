import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en";
import ru from "./locales/ru";
import uz from "./locales/uz";

export const SUPPORTED_LANGUAGES = ["ru", "en", "uz"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      uz: { translation: uz },
    },
    fallbackLng: "ru",
    supportedLngs: SUPPORTED_LANGUAGES,
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "era2_language",
    },
    interpolation: { escapeValue: false },
  });

export default i18next;
