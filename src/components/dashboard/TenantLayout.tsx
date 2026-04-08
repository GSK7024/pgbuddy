import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, CreditCard, MessageSquare, BellDot,
  LogOut, Menu, X, Search, LayoutDashboard, Megaphone, User, Star, UtensilsCrossed, MessageCircle,
  ClipboardCheck, FileText, Zap, DoorOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "@/components/NotificationBell";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { getAppName, getAppLogo, isWhiteLabel } from "@/lib/branding";

const getSidebarLinks = (t: (k: string) => string) => [
  { name: t("tenant.myRoom"), href: "/tenant", icon: LayoutDashboard },
  { name: t("tenant.payments"), href: "/tenant/payments", icon: CreditCard },
  { name: t("tenant.complaints"), href: "/tenant/complaints", icon: MessageSquare },
  { name: t("tenant.announcements"), href: "/tenant/announcements", icon: Megaphone },
  // { name: t("tenant.browsePgs"), href: "/tenant/marketplace", icon: Search },
  // { name: t("tenant.reviews"), href: "/tenant/reviews", icon: Star },
  { name: t("tenant.mealMenu"), href: "/tenant/meal-menu", icon: UtensilsCrossed },
  { name: "Community Chat", href: "/tenant/chat", icon: MessageCircle },
  { name: "Onboarding", href: "/tenant/onboarding", icon: ClipboardCheck },
  // { name: "My Documents", href: "/tenant/documents", icon: FileText },
  { name: "Utility Bills", href: "/tenant/utility-bills", icon: Zap },
  { name: "Move-Out", href: "/tenant/move-out", icon: DoorOpen },
];

const getBottomLinks = (t: (k: string) => string) => [
  { name: t("sidebar.profile"), href: "/tenant/profile", icon: User },
];

const TenantLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const sidebarLinks = getSidebarLinks(t);
  const bottomLinks = getBottomLinks(t);
  const currentPath = location.pathname;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {sidebarLinks.map((link) => {
          const isActive = currentPath === link.href;
          return (
            <Link
              key={link.name}
              to={link.href}
              onClick={onClick}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "gradient-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              <link.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{link.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-border/50 space-y-0.5">
        {bottomLinks.map((link) => {
          const isActive = currentPath === link.href;
          return (
            <Link
              key={link.name}
              to={link.href}
              onClick={onClick}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "gradient-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.name}
            </Link>
          );
        })}
        <div className="flex items-center justify-between px-3 py-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive" onClick={handleSignOut}>
          <LogOut className="w-4 h-4" />
          {t("nav.signOut")}
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border/50 bg-card/80 backdrop-blur-sm fixed h-full z-30">
        <div className="p-5 border-b border-border/50 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            {isWhiteLabel ? (
              <img src={getAppLogo()} alt={getAppName()} className="h-12 w-auto object-contain object-center drop-shadow-md" />
            ) : (
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-md">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <span className="text-lg font-bold gradient-text tracking-tight">{getAppName()}</span>
          </Link>
          <NotificationBell />
        </div>
        <NavLinks />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-3">
            {isWhiteLabel ? (
              <img src={getAppLogo()} alt={getAppName()} className="h-10 w-auto object-contain object-center drop-shadow-sm" />
            ) : (
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-sm">
                <Building2 className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <span className="font-bold gradient-text">{getAppName()}</span>
          </Link>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-background/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-64 h-full bg-card border-r border-border/50 flex flex-col pt-16 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <NavLinks onClick={() => setSidebarOpen(false)} />
          </motion.aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 page-enter">
          {children}
        </div>
      </main>
    </div>
  );
};

export default TenantLayout;
