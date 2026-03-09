import { useEffect, useState } from "react";
import { Building2, Users, Home, CreditCard, TrendingUp, AlertCircle, IndianRupee, Receipt, Plus, ArrowRight, MessageSquare, BellDot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import OverLimitBanner from "@/components/OverLimitBanner";
import { useStaffAccess } from "@/hooks/useStaffAccess";

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#06b6d4", "#ec4899"];

const Dashboard = () => {
  const { user } = useAuth();
  const { isOverLimit, tenantCount, limits } = useSubscriptionGuard();
  const { effectiveOwnerId, isStaff, loading: staffLoading } = useStaffAccess();
  const [stats, setStats] = useState({
    properties: 0,
    rooms: 0,
    tenants: 0,
    pendingPayments: 0,
    complaints: 0,
    pendingRevenue: 0,
    collectedRevenue: 0,
    totalExpenses: 0,
    vacancyNotices: 0,
  });
  const [expensesByCategory, setExpensesByCategory] = useState<{ name: string; value: number }[]>([]);
  const [monthlyPayments, setMonthlyPayments] = useState<{ month: string; collected: number; pending: number }[]>([]);
  const [occupancy, setOccupancy] = useState({ occupied: 0, vacant: 0 });
  const [recentComplaints, setRecentComplaints] = useState<{ id: string; title: string; status: string; category: string; created_at: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [propRes, roomRes, tenantRes, pendingPayRes, paidPayRes, complaintRes, expRes, noticeRes, recentCompRes] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
        supabase.from("rooms").select("id, is_vacant, capacity, property_id, properties!inner(owner_id)").eq("properties.owner_id", user.id),
        supabase.from("tenant_assignments").select("id, property_id, properties!inner(owner_id)").eq("properties.owner_id", user.id).eq("is_active", true),
        supabase.from("rent_payments").select("id, amount, month, property_id, properties!inner(owner_id)").eq("properties.owner_id", user.id).eq("status", "pending"),
        supabase.from("rent_payments").select("id, amount, month, property_id, properties!inner(owner_id)").eq("properties.owner_id", user.id).eq("status", "paid"),
        supabase.from("complaints").select("id, property_id, properties!inner(owner_id)").eq("properties.owner_id", user.id).eq("status", "open"),
        supabase.from("expenses").select("amount, category, property_id, properties!inner(owner_id)").eq("properties.owner_id", user.id),
        supabase.from("vacancy_notices").select("id, property_id, properties!inner(owner_id)").eq("properties.owner_id", user.id).eq("status", "submitted"),
        supabase.from("complaints").select("id, title, status, category, created_at, property_id, properties!inner(owner_id)").eq("properties.owner_id", user.id).order("created_at", { ascending: false }).limit(5),
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
        vacancyNotices: noticeRes.data?.length ?? 0,
      });

      setRecentComplaints(recentCompRes.data ?? []);

      // Occupancy — use bed capacity and active tenant count
      const activeTenants = tenantRes.data?.length ?? 0;
      const totalBeds = rooms.reduce((sum, r) => sum + (r.capacity ?? 1), 0);
      setOccupancy({ occupied: activeTenants, vacant: Math.max(0, totalBeds - activeTenants) });

      // Expense by category
      const catMap: Record<string, number> = {};
      expenses.forEach((e) => {
        catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount);
      });
      setExpensesByCategory(Object.entries(catMap).map(([name, value]) => ({ name, value })));

      // Monthly payments
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

  const profit = stats.collectedRevenue - stats.totalExpenses;
  const isNewOwner = stats.properties === 0;

  // Onboarding steps
  const onboardingSteps = [
    { done: stats.properties > 0, label: "Add your first property", link: "/dashboard/properties", icon: Building2 },
    { done: stats.rooms > 0, label: "Create rooms with pricing", link: "/dashboard/rooms", icon: Home },
    { done: stats.tenants > 0, label: "Assign your first tenant", link: "/dashboard/tenants", icon: Users },
    { done: stats.pendingPayments > 0 || stats.collectedRevenue > 0, label: "Generate monthly rent", link: "/dashboard/payments", icon: CreditCard },
  ];

  const completedSteps = onboardingSteps.filter(s => s.done).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {isOverLimit && (
          <OverLimitBanner tenantCount={tenantCount} tenantLimit={limits.tenantLimit} planName={limits.name} />
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your PG overview.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/payments"><CreditCard className="w-4 h-4 mr-1" /> Payments</Link>
            </Button>
            <Button size="sm" className="gradient-primary" asChild>
              <Link to="/dashboard/properties"><Plus className="w-4 h-4 mr-1" /> Add Property</Link>
            </Button>
          </div>
        </div>

        {/* Onboarding progress - show if not fully set up */}
        {completedSteps < 4 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Setup Your PG</h3>
                  <p className="text-sm text-muted-foreground">{completedSteps}/4 steps completed</p>
                </div>
                <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(completedSteps / 4) * 100}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {onboardingSteps.map((step, i) => (
                  <Link
                    key={i}
                    to={step.link}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      step.done ? "bg-success/10 text-success" : "bg-card hover:bg-muted"
                    }`}
                  >
                    <step.icon className="w-4 h-4 shrink-0" />
                    <span className={`text-sm ${step.done ? "line-through" : "font-medium"}`}>{step.label}</span>
                    {!step.done && <ArrowRight className="w-3 h-3 ml-auto" />}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Properties", value: stats.properties, icon: Building2, color: "text-primary", link: "/dashboard/properties" },
            { label: "Total Rooms", value: stats.rooms, icon: Home, color: "text-primary", link: "/dashboard/rooms" },
            { label: "Active Tenants", value: stats.tenants, icon: Users, color: "text-primary", link: "/dashboard/tenants" },
            { label: "Open Complaints", value: stats.complaints, icon: AlertCircle, color: "text-destructive", link: "/dashboard/complaints" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={stat.link}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Collected</CardTitle>
              <TrendingUp className="w-5 h-5 text-success" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold flex items-center gap-0.5">
                <IndianRupee className="w-4 h-4" />{stats.collectedRevenue.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className={stats.pendingRevenue > 0 ? "border-warning/50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              <CreditCard className="w-5 h-5 text-warning" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold flex items-center gap-0.5">
                <IndianRupee className="w-4 h-4" />{stats.pendingRevenue.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
              <Receipt className="w-5 h-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold flex items-center gap-0.5">
                <IndianRupee className="w-4 h-4" />{stats.totalExpenses.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
              <TrendingUp className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className={`text-xl font-bold flex items-center gap-0.5 ${profit < 0 ? "text-destructive" : ""}`}>
                <IndianRupee className="w-4 h-4" />{profit.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Row */}
        {(stats.vacancyNotices > 0 || stats.complaints > 0) && (
          <div className="flex flex-wrap gap-3">
            {stats.vacancyNotices > 0 && (
              <Link to="/dashboard/notices">
                <Badge variant="secondary" className="bg-warning/10 text-warning px-3 py-1.5 cursor-pointer hover:bg-warning/20 transition-colors">
                  <BellDot className="w-3 h-3 mr-1.5" />{stats.vacancyNotices} vacancy notice{stats.vacancyNotices > 1 ? "s" : ""} pending
                </Badge>
              </Link>
            )}
            {stats.complaints > 0 && (
              <Link to="/dashboard/complaints">
                <Badge variant="secondary" className="bg-destructive/10 text-destructive px-3 py-1.5 cursor-pointer hover:bg-destructive/20 transition-colors">
                  <MessageSquare className="w-3 h-3 mr-1.5" />{stats.complaints} open complaint{stats.complaints > 1 ? "s" : ""}
                </Badge>
              </Link>
            )}
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Monthly Payments</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs" asChild>
                  <Link to="/dashboard/payments">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {monthlyPayments.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyPayments}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis fontSize={11} />
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
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Expense Breakdown</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs" asChild>
                  <Link to="/dashboard/expenses">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {expensesByCategory.length > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie data={expensesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                        {expensesByCategory.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5">
                    {expensesByCategory.map((e, i) => (
                      <div key={e.name} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
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

        {/* Occupancy + Recent Complaints */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Occupancy */}
          {stats.rooms > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Occupancy Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-1">
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((occupancy.occupied) / (occupancy.occupied + occupancy.vacant || 1)) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-lg font-bold">{Math.round((occupancy.occupied / (occupancy.occupied + occupancy.vacant || 1)) * 100)}%</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <Badge variant="default">{occupancy.occupied} Occupied Beds</Badge>
                  <Badge variant="secondary">{occupancy.vacant} Vacant Beds</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Complaints */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Complaints</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs" asChild>
                  <Link to="/dashboard/complaints">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentComplaints.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No complaints — all clear! 🎉</p>
              ) : (
                <div className="space-y-3">
                  {recentComplaints.slice(0, 4).map(c => (
                    <div key={c.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{c.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{c.category} · {new Date(c.created_at).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="secondary" className={`text-xs ${c.status === "resolved" ? "bg-success/10 text-success" : c.status === "open" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                        {c.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
