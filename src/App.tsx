import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/i18n/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import Rooms from "./pages/Rooms";
import Tenants from "./pages/Tenants";
import Payments from "./pages/Payments";
import Complaints from "./pages/Complaints";
import Notices from "./pages/Notices";
import Expenses from "./pages/Expenses";
import PaymentSettings from "./pages/PaymentSettings";
import Announcements from "./pages/Announcements";
import TenantInvitations from "./pages/TenantInvitations";
import TenantDashboard from "./pages/TenantDashboard";
import TenantPayments from "./pages/TenantPayments";
import TenantComplaints from "./pages/TenantComplaints";
import TenantNotices from "./pages/TenantNotices";
import TenantAnnouncements from "./pages/TenantAnnouncements";
import Marketplace from "./pages/Marketplace";
import ProfileSettings from "./pages/ProfileSettings";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import TenantLayout from "./components/dashboard/TenantLayout";
import ResetPassword from "./pages/ResetPassword";
import BrowsePG from "./pages/BrowsePG";
import ListPG from "./pages/ListPG";
import NotFound from "./pages/NotFound";
import Subscription from "./pages/Subscription";
import PropertyDetail from "./pages/PropertyDetail";
import ManageListing from "./pages/ManageListing";
import TenantReviews from "./pages/TenantReviews";
import MealMenu from "./pages/MealMenu";
import TenantMealMenu from "./pages/TenantMealMenu";
import Referrals from "./pages/Referrals";
import TenantChat from "./pages/TenantChat";
import CityPGs from "./pages/CityPGs";
import TenantOnboarding from "./pages/TenantOnboarding";
import TenantDocuments from "./pages/TenantDocuments";
import Documents from "./pages/Documents";
import VisitorLog from "./pages/VisitorLog";
import UtilityBills from "./pages/UtilityBills";
import TenantUtilityBills from "./pages/TenantUtilityBills";
import TenantAnalytics from "./pages/TenantAnalytics";
import AuditLogs from "./pages/AuditLogs";
import StaffManagement from "./pages/StaffManagement";
import MoveOutManagement from "./pages/MoveOutManagement";
import TenantMoveOut from "./pages/TenantMoveOut";
import AboutUs from "./pages/static/AboutUs";
import Careers from "./pages/static/Careers";
import Blog from "./pages/static/Blog";
import Contact from "./pages/static/Contact";
import HelpCenter from "./pages/static/HelpCenter";
import FAQs from "./pages/static/FAQs";
import PrivacyPolicy from "./pages/static/PrivacyPolicy";
import TermsOfService from "./pages/static/TermsOfService";
import Pricing from "./pages/static/Pricing";
import UserGuide from "./pages/static/UserGuide";


const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/browse" element={<BrowsePG />} />
              <Route path="/list-pg" element={<ListPG />} />
              <Route path="/pg/:id" element={<PropertyDetail />} />
              {/* Owner routes */}
              <Route path="/dashboard" element={<ProtectedRoute requiredRole="owner"><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/properties" element={<ProtectedRoute requiredRole="owner"><Properties /></ProtectedRoute>} />
              <Route path="/dashboard/rooms" element={<ProtectedRoute requiredRole="owner"><Rooms /></ProtectedRoute>} />
              <Route path="/dashboard/tenants" element={<ProtectedRoute requiredRole="owner"><Tenants /></ProtectedRoute>} />
              <Route path="/dashboard/payments" element={<ProtectedRoute requiredRole="owner"><Payments /></ProtectedRoute>} />
              <Route path="/dashboard/complaints" element={<ProtectedRoute requiredRole="owner"><Complaints /></ProtectedRoute>} />
              <Route path="/dashboard/notices" element={<ProtectedRoute requiredRole="owner"><Notices /></ProtectedRoute>} />
              <Route path="/dashboard/expenses" element={<ProtectedRoute requiredRole="owner"><Expenses /></ProtectedRoute>} />
              <Route path="/dashboard/payment-settings" element={<ProtectedRoute requiredRole="owner"><PaymentSettings /></ProtectedRoute>} />
              <Route path="/dashboard/announcements" element={<ProtectedRoute requiredRole="owner"><Announcements /></ProtectedRoute>} />
              <Route path="/dashboard/invitations" element={<ProtectedRoute requiredRole="owner"><TenantInvitations /></ProtectedRoute>} />
              <Route path="/dashboard/profile" element={<ProtectedRoute requiredRole="owner"><ProfileSettings Layout={DashboardLayout} /></ProtectedRoute>} />
              <Route path="/dashboard/subscription" element={<ProtectedRoute requiredRole="owner"><Subscription /></ProtectedRoute>} />
              <Route path="/dashboard/listing" element={<ProtectedRoute requiredRole="owner"><ManageListing /></ProtectedRoute>} />
              <Route path="/dashboard/meal-menu" element={<ProtectedRoute requiredRole="owner"><MealMenu /></ProtectedRoute>} />
              <Route path="/dashboard/referrals" element={<ProtectedRoute requiredRole="owner"><Referrals /></ProtectedRoute>} />
              <Route path="/dashboard/documents" element={<ProtectedRoute requiredRole="owner"><Documents /></ProtectedRoute>} />
              <Route path="/dashboard/visitors" element={<ProtectedRoute requiredRole="owner"><VisitorLog /></ProtectedRoute>} />
              <Route path="/dashboard/utility-bills" element={<ProtectedRoute requiredRole="owner"><UtilityBills /></ProtectedRoute>} />
              <Route path="/dashboard/analytics" element={<ProtectedRoute requiredRole="owner"><TenantAnalytics /></ProtectedRoute>} />
              <Route path="/dashboard/audit-logs" element={<ProtectedRoute requiredRole="owner"><AuditLogs /></ProtectedRoute>} />
              <Route path="/dashboard/staff" element={<ProtectedRoute requiredRole="owner"><StaffManagement /></ProtectedRoute>} />
              <Route path="/dashboard/move-out" element={<ProtectedRoute requiredRole="owner"><MoveOutManagement /></ProtectedRoute>} />
              {/* Tenant routes */}
              <Route path="/tenant" element={<ProtectedRoute requiredRole="tenant"><TenantDashboard /></ProtectedRoute>} />
              <Route path="/tenant/payments" element={<ProtectedRoute requiredRole="tenant"><TenantPayments /></ProtectedRoute>} />
              <Route path="/tenant/complaints" element={<ProtectedRoute requiredRole="tenant"><TenantComplaints /></ProtectedRoute>} />
              <Route path="/tenant/notices" element={<ProtectedRoute requiredRole="tenant"><TenantNotices /></ProtectedRoute>} />
              <Route path="/tenant/announcements" element={<ProtectedRoute requiredRole="tenant"><TenantAnnouncements /></ProtectedRoute>} />
              <Route path="/tenant/marketplace" element={<ProtectedRoute requiredRole="tenant"><Marketplace /></ProtectedRoute>} />
              <Route path="/tenant/profile" element={<ProtectedRoute requiredRole="tenant"><ProfileSettings Layout={TenantLayout} /></ProtectedRoute>} />
              <Route path="/tenant/reviews" element={<ProtectedRoute requiredRole="tenant"><TenantReviews /></ProtectedRoute>} />
              <Route path="/tenant/meal-menu" element={<ProtectedRoute requiredRole="tenant"><TenantMealMenu /></ProtectedRoute>} />
              <Route path="/tenant/chat" element={<ProtectedRoute requiredRole="tenant"><TenantChat /></ProtectedRoute>} />
              <Route path="/tenant/onboarding" element={<ProtectedRoute requiredRole="tenant"><TenantOnboarding /></ProtectedRoute>} />
              <Route path="/tenant/documents" element={<ProtectedRoute requiredRole="tenant"><TenantDocuments /></ProtectedRoute>} />
              <Route path="/tenant/utility-bills" element={<ProtectedRoute requiredRole="tenant"><TenantUtilityBills /></ProtectedRoute>} />
              <Route path="/tenant/move-out" element={<ProtectedRoute requiredRole="tenant"><TenantMoveOut /></ProtectedRoute>} />
              {/* SEO city pages */}
              <Route path="/pgs/:city" element={<CityPGs />} />
              {/* Static pages */}
              <Route path="/about" element={<AboutUs />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/faqs" element={<FAQs />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/guide" element={<UserGuide />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ThemeProvider>
  </HelmetProvider>
);

export default App;
