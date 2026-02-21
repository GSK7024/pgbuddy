import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
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
import TenantDashboard from "./pages/TenantDashboard";
import TenantPayments from "./pages/TenantPayments";
import TenantComplaints from "./pages/TenantComplaints";
import TenantNotices from "./pages/TenantNotices";
import ResetPassword from "./pages/ResetPassword";
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
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Owner routes */}
            <Route path="/dashboard" element={<ProtectedRoute requiredRole="owner"><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/properties" element={<ProtectedRoute requiredRole="owner"><Properties /></ProtectedRoute>} />
            <Route path="/dashboard/rooms" element={<ProtectedRoute requiredRole="owner"><Rooms /></ProtectedRoute>} />
            <Route path="/dashboard/tenants" element={<ProtectedRoute requiredRole="owner"><Tenants /></ProtectedRoute>} />
            <Route path="/dashboard/payments" element={<ProtectedRoute requiredRole="owner"><Payments /></ProtectedRoute>} />
            <Route path="/dashboard/complaints" element={<ProtectedRoute requiredRole="owner"><Complaints /></ProtectedRoute>} />
            <Route path="/dashboard/notices" element={<ProtectedRoute requiredRole="owner"><Notices /></ProtectedRoute>} />
            <Route path="/dashboard/expenses" element={<ProtectedRoute requiredRole="owner"><Expenses /></ProtectedRoute>} />
            {/* Tenant routes */}
            <Route path="/tenant" element={<ProtectedRoute requiredRole="tenant"><TenantDashboard /></ProtectedRoute>} />
            <Route path="/tenant/payments" element={<ProtectedRoute requiredRole="tenant"><TenantPayments /></ProtectedRoute>} />
            <Route path="/tenant/complaints" element={<ProtectedRoute requiredRole="tenant"><TenantComplaints /></ProtectedRoute>} />
            <Route path="/tenant/notices" element={<ProtectedRoute requiredRole="tenant"><TenantNotices /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
