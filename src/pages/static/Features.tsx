import { motion } from "framer-motion";
import {
  Building2, Users, CreditCard, BarChart3, Bell, Shield, Home, Wrench,
  UtensilsCrossed, FileText, Eye, Receipt, Zap, UserPlus, MessageSquare,
  Star, Globe, Moon, ClipboardList, DoorOpen, Briefcase, TrendingUp,
  Megaphone, CalendarCheck, Lock,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ownerFeatures = [
  {
    icon: Building2,
    title: "Multi-Property Management",
    description: "Manage unlimited PG properties from one unified dashboard. Track rooms, beds, floors, and occupancy rates across all locations in real time.",
    tag: "Core",
  },
  {
    icon: Home,
    title: "Room & Bed Management",
    description: "Configure single, double, triple, and dormitory rooms with custom rent, deposit amounts, amenities, and real-time vacancy tracking per bed.",
    tag: "Core",
  },
  {
    icon: Users,
    title: "Tenant Lifecycle Management",
    description: "Complete tenant journey from invite-code onboarding to move-out. Search, filter, sort tenants and export data as CSV for records.",
    tag: "Core",
  },
  {
    icon: UserPlus,
    title: "Invite-Code Onboarding",
    description: "Generate unique invite codes per room. Tenants sign up, enter the code, and get auto-assigned — no manual data entry needed.",
    tag: "Onboarding",
  },
  {
    icon: CreditCard,
    title: "Rent Collection & Receipts",
    description: "Generate rent records individually or in bulk with duplicate prevention. Tenants upload payment proofs; owners verify and approve. Digital receipts included.",
    tag: "Payments",
  },
  {
    icon: Receipt,
    title: "Expense Tracking",
    description: "Log property expenses by category — maintenance, utilities, supplies, salaries. Filter by date and property for clear financial visibility.",
    tag: "Finance",
  },
  {
    icon: Zap,
    title: "Utility Bill Management",
    description: "Calculate electricity and water bills per room using meter readings and configurable per-unit rates. Tenants can view and pay from their dashboard.",
    tag: "Finance",
  },
  {
    icon: CalendarCheck,
    title: "Payment Settings",
    description: "Configure UPI ID, QR codes, and bank account details per property. Tenants see these details when making rent payments.",
    tag: "Payments",
  },
  {
    icon: UtensilsCrossed,
    title: "Meal Menu System",
    description: "Set daily breakfast, lunch, snacks, and dinner menus. Tenants view the weekly schedule from their dashboard — great for PGs offering food.",
    tag: "Operations",
  },
  {
    icon: Eye,
    title: "Visitor Log",
    description: "Track visitor check-ins and check-outs with name, phone, purpose, and linked tenant. Maintain a secure digital register for all properties.",
    tag: "Operations",
  },
  {
    icon: FileText,
    title: "Document Management",
    description: "Tenants upload ID proofs, agreements, and documents. Owners review, approve, or reject with notes — all stored securely in the cloud.",
    tag: "Operations",
  },
  {
    icon: DoorOpen,
    title: "Move-Out & Deposit Refund",
    description: "Structured move-out workflow with checklists, damage deductions, and deposit refund tracking. Clear process for both owners and tenants.",
    tag: "Operations",
  },
  {
    icon: Wrench,
    title: "Complaint Tracking",
    description: "Tenants raise categorized complaints. Owners track status from open to resolved with resolution notes and timestamps.",
    tag: "Communication",
  },
  {
    icon: Megaphone,
    title: "Announcements",
    description: "Broadcast priority announcements to all tenants of a property. Mark as active/inactive and set priority levels for visibility.",
    tag: "Communication",
  },
  {
    icon: MessageSquare,
    title: "Community Chat",
    description: "Real-time property-level chat for tenants to communicate with each other and the owner. Build community within your PG.",
    tag: "Communication",
  },
  {
    icon: Briefcase,
    title: "Staff Management",
    description: "Invite managers, accountants, and caretakers by email. Role-based access ensures staff only see what they need — no data leaks.",
    tag: "Admin",
  },
  {
    icon: ClipboardList,
    title: "Audit Logs",
    description: "Every action tracked — who did what, when, and on which property. Complete transparency for owners managing teams.",
    tag: "Admin",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Visual insights on occupancy trends, revenue vs expenses, collection rates, and tenant demographics. Make data-driven decisions.",
    tag: "Insights",
  },
  {
    icon: TrendingUp,
    title: "PG Marketplace Listing",
    description: "List your PG with photos, videos, amenities, and pricing on the public marketplace. Reach thousands of tenants searching for PGs.",
    tag: "Growth",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Automated rent reminders, complaint updates, and announcement alerts. Stay connected with tenants without manual follow-ups.",
    tag: "Automation",
  },
  {
    icon: Lock,
    title: "Subscription Plans",
    description: "Flexible free, starter, and pro plans based on tenant count. Scale as your PG business grows with transparent pricing.",
    tag: "Business",
  },
];

const tenantFeatures = [
  {
    icon: Home,
    title: "Tenant Dashboard",
    description: "Personalized dashboard showing rent status, upcoming payments, announcements, and quick actions — everything at a glance.",
  },
  {
    icon: CreditCard,
    title: "Pay Rent & Upload Proofs",
    description: "View rent dues, upload payment screenshots or receipts, and track payment history month-by-month.",
  },
  {
    icon: Wrench,
    title: "Raise Complaints",
    description: "Submit maintenance requests and complaints with categories. Track resolution status in real-time.",
  },
  {
    icon: Star,
    title: "Rate & Review PG",
    description: "Leave anonymous or named reviews for your PG. Help future tenants make informed decisions.",
  },
  {
    icon: FileText,
    title: "Upload Documents",
    description: "Submit ID proofs, rental agreements, and other documents digitally. Track approval status.",
  },
  {
    icon: DoorOpen,
    title: "Request Move-Out",
    description: "Initiate move-out, track deposit refund progress, and complete the checklist — all from the app.",
  },
  {
    icon: Globe,
    title: "Browse PG Marketplace",
    description: "Search PGs by city, locality, rent range, and gender preference. View photos, amenities, and reviews before contacting.",
  },
  {
    icon: Moon,
    title: "Dark Mode & Multi-Language",
    description: "Switch between light and dark themes. Available in English, Hindi, Marathi, and Telugu for comfort.",
  },
];

const tagColors: Record<string, string> = {
  Core: "bg-primary/10 text-primary",
  Onboarding: "bg-secondary/10 text-secondary",
  Payments: "bg-accent/10 text-accent",
  Finance: "bg-success/10 text-success",
  Operations: "bg-warning/10 text-warning",
  Communication: "bg-secondary/10 text-secondary",
  Admin: "bg-primary/10 text-primary",
  Insights: "bg-accent/10 text-accent",
  Growth: "bg-success/10 text-success",
  Automation: "bg-warning/10 text-warning",
  Business: "bg-primary/10 text-primary",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "PG Buddy Features — Complete PG Management Platform",
  description: "Explore 25+ powerful features for PG owners and tenants. From rent collection to analytics, PG Buddy has everything you need.",
  url: "https://pgbuddy.lovable.app/features",
  isPartOf: { "@type": "WebSite", name: "PG Buddy", url: "https://pgbuddy.lovable.app" },
};

const Features = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <SEOHead
      title="All Features — 25+ Tools for PG Management"
      description="Explore PG Buddy's 25+ features: multi-property management, rent collection, tenant onboarding, analytics, staff roles, marketplace, and more."
      canonical="/features"
      jsonLd={jsonLd}
    />
    <Navbar />

    <main className="flex-1 pt-24 pb-16">
      {/* Hero */}
      <section className="container mx-auto px-4 text-center mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            🚀 25+ Features
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
            Everything You Need to{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
              Run Your PG
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From tenant onboarding to deposit refunds — PG Buddy covers every step of PG management for owners, staff, and tenants.
          </p>
        </motion.div>
      </section>

      {/* Owner Features */}
      <section className="container mx-auto px-4 mb-24">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">For PG Owners & Staff</h2>
        <p className="text-muted-foreground mb-10 max-w-xl">Powerful tools to manage properties, collect rent, and grow your business.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ownerFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.03 }}
              className="group"
            >
              <div className="h-full p-6 bg-card rounded-2xl border border-border/60 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  {f.tag && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tagColors[f.tag] || "bg-muted text-muted-foreground"}`}>
                      {f.tag}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold mb-1.5">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tenant Features */}
      <section className="container mx-auto px-4 mb-24">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">For Tenants</h2>
        <p className="text-muted-foreground mb-10 max-w-xl">A dedicated portal so tenants can manage rent, complaints, and documents effortlessly.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {tenantFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className="group"
            >
              <div className="h-full p-5 bg-card rounded-2xl border border-border/60 shadow-sm hover:shadow-md hover:border-secondary/20 transition-all duration-300 hover:-translate-y-1">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <f.icon className="w-5 h-5 text-secondary" />
                </div>
                <h3 className="text-sm font-bold mb-1">{f.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 text-center">
        <div className="rounded-3xl p-10 sm:p-16" style={{ background: "var(--gradient-hero)" }}>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Ready to simplify your PG management?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Join thousands of PG owners across India who trust PG Buddy to manage their properties.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/auth">Get Started Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>

    <Footer />
  </div>
);

export default Features;
