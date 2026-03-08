import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Language, translations } from "./translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem("pg-lang");
    return (stored as Language) || "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("pg-lang", lang);
  }, []);

  const t = useCallback(
    (key: string) => translations[language][key] || translations.en[key] || key,
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const fallbackT = (key: string) => translations.en[key] || key;

const defaultContext: LanguageContextType = {
  language: "en",
  setLanguage: () => {},
  t: fallbackT,
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  return ctx ?? defaultContext;
};
