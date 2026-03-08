import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Building2, User, ChevronRight, HelpCircle, Globe, AlertTriangle, Lightbulb, Play, Video } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/i18n/LanguageContext";
import { Language } from "@/i18n/translations";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { guideTranslations, GuideStep, GuideSection as GuideSectionType, VideoTutorial } from "./guideTranslations";

const languageNames: Record<Language, string> = {
  en: "English", hi: "हिंदी", mr: "मराठी", ta: "தமிழ்", te: "తెలుగు",
  kn: "ಕನ್ನಡ", ml: "മലയാളം", bn: "বাংলা", gu: "ગુજરાતી",
  pa: "ਪੰਜਾਬੀ", or: "ଓଡ଼ିଆ", as: "অসমীয়া",
};

const UserGuide = () => {
  const { language } = useLanguage();
  const [guideLang, setGuideLang] = useState<Language>(language);
  const content = guideTranslations[guideLang];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{content.pageTitle}</h1>
                <p className="text-muted-foreground text-sm">{content.pageSubtitle}</p>
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <select
                  value={guideLang}
                  onChange={(e) => setGuideLang(e.target.value as Language)}
                  className="text-sm bg-muted border border-border rounded-lg px-3 py-2 pr-8 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {(Object.keys(languageNames) as Language[]).map((lang) => (
                    <option key={lang} value={lang}>{languageNames[lang]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="owner" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="owner" className="gap-2 text-sm">
                <Building2 className="w-4 h-4" /> {content.ownerTab}
              </TabsTrigger>
              <TabsTrigger value="tenant" className="gap-2 text-sm">
                <User className="w-4 h-4" /> {content.tenantTab}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="owner" className="space-y-8">
              <VideoSection title={content.videoSectionTitle} description={content.videoSectionDesc} videos={content.ownerVideos} />
              {content.ownerSections.map((section, si) => (
                <GuideSection key={si} section={section} warningLabel={content.warningLabel} tipLabel={content.tipLabel} />
              ))}
            </TabsContent>

            <TabsContent value="tenant" className="space-y-8">
              <VideoSection title={content.videoSectionTitle} description={content.videoSectionDesc} videos={content.tenantVideos} />
              {content.tenantSections.map((section, si) => (
                <GuideSection key={si} section={section} warningLabel={content.warningLabel} tipLabel={content.tipLabel} />
              ))}
            </TabsContent>
          </Tabs>

          {/* Need Help */}
          <div className="mt-12 p-6 rounded-2xl border border-border bg-muted/50 flex items-start gap-4">
            <HelpCircle className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">{content.needHelp}</h3>
              <p className="text-sm text-muted-foreground">{content.needHelpDesc}</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const VideoSection = ({ title, description, videos }: { title: string; description: string; videos: VideoTutorial[] }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
      <div className="flex items-center gap-3 mb-2">
        <Video className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <div key={video.videoId} className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors">
            <div className="relative aspect-video bg-muted flex items-center justify-center">
              {playingId === video.videoId ? (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <p className="text-xs text-muted-foreground text-center px-4">Video tutorial coming soon.<br />Check back for updates!</p>
                </div>
              ) : (
                <button
                  onClick={() => setPlayingId(video.videoId)}
                  className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/50 to-transparent group cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 text-primary-foreground ml-1" />
                  </div>
                </button>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-sm text-foreground">{video.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{video.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const GuideSection = ({ section, warningLabel, tipLabel }: { section: GuideSectionType; warningLabel: string; tipLabel: string }) => (
  <div>
    <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
      <ChevronRight className="w-5 h-5 text-primary" />
      {section.title}
    </h2>
    <div className="space-y-4">
      {section.steps.map((step, i) => (
        <div key={i} className="rounded-xl border border-border hover:border-primary/30 transition-colors bg-card overflow-hidden">
          <div className="flex gap-4 p-4">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shrink-0 text-xs font-bold text-primary-foreground">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">{step.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{step.desc}</p>

              {step.warning && (
                <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-destructive">{warningLabel}</p>
                    <p className="text-xs text-destructive/80 mt-0.5">{step.warning}</p>
                  </div>
                </div>
              )}

              {step.tip && (
                <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20 flex gap-2">
                  <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-primary">{tipLabel}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.tip}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {step.image && (
            <div className="px-4 pb-4">
              <img
                src={step.image}
                alt={step.title}
                className="w-full rounded-lg border border-border shadow-sm"
                loading="lazy"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

export default UserGuide;
