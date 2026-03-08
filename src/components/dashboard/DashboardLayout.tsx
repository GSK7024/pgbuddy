import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, Home, Users, CreditCard, BarChart3, Receipt,
  LogOut, Menu, X, MessageSquare, BellDot, Settings, Megaphone, QrCode, Share2, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";

const sidebarLinks = [
  { name: "Overview", href: "/dashboard", icon: BarChart3 },
  { name: "Properties", href: "/dashboard/properties", icon: Building2 },
  { name: "Rooms", href: "/dashboard/rooms", icon: Home },
  { name: "Tenants", href: "/dashboard/tenants", icon: Users },
  { name: "Invitations", href: "/dashboard/invitations", icon: Share2 },
  { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { name: "Payment Setup", href: "/dashboard/payment-settings", icon: QrCode },
  { name: "Expenses", href: "/dashboard/expenses", icon: Receipt },
  { name: "Complaints", href: "/dashboard/complaints", icon: MessageSquare },
  { name: "Notices", href: "/dashboard/notices", icon: BellDot },
  { name: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
];

const bottomLinks = [
  { name: "Profile", href: "/dashboard/profile", icon: User },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

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
        {bottomLinks.map((link) => (
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
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleSignOut}>
          <LogOut className="w-4 h-4" />
          Sign Out
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
