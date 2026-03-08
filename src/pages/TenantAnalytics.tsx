import { useEffect, useState } from "react";
import { Users, Building2, TrendingUp, TrendingDown, IndianRupee, ArrowRightLeft, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { motion } from "framer-motion";

const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#6366f1"];

interface PropertyOccupancy {
  name: string;
  totalBeds: number;
  occupied: number;
  vacant: number;
  rate: number;
}

interface PropertyRevenue {
  name: string;
  collected: number;
  pending: number;
  total: number;
}

interface TurnoverMonth {
  month: string;
  moveIns: number;
  moveOuts: number;
}

const TenantAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [occupancyData, setOccupancyData] = useState<PropertyOccupancy[]>([]);
  const [revenueData, setRevenueData] = useState<PropertyRevenue[]>([]);
  const [turnoverData, setTurnoverData] = useState<TurnoverMonth[]>([]);
  const [summary, setSummary] = useState({
    totalBeds: 0, occupiedBeds: 0, totalRevenue: 0, pendingRevenue: 0,
    totalMoveIns: 0, totalMoveOuts: 0, avgStayDays: 0,
  });

  useEffect(() => {
    if (!user) return;
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;
    const [propRes, roomRes, assignRes, payRes] = await Promise.all([
      supabase.from("properties").select("id, name").eq("owner_id", user.id),
      supabase.from("rooms").select("id, property_id, capacity, is_vacant"),
      supabase.from("tenant_assignments").select("id, property_id, is_active, move_in_date, move_out_date, custom_rent, rooms(rent_amount)"),
      supabase.from("rent_payments").select("property_id, amount, status"),
    ]);

    const properties = propRes.data ?? [];
    const rooms = roomRes.data ?? [];
    const assignments = assignRes.data ?? [];
    const payments = payRes.data ?? [];
    const propIds = new Set(properties.map(p => p.id));

    // Filter to owner's properties
    const ownerRooms = rooms.filter(r => propIds.has(r.property_id));
    const ownerAssignments = assignments.filter(a => propIds.has(a.property_id));
    const ownerPayments = payments.filter(p => propIds.has(p.property_id));

    // Occupancy per property
    const occData: PropertyOccupancy[] = properties.map(p => {
      const propRooms = ownerRooms.filter(r => r.property_id === p.id);
      const totalBeds = propRooms.reduce((s, r) => s + r.capacity, 0);
      const occupied = ownerAssignments.filter(a => a.property_id === p.id && a.is_active).length;
      return {
        name: p.name,
        totalBeds,
        occupied: Math.min(occupied, totalBeds),
        vacant: Math.max(totalBeds - occupied, 0),
        rate: totalBeds > 0 ? Math.round((Math.min(occupied, totalBeds) / totalBeds) * 100) : 0,
      };
    });
    setOccupancyData(occData);

    // Revenue per property
    const revData: PropertyRevenue[] = properties.map(p => {
      const propPayments = ownerPayments.filter(pay => pay.property_id === p.id);
      const collected = propPayments.filter(pay => pay.status === "paid").reduce((s, pay) => s + Number(pay.amount), 0);
      const pending = propPayments.filter(pay => pay.status === "pending").reduce((s, pay) => s + Number(pay.amount), 0);
      return { name: p.name, collected, pending, total: collected + pending };
    });
    setRevenueData(revData);

    // Turnover - last 6 months
    const now = new Date();
    const months: TurnoverMonth[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
      const moveIns = ownerAssignments.filter(a => a.move_in_date?.startsWith(key)).length;
      const moveOuts = ownerAssignments.filter(a => a.move_out_date?.startsWith(key)).length;
      months.push({ month: label, moveIns, moveOuts });
    }
    setTurnoverData(months);

    // Summary
    const totalBeds = occData.reduce((s, o) => s + o.totalBeds, 0);
    const occupiedBeds = occData.reduce((s, o) => s + o.occupied, 0);
    const totalRevenue = revData.reduce((s, r) => s + r.collected, 0);
    const pendingRevenue = revData.reduce((s, r) => s + r.pending, 0);
    const totalMoveIns = months.reduce((s, m) => s + m.moveIns, 0);
    const totalMoveOuts = months.reduce((s, m) => s + m.moveOuts, 0);

    // Avg stay days for moved-out tenants
    const movedOut = ownerAssignments.filter(a => !a.is_active && a.move_out_date);
    const avgStay = movedOut.length > 0
      ? Math.round(movedOut.reduce((s, a) => {
          const inD = new Date(a.move_in_date).getTime();
          const outD = new Date(a.move_out_date!).getTime();
          return s + (outD - inD) / (1000 * 60 * 60 * 24);
        }, 0) / movedOut.length)
      : 0;

    setSummary({ totalBeds, occupiedBeds, totalRevenue, pendingRevenue, totalMoveIns, totalMoveOuts, avgStayDays: avgStay });
    setLoading(false);
  };

  const overallOccupancy = summary.totalBeds > 0 ? Math.round((summary.occupiedBeds / summary.totalBeds) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Tenant Analytics</h1>
          <p className="text-muted-foreground">Occupancy, revenue & turnover insights</p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading analytics...</p>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                <Card>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Occupancy</span>
                      <Home className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-2xl font-bold">{overallOccupancy}%</p>
                    <p className="text-xs text-muted-foreground">{summary.occupiedBeds}/{summary.totalBeds} beds</p>
                    <Progress value={overallOccupancy} className="mt-2 h-1.5" />
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <Card>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Collected</span>
                      <TrendingUp className="w-4 h-4 text-success" />
                    </div>
                    <p className="text-2xl font-bold flex items-center gap-0.5">
                      <IndianRupee className="w-5 h-5" />{summary.totalRevenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">₹{summary.pendingRevenue.toLocaleString()} pending</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Turnover (6mo)</span>
                      <ArrowRightLeft className="w-4 h-4 text-warning" />
                    </div>
                    <p className="text-2xl font-bold">{summary.totalMoveIns} / {summary.totalMoveOuts}</p>
                    <p className="text-xs text-muted-foreground">move-ins / move-outs</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Avg Stay</span>
                      <Users className="w-4 h-4 text-secondary" />
                    </div>
                    <p className="text-2xl font-bold">{summary.avgStayDays}</p>
                    <p className="text-xs text-muted-foreground">days (moved-out tenants)</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Occupancy per Property */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Occupancy by Property</CardTitle>
                </CardHeader>
                <CardContent>
                  {occupancyData.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No properties yet</p>
                  ) : (
                    <div className="space-y-4">
                      {occupancyData.map((p, i) => (
                        <div key={p.name} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium truncate">{p.name}</span>
                            <span className="text-muted-foreground">{p.occupied}/{p.totalBeds} beds ({p.rate}%)</span>
                          </div>
                          <Progress value={p.rate} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Revenue per Property */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Revenue by Property</CardTitle>
                </CardHeader>
                <CardContent>
                  {revenueData.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No revenue data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={revenueData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                        <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                        <Tooltip
                          contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                          formatter={(value: number) => [`₹${value.toLocaleString()}`]}
                        />
                        <Bar dataKey="collected" name="Collected" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Turnover Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Tenant Turnover (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={turnoverData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                    <Legend />
                    <Line type="monotone" dataKey="moveIns" name="Move-ins" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="moveOuts" name="Move-outs" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Occupancy Pie */}
            {summary.totalBeds > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Overall Bed Utilization</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Occupied", value: summary.occupiedBeds },
                          { name: "Vacant", value: summary.totalBeds - summary.occupiedBeds },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        <Cell fill="hsl(var(--primary))" />
                        <Cell fill="hsl(var(--muted))" />
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TenantAnalytics;
