import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, Home, Users, CreditCard, BarChart3, Receipt,
  LogOut, Menu, X, MessageSquare, BellDot, Megaphone, QrCode, Share2, User, Crown, Camera, UtensilsCrossed, Gift,
  FileText, UserCheck, Zap, PieChart, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";

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
  { name: "Documents", href: "/dashboard/documents", icon: FileText },
  { name: "Visitor Log", href: "/dashboard/visitors", icon: UserCheck },
  { name: "Utility Bills", href: "/dashboard/utility-bills", icon: Zap },
  { name: "Analytics", href: "/dashboard/analytics", icon: PieChart },
  { name: "Activity Log", href: "/dashboard/audit-logs", icon: Activity },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [currentPlan, setCurrentPlan] = useState<string>("Free");
  const sidebarLinks = getSidebarLinks(t);
  const currentPath = location.pathname;

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
        <Link
          to="/dashboard/subscription"
          onClick={onClick}
          className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            currentPath === "/dashboard/subscription"
              ? "gradient-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
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
        <Link
          to="/dashboard/profile"
          onClick={onClick}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            currentPath === "/dashboard/profile"
              ? "gradient-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          }`}
        >
          <User className="w-4 h-4" />
          {t("sidebar.profile")}
        </Link>
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
        <div className="p-5 border-b border-border/50">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold gradient-text tracking-tight">PG Manager</span>
          </Link>
        </div>
        <NavLinks />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-sm">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold gradient-text">PG Manager</span>
          </Link>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
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

export default DashboardLayout;
