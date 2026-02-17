import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import Rooms from "./pages/Rooms";
import Tenants from "./pages/Tenants";
import Payments from "./pages/Payments";
import Complaints from "./pages/Complaints";
import Notices from "./pages/Notices";
import TenantDashboard from "./pages/TenantDashboard";
import Marketplace from "./pages/Marketplace";
import TenantPayments from "./pages/TenantPayments";
import TenantComplaints from "./pages/TenantComplaints";
import TenantNotices from "./pages/TenantNotices";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            {/* Owner routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/properties" element={<Properties />} />
            <Route path="/dashboard/rooms" element={<Rooms />} />
            <Route path="/dashboard/tenants" element={<Tenants />} />
            <Route path="/dashboard/payments" element={<Payments />} />
            <Route path="/dashboard/complaints" element={<Complaints />} />
            <Route path="/dashboard/notices" element={<Notices />} />
            {/* Tenant routes */}
            <Route path="/tenant" element={<TenantDashboard />} />
            <Route path="/tenant/marketplace" element={<Marketplace />} />
            <Route path="/tenant/payments" element={<TenantPayments />} />
            <Route path="/tenant/complaints" element={<TenantComplaints />} />
            <Route path="/tenant/notices" element={<TenantNotices />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
