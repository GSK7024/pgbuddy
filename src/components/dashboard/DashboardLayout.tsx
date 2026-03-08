import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, Home, Users, CreditCard, BarChart3, Receipt,
  LogOut, Menu, X, MessageSquare, BellDot, Settings, Megaphone, QrCode, Share2, User, Crown, Camera, UtensilsCrossed, Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const getSidebarLinks = (t: (k: string) => string) => [
  { name: t("sidebar.overview"), href: "/dashboard", icon: BarChart3 },
  { name: t("sidebar.properties"), href: "/dashboard/properties", icon: Building2 },
  { name: t("sidebar.rooms"), href: "/dashboard/rooms", icon: Home },
  { name: t("sidebar.tenants"), href: "/dashboard/tenants", icon: Users },
  { name: t("sidebar.invitations"), href: "/dashboard/invitations", icon: Share2 },
  { name: t("sidebar.payments"), href: "/dashboard/payments", icon: CreditCard },
  { name: t("sidebar.paymentSetup"), href: "/dashboard/payment-settings", icon: QrCode },
  { name: t("sidebar.expenses"), href: "/dashboard/expenses", icon: Receipt },
  { name: t("sidebar.complaints"), href: "/dashboard/complaints", icon: MessageSquare },
  { name: t("sidebar.notices"), href: "/dashboard/notices", icon: BellDot },
  { name: t("sidebar.announcements"), href: "/dashboard/announcements", icon: Megaphone },
  { name: t("sidebar.manageListing"), href: "/dashboard/listing", icon: Camera },
  { name: t("sidebar.mealMenu"), href: "/dashboard/meal-menu", icon: UtensilsCrossed },
  { name: "Refer & Earn", href: "/dashboard/referrals", icon: Gift },
];

const bottomLinks = [
  { name: "Subscription", href: "/dashboard/subscription", icon: Crown },
  { name: "Profile", href: "/dashboard/profile", icon: User },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [currentPlan, setCurrentPlan] = useState<string>("Free");
  const sidebarLinks = getSidebarLinks(t);

  useEffect(() => {
    if (!user) return;
    const fetchPlan = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("subscription_plans(name)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      if ((data as any)?.subscription_plans?.name) {
        setCurrentPlan((data as any).subscription_plans.name);
      }
    };
    fetchPlan();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const currentPath = window.location.pathname;

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {sidebarLinks.map((link) => (
          <Link
            key={link.name}
            to={link.href}
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPath === link.href
                ? "gradient-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <link.icon className="w-4 h-4" />
            {link.name}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-border space-y-1">
        {/* Subscription with plan badge */}
        <Link
          to="/dashboard/subscription"
          onClick={onClick}
          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentPath === "/dashboard/subscription"
              ? "gradient-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-3">
            <Crown className="w-4 h-4" />
            {t("sidebar.subscription")}
          </span>
          <Badge
            variant="secondary"
            className={`text-[10px] px-1.5 py-0 ${
              currentPlan === "Free"
                ? "bg-muted text-muted-foreground"
                : currentPlan === "Pro"
                ? "bg-primary/10 text-primary"
                : "bg-warning/10 text-warning"
            }`}
          >
            {currentPlan}
          </Badge>
        </Link>
        {/* Profile */}
        <Link
          to="/dashboard/profile"
          onClick={onClick}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentPath === "/dashboard/profile"
              ? "gradient-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <User className="w-4 h-4" />
          {t("sidebar.profile")}
        </Link>
        <div className="flex items-center justify-between px-3 py-1">
          <LanguageSwitcher />
        </div>
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleSignOut}>
          <LogOut className="w-4 h-4" />
          {t("nav.signOut")}
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card fixed h-full z-30">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold gradient-text">PG Manager</span>
          </Link>
        </div>
        <NavLinks />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold gradient-text">PG Manager</span>
          </Link>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-muted">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            className="w-64 h-full bg-card border-r border-border flex flex-col pt-16"
            onClick={(e) => e.stopPropagation()}
          >
            <NavLinks onClick={() => setSidebarOpen(false)} />
          </motion.aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
