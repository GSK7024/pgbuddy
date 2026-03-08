import { useEffect, useState } from "react";
import { Users, TrendingUp, IndianRupee, ArrowRightLeft, Home, CalendarIcon } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, eachMonthOfInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { motion } from "framer-motion";

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

type PresetKey = "last30" | "last3m" | "last6m" | "last12m" | "custom";

const presets: { key: PresetKey; label: string }[] = [
  { key: "last30", label: "Last 30 days" },
  { key: "last3m", label: "Last 3 months" },
  { key: "last6m", label: "Last 6 months" },
  { key: "last12m", label: "Last 12 months" },
  { key: "custom", label: "Custom range" },
];

const getPresetRange = (key: PresetKey): { from: Date; to: Date } => {
  const now = new Date();
  switch (key) {
    case "last30": return { from: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30), to: now };
    case "last3m": return { from: subMonths(now, 3), to: now };
    case "last6m": return { from: subMonths(now, 6), to: now };
    case "last12m": return { from: subMonths(now, 12), to: now };
    default: return { from: subMonths(now, 6), to: now };
  }
};

const TenantAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activePreset, setActivePreset] = useState<PresetKey>("last6m");
  const [dateRange, setDateRange] = useState(getPresetRange("last6m"));
  const [customFrom, setCustomFrom] = useState<Date | undefined>(undefined);
  const [customTo, setCustomTo] = useState<Date | undefined>(undefined);

  const [occupancyData, setOccupancyData] = useState<PropertyOccupancy[]>([]);
  const [revenueData, setRevenueData] = useState<PropertyRevenue[]>([]);
  const [turnoverData, setTurnoverData] = useState<TurnoverMonth[]>([]);
  const [revenueTrendData, setRevenueTrendData] = useState<{ month: string; collected: number; pending: number }[]>([]);
  const [summary, setSummary] = useState({
    totalBeds: 0, occupiedBeds: 0, totalRevenue: 0, pendingRevenue: 0,
    totalMoveIns: 0, totalMoveOuts: 0, avgStayDays: 0,
  });

  // Raw data cache
  const [rawData, setRawData] = useState<{
    properties: { id: string; name: string }[];
    rooms: { id: string; property_id: string; capacity: number; is_vacant: boolean }[];
    assignments: any[];
    payments: any[];
  }>({ properties: [], rooms: [], assignments: [], payments: [] });

  useEffect(() => {
    if (!user) return;
    fetchRawData();
  }, [user]);

  useEffect(() => {
    if (rawData.properties.length > 0 || !loading) {
      processAnalytics();
    }
  }, [dateRange, rawData]);

  const fetchRawData = async () => {
    if (!user) return;
    const [propRes, roomRes, assignRes, payRes] = await Promise.all([
      supabase.from("properties").select("id, name").eq("owner_id", user.id),
      supabase.from("rooms").select("id, property_id, capacity, is_vacant"),
      supabase.from("tenant_assignments").select("id, property_id, is_active, move_in_date, move_out_date, custom_rent, rooms(rent_amount)"),
      supabase.from("rent_payments").select("property_id, amount, status, created_at"),
    ]);
    setRawData({
      properties: propRes.data ?? [],
      rooms: roomRes.data ?? [],
      assignments: assignRes.data ?? [],
      payments: payRes.data ?? [],
    });
    setLoading(false);
  };

  const processAnalytics = () => {
    const { properties, rooms, assignments, payments } = rawData;
    const propIds = new Set(properties.map(p => p.id));
    const { from, to } = dateRange;

    const ownerRooms = rooms.filter(r => propIds.has(r.property_id));
    const ownerAssignments = assignments.filter(a => propIds.has(a.property_id));
    const ownerPayments = payments.filter(p => propIds.has(p.property_id));

    // Filter payments by date range
    const rangePayments = ownerPayments.filter(p => {
      const d = new Date(p.created_at);
      return d >= from && d <= to;
    });

    // Filter assignments active within range for turnover
    const rangeAssignments = ownerAssignments.filter(a => {
      const moveIn = new Date(a.move_in_date);
      const moveOut = a.move_out_date ? new Date(a.move_out_date) : null;
      return moveIn <= to && (!moveOut || moveOut >= from);
    });

    // Occupancy (current snapshot - not date-filtered)
    const occData: PropertyOccupancy[] = properties.map(p => {
      const propRooms = ownerRooms.filter(r => r.property_id === p.id);
      const totalBeds = propRooms.reduce((s, r) => s + r.capacity, 0);
      const occupied = ownerAssignments.filter(a => a.property_id === p.id && a.is_active).length;
      return {
        name: p.name, totalBeds,
        occupied: Math.min(occupied, totalBeds),
        vacant: Math.max(totalBeds - occupied, 0),
        rate: totalBeds > 0 ? Math.round((Math.min(occupied, totalBeds) / totalBeds) * 100) : 0,
      };
    });
    setOccupancyData(occData);

    // Revenue per property (date-filtered)
    const revData: PropertyRevenue[] = properties.map(p => {
      const propPay = rangePayments.filter(pay => pay.property_id === p.id);
      const collected = propPay.filter(pay => pay.status === "paid").reduce((s, pay) => s + Number(pay.amount), 0);
      const pending = propPay.filter(pay => pay.status === "pending").reduce((s, pay) => s + Number(pay.amount), 0);
      return { name: p.name, collected, pending, total: collected + pending };
    });
    setRevenueData(revData);

    // Turnover by month within range
    const monthStarts = eachMonthOfInterval({ start: startOfMonth(from), end: endOfMonth(to) });
    const months: TurnoverMonth[] = monthStarts.map(ms => {
      const key = format(ms, "yyyy-MM");
      const label = format(ms, "MMM yy");
      const moveIns = ownerAssignments.filter(a => a.move_in_date?.startsWith(key)).length;
      const moveOuts = ownerAssignments.filter(a => a.move_out_date?.startsWith(key)).length;
      return { month: label, moveIns, moveOuts };
    });
    setTurnoverData(months);

    // Monthly revenue trend within range
    const revTrend = monthStarts.map(ms => {
      const key = format(ms, "yyyy-MM");
      const label = format(ms, "MMM yy");
      const monthPayments = rangePayments.filter(p => p.created_at?.startsWith(key));
      const collected = monthPayments.filter(p => p.status === "paid").reduce((s: number, p: any) => s + Number(p.amount), 0);
      const pending = monthPayments.filter(p => p.status === "pending").reduce((s: number, p: any) => s + Number(p.amount), 0);
      return { month: label, collected, pending };
    });
    setRevenueTrendData(revTrend);

    // Summary
    const totalBeds = occData.reduce((s, o) => s + o.totalBeds, 0);
    const occupiedBeds = occData.reduce((s, o) => s + o.occupied, 0);
    const totalRevenue = revData.reduce((s, r) => s + r.collected, 0);
    const pendingRevenue = revData.reduce((s, r) => s + r.pending, 0);
    const totalMoveIns = months.reduce((s, m) => s + m.moveIns, 0);
    const totalMoveOuts = months.reduce((s, m) => s + m.moveOuts, 0);

    const movedOut = rangeAssignments.filter(a => !a.is_active && a.move_out_date);
    const avgStay = movedOut.length > 0
      ? Math.round(movedOut.reduce((s: number, a: any) => {
          const inD = new Date(a.move_in_date).getTime();
          const outD = new Date(a.move_out_date).getTime();
          return s + (outD - inD) / (1000 * 60 * 60 * 24);
        }, 0) / movedOut.length)
      : 0;

    setSummary({ totalBeds, occupiedBeds, totalRevenue, pendingRevenue, totalMoveIns, totalMoveOuts, avgStayDays: avgStay });
  };

  const handlePreset = (key: PresetKey) => {
    setActivePreset(key);
    if (key !== "custom") {
      setDateRange(getPresetRange(key));
    }
  };

  const applyCustomRange = () => {
    if (customFrom && customTo) {
      setDateRange({ from: customFrom, to: customTo });
    }
  };

  const overallOccupancy = summary.totalBeds > 0 ? Math.round((summary.occupiedBeds / summary.totalBeds) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Tenant Analytics</h1>
            <p className="text-muted-foreground">Occupancy, revenue & turnover insights</p>
          </div>
          <div className="text-xs text-muted-foreground">
            {format(dateRange.from, "MMM d, yyyy")} – {format(dateRange.to, "MMM d, yyyy")}
          </div>
        </div>

        {/* Date Range Filters */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              {presets.map(p => (
                <Button
                  key={p.key}
                  size="sm"
                  variant={activePreset === p.key ? "default" : "outline"}
                  onClick={() => handlePreset(p.key)}
                  className={activePreset === p.key ? "gradient-primary" : ""}
                >
                  {p.label}
                </Button>
              ))}

              {activePreset === "custom" && (
                <div className="flex flex-wrap items-center gap-2 ml-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("gap-1.5", !customFrom && "text-muted-foreground")}>
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {customFrom ? format(customFrom, "MMM d, yyyy") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customFrom}
                        onSelect={setCustomFrom}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-muted-foreground text-sm">→</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("gap-1.5", !customTo && "text-muted-foreground")}>
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {customTo ? format(customTo, "MMM d, yyyy") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customTo}
                        onSelect={setCustomTo}
                        disabled={(date) => date > new Date() || (customFrom ? date < customFrom : false)}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <Button size="sm" onClick={applyCustomRange} disabled={!customFrom || !customTo}>
                    Apply
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
                      <span className="text-sm text-muted-foreground">Turnover</span>
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
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Occupancy by Property</CardTitle>
                </CardHeader>
                <CardContent>
                  {occupancyData.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No properties yet</p>
                  ) : (
                    <div className="space-y-4">
                      {occupancyData.map((p) => (
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
                <CardTitle className="text-base">Tenant Turnover</CardTitle>
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

            {/* Monthly Revenue Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Monthly Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {revenueTrendData.every(d => d.collected === 0 && d.pending === 0) ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No payment data in this period</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={revenueTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                        formatter={(value: number) => [`₹${value.toLocaleString()}`]}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="collected" name="Collected" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

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
