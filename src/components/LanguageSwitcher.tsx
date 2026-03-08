import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/i18n/LanguageContext";
import { Language } from "@/i18n/translations";
import { ScrollArea } from "@/components/ui/scroll-area";

const languages: { code: Language; label: string; flag: string; region?: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧", region: "Global" },
  { code: "hi", label: "हिंदी", flag: "🇮🇳", region: "North" },
  { code: "mr", label: "मराठी", flag: "🇮🇳", region: "West" },
  { code: "gu", label: "ગુજરાતી", flag: "🇮🇳", region: "West" },
  { code: "pa", label: "ਪੰਜਾਬੀ", flag: "🇮🇳", region: "North" },
  { code: "bn", label: "বাংলা", flag: "🇮🇳", region: "East" },
  { code: "ta", label: "தமிழ்", flag: "🇮🇳", region: "South" },
  { code: "te", label: "తెలుగు", flag: "🇮🇳", region: "South" },
  { code: "kn", label: "ಕನ್ನಡ", flag: "🇮🇳", region: "South" },
  { code: "ml", label: "മലയാളം", flag: "🇮🇳", region: "South" },
];

const LanguageSwitcher = ({ variant = "ghost" }: { variant?: "ghost" | "outline" }) => {
  const { language, setLanguage } = useLanguage();
  const current = languages.find((l) => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="sm" className="gap-1.5">
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">{current?.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <ScrollArea className="h-[320px]">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Select Language</DropdownMenuLabel>
          {languages.map((lang, i) => {
            const prevRegion = i > 0 ? languages[i - 1].region : null;
            const showSep = lang.region !== prevRegion && i > 0;
            return (
              <div key={lang.code}>
                {showSep && <DropdownMenuSeparator />}
                {lang.region !== prevRegion && (
                  <DropdownMenuLabel className="text-[10px] text-muted-foreground font-normal uppercase tracking-wider px-2 py-1">
                    {lang.region}
                  </DropdownMenuLabel>
                )}
                <DropdownMenuItem
                  onClick={() => setLanguage(lang.code)}
                  className={`cursor-pointer ${language === lang.code ? "bg-primary/10 text-primary font-medium" : ""}`}
                >
                  <span className="mr-2">{lang.flag}</span>
                  {lang.label}
                  {language === lang.code && <span className="ml-auto text-primary">✓</span>}
                </DropdownMenuItem>
              </div>
            );
          })}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
