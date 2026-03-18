import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, IndianRupee, Users, Utensils, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useStaffAccess } from "@/hooks/useStaffAccess";
import { format, startOfMonth, endOfMonth } from "date-fns";

const MessDashboard = () => {
  const { effectiveOwnerId, loading: staffLoading } = useStaffAccess();
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    oneTimeMeals: 0,
    oneTimeRevenue: 0,
    attendanceRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!effectiveOwnerId || staffLoading) return;
    fetchDashboardData();
  }, [effectiveOwnerId, staffLoading]);

  const fetchDashboardData = async () => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const monthStr = format(new Date(), "yyyy-MM");

    // 1. Members
    const { data: members } = await supabase
      .from("mess_members" as any)
      .select("id, status")
      .eq("owner_id", effectiveOwnerId!);

    const activeCount = members?.filter((m: any) => m.status === "active").length || 0;

    // 2. Revenue (Members)
    const { data: payments } = await supabase
      .from("mess_payments" as any)
      .select("final_amount")
      .eq("month", monthStr)
      .eq("status", "paid");

    const memberRevenue = (payments as any[])?.reduce((sum, p) => sum + Number(p.final_amount), 0) || 0;

    // 3. Revenue (One-time) - Safe catch if table doesn't exist yet
    let guestRevenue = 0;
    let guestCount = 0;
    try {
      const { data: guests } = await supabase
        .from("mess_one_time_meals" as any)
        .select("amount")
        .eq("owner_id", effectiveOwnerId!)
        .gte("meal_date", format(start, "yyyy-MM-dd"))
        .lte("meal_date", format(end, "yyyy-MM-dd"));
      
      guestRevenue = (guests as any[])?.reduce((sum, g) => sum + Number(g.amount), 0) || 0;
      guestCount = guests?.length || 0;
    } catch (e) { console.log("Expansion tables missing"); }

    // 4. Expenses
    let expensesTotal = 0;
    try {
      const { data: expenses } = await supabase
        .from("mess_expenses" as any)
        .select("amount")
        .eq("owner_id", effectiveOwnerId!)
        .gte("expense_date", format(start, "yyyy-MM-dd"))
        .lte("expense_date", format(end, "yyyy-MM-dd"));
      
      expensesTotal = (expenses as any[])?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    } catch (e) {}

    // 5. Attendance Rate (Simplified: Present / (Active * DaysInMonth))
    const daysPassed = new Date().getDate();
    const { data: attendance } = await supabase
      .from("mess_attendance" as any)
      .select("breakfast, lunch, dinner")
      .gte("attendance_date", format(start, "yyyy-MM-dd"))
      .lte("attendance_date", format(new Date(), "yyyy-MM-dd"));

    const totalCheckins = (attendance as any[])?.reduce((sum, a) => sum + (a.breakfast ? 1 : 0) + (a.lunch ? 1 : 0) + (a.dinner ? 1 : 0), 0) || 0;
    const possibleCheckins = activeCount * daysPassed * 3; // Approx 3 meals/day
    const attendanceRate = possibleCheckins > 0 ? Math.round((totalCheckins / possibleCheckins) * 100) : 0;

    setStats({
      totalMembers: members?.length || 0,
      activeMembers: activeCount,
      monthlyRevenue: memberRevenue + guestRevenue,
      monthlyExpenses: expensesTotal,
      oneTimeMeals: guestCount,
      oneTimeRevenue: guestRevenue,
      attendanceRate,
    });
    setLoading(false);
  };

  const netProfit = stats.monthlyRevenue - stats.monthlyExpenses;

  return (
    <div className="space-y-6">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="gradient-info text-white border-none shadow-md">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-medium text-sm">Monthly Revenue</p>
                <h3 className="text-2xl font-bold mt-1">₹{stats.monthlyRevenue.toLocaleString("en-IN")}</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-xs mt-4 text-blue-50 font-medium">Includes ₹{stats.oneTimeRevenue} from guest meals</p>
          </CardContent>
        </Card>

        <Card className="gradient-destructive text-white border-none shadow-md">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-medium text-sm">Monthly Expenses</p>
                <h3 className="text-2xl font-bold mt-1">₹{stats.monthlyExpenses.toLocaleString("en-IN")}</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-xs mt-4 text-red-50 font-medium">Groceries, gas, and utilities</p>
          </CardContent>
        </Card>

        <Card className="gradient-primary text-white border-none shadow-md">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-medium text-sm">Active Members</p>
                <h3 className="text-2xl font-bold mt-1">{stats.activeMembers}</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-xs mt-4 text-purple-50 font-medium">Out of {stats.totalMembers} total subscribers</p>
          </CardContent>
        </Card>

        <Card className={netProfit >= 0 ? "gradient-success text-white border-none shadow-md" : "gradient-destructive text-white border-none shadow-md"}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-medium text-sm">Net Profit</p>
                <h3 className="text-2xl font-bold mt-1">₹{netProfit.toLocaleString("en-IN")}</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <IndianRupee className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-xs mt-4 text-emerald-50 font-medium">For the month of {format(new Date(), "MMMM")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Summary */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Engagement</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Monthly Attendance Rate</span>
                <span className="font-semibold">{stats.attendanceRate}%</span>
              </div>
              <Progress value={stats.attendanceRate} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-muted/40 rounded-xl">
                <Utensils className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-xl font-bold">{stats.oneTimeMeals}</div>
                <div className="text-xs text-muted-foreground">Guest Meals</div>
              </div>
              <div className="p-4 bg-muted/40 rounded-xl">
                <BookOpen className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-xl font-bold">{stats.activeMembers}</div>
                <div className="text-xs text-muted-foreground">Plan Members</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / One-time Meal recording is handled in a separate component/tab or here */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Quick Guide</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">1</div>
                <p>Record guest meals to track "one-time" revenue in Analytics.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">2</div>
                <p>Add mess expenses (vegetables, gas, etc.) to calculate accurate profit.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">3</div>
                <p>Generate monthly bills in the Payments tab to collect rent from members.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MessDashboard;
