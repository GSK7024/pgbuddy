import { useEffect, useState } from "react";
import { Building2, Users, Home, CreditCard, TrendingUp, AlertCircle, IndianRupee, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#06b6d4", "#ec4899"];

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    properties: 0,
    rooms: 0,
    tenants: 0,
    pendingPayments: 0,
    complaints: 0,
    pendingRevenue: 0,
    collectedRevenue: 0,
    totalExpenses: 0,
  });
  const [expensesByCategory, setExpensesByCategory] = useState<{ name: string; value: number }[]>([]);
  const [monthlyPayments, setMonthlyPayments] = useState<{ month: string; collected: number; pending: number }[]>([]);
  const [occupancy, setOccupancy] = useState({ occupied: 0, vacant: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [propRes, roomRes, tenantRes, pendingPayRes, paidPayRes, complaintRes, expRes] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
        supabase.from("rooms").select("id, is_vacant, property_id, properties!inner(owner_id)").eq("properties.owner_id", user.id),
        supabase.from("tenant_assignments").select("id, property_id, properties!inner(owner_id)").eq("properties.owner_id", user.id).eq("is_active", true),
        supabase.from("rent_payments").select("id, amount, month, property_id, properties!inner(owner_id)").eq("properties.owner_id", user.id).eq("status", "pending"),
        supabase.from("rent_payments").select("id, amount, month, property_id, properties!inner(owner_id)").eq("properties.owner_id", user.id).eq("status", "paid"),
        supabase.from("complaints").select("id, property_id, properties!inner(owner_id)").eq("properties.owner_id", user.id).eq("status", "open"),
        supabase.from("expenses").select("amount, category, property_id, properties!inner(owner_id)").eq("properties.owner_id", user.id),
      ]);

      const rooms = roomRes.data ?? [];
      const pendingPay = pendingPayRes.data ?? [];
      const paidPay = paidPayRes.data ?? [];
      const expenses = expRes.data ?? [];

      setStats({
        properties: propRes.count ?? 0,
        rooms: rooms.length,
        tenants: tenantRes.data?.length ?? 0,
        pendingPayments: pendingPay.length,
        complaints: complaintRes.data?.length ?? 0,
        pendingRevenue: pendingPay.reduce((s, p) => s + Number(p.amount), 0),
        collectedRevenue: paidPay.reduce((s, p) => s + Number(p.amount), 0),
        totalExpenses: expenses.reduce((s, e) => s + Number(e.amount), 0),
      });

      // Occupancy
      const occupied = rooms.filter((r) => !r.is_vacant).length;
      setOccupancy({ occupied, vacant: rooms.length - occupied });

      // Expense by category
      const catMap: Record<string, number> = {};
      expenses.forEach((e) => {
        catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount);
      });
      setExpensesByCategory(Object.entries(catMap).map(([name, value]) => ({ name, value })));

      // Monthly payments (aggregate by month)
      const monthMap: Record<string, { collected: number; pending: number }> = {};
      paidPay.forEach((p) => {
        if (!monthMap[p.month]) monthMap[p.month] = { collected: 0, pending: 0 };
        monthMap[p.month].collected += Number(p.amount);
      });
      pendingPay.forEach((p) => {
        if (!monthMap[p.month]) monthMap[p.month] = { collected: 0, pending: 0 };
        monthMap[p.month].pending += Number(p.amount);
      });
      setMonthlyPayments(
        Object.entries(monthMap)
          .map(([month, data]) => ({ month, ...data }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-6)
      );
    };
    fetchStats();
  }, [user]);

  const statCards = [
    { label: "Properties", value: stats.properties, icon: Building2, color: "text-primary" },
    { label: "Total Rooms", value: stats.rooms, icon: Home, color: "text-primary" },
    { label: "Active Tenants", value: stats.tenants, icon: Users, color: "text-primary" },
    { label: "Open Complaints", value: stats.complaints, icon: AlertCircle, color: "text-destructive" },
  ];

  const profit = stats.collectedRevenue - stats.totalExpenses;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your PG overview.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Financial Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Collected Revenue</CardTitle>
              <TrendingUp className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold flex items-center gap-1">
                <IndianRupee className="w-5 h-5" />{stats.collectedRevenue.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              <Receipt className="w-5 h-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold flex items-center gap-1">
                <IndianRupee className="w-5 h-5" />{stats.totalExpenses.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
              <CreditCard className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold flex items-center gap-1 ${profit >= 0 ? "" : "text-destructive"}`}>
                <IndianRupee className="w-5 h-5" />{profit.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyPayments.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyPayments}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="collected" name="Collected" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" name="Pending" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">No payment data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Expense Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {expensesByCategory.length > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie data={expensesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                        {expensesByCategory.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {expensesByCategory.map((e, i) => (
                      <div key={e.name} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="capitalize text-muted-foreground">{e.name}</span>
                        <span className="font-medium ml-auto">₹{e.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">No expense data yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Occupancy */}
        {stats.rooms > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Occupancy Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-4 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(occupancy.occupied / stats.rooms) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm">
                  <span className="font-bold">{Math.round((occupancy.occupied / stats.rooms) * 100)}%</span>
                  <span className="text-muted-foreground ml-1">({occupancy.occupied}/{stats.rooms} rooms)</span>
                </div>
              </div>
              <div className="flex gap-4 mt-3 text-sm">
                <Badge variant="default">{occupancy.occupied} Occupied</Badge>
                <Badge variant="secondary">{occupancy.vacant} Vacant</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
