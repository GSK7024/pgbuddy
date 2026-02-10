import { useEffect, useState } from "react";
import { Building2, Users, Home, CreditCard, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    properties: 0,
    rooms: 0,
    tenants: 0,
    pendingPayments: 0,
    complaints: 0,
    revenue: 0,
  });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [propRes, roomRes, tenantRes, payRes, complaintRes] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
        supabase.from("rooms").select("id, property_id, properties!inner(owner_id)").eq("properties.owner_id", user.id),
        supabase.from("tenant_assignments").select("id, property_id, properties!inner(owner_id)").eq("properties.owner_id", user.id).eq("is_active", true),
        supabase.from("rent_payments").select("id, amount, property_id, properties!inner(owner_id)").eq("properties.owner_id", user.id).eq("status", "pending"),
        supabase.from("complaints").select("id, property_id, properties!inner(owner_id)").eq("properties.owner_id", user.id).eq("status", "open"),
      ]);

      setStats({
        properties: propRes.count ?? 0,
        rooms: roomRes.data?.length ?? 0,
        tenants: tenantRes.data?.length ?? 0,
        pendingPayments: payRes.data?.length ?? 0,
        complaints: complaintRes.data?.length ?? 0,
        revenue: payRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0,
      });
    };
    fetchStats();
  }, [user]);

  const statCards = [
    { label: "Properties", value: stats.properties, icon: Building2, color: "text-primary" },
    { label: "Total Rooms", value: stats.rooms, icon: Home, color: "text-secondary" },
    { label: "Active Tenants", value: stats.tenants, icon: Users, color: "text-success" },
    { label: "Pending Payments", value: stats.pendingPayments, icon: CreditCard, color: "text-warning" },
    { label: "Open Complaints", value: stats.complaints, icon: AlertCircle, color: "text-destructive" },
    { label: "Pending Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your PG overview.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
