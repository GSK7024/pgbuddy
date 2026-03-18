import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarDays, Check, CheckCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStaffAccess } from "@/hooks/useStaffAccess";

interface MemberRow {
  memberId: string;
  name: string;
  planMeals: string[];
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  isOffDay: boolean;
}

const MessAttendance = () => {
  const { toast } = useToast();
  const { effectiveOwnerId, loading: staffLoading } = useStaffAccess();
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!effectiveOwnerId || staffLoading) return;
    fetchAttendance();
  }, [effectiveOwnerId, staffLoading, date]);

  const fetchAttendance = async () => {
    setLoading(true);

    // Get active members + their plans
    const { data: members } = await supabase
      .from("mess_members" as any)
      .select("id, full_name, plan_id")
      .eq("owner_id", effectiveOwnerId!)
      .eq("status", "active");

    if (!members || members.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    // Get plans for meal info
    const { data: plans } = await supabase
      .from("mess_plans" as any)
      .select("id, meals_included")
      .eq("owner_id", effectiveOwnerId!);

    const planMap: Record<string, string[]> = {};
    (plans ?? []).forEach((p: any) => { planMap[p.id] = p.meals_included || []; });

    const memberIds = (members as any[]).map(m => m.id);

    // Get existing attendance for this date
    const { data: attendance } = await supabase
      .from("mess_attendance" as any)
      .select("*")
      .eq("attendance_date", date)
      .in("member_id", memberIds);

    const attMap: Record<string, any> = {};
    (attendance ?? []).forEach((a: any) => { attMap[a.member_id] = a; });

    // Get off days
    const { data: offDays } = await supabase
      .from("mess_off_days" as any)
      .select("member_id")
      .eq("off_date", date)
      .in("member_id", memberIds);

    const offSet = new Set((offDays ?? []).map((o: any) => o.member_id));

    setRows((members as any[]).map(m => ({
      memberId: m.id,
      name: m.full_name,
      planMeals: m.plan_id ? (planMap[m.plan_id] || []) : [],
      breakfast: attMap[m.id]?.breakfast || false,
      lunch: attMap[m.id]?.lunch || false,
      dinner: attMap[m.id]?.dinner || false,
      isOffDay: offSet.has(m.id),
    })));
    setLoading(false);
  };

  const toggleMeal = (idx: number, meal: "breakfast" | "lunch" | "dinner") => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [meal]: !r[meal] } : r));
  };

  const markAllPresent = (meal: "breakfast" | "lunch" | "dinner") => {
    setRows(prev => prev.map(r => {
      if (r.isOffDay || !r.planMeals.includes(meal)) return r;
      return { ...r, [meal]: true };
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    for (const row of rows) {
      if (row.isOffDay) continue;
      await supabase.from("mess_attendance" as any).upsert({
        member_id: row.memberId,
        attendance_date: date,
        breakfast: row.breakfast,
        lunch: row.lunch,
        dinner: row.dinner,
        marked_by: effectiveOwnerId,
      }, { onConflict: "member_id,attendance_date" });
    }
    setSaving(false);
    toast({ title: "Attendance saved!" });
  };

  const stats = {
    total: rows.length,
    present: rows.filter(r => r.breakfast || r.lunch || r.dinner).length,
    offDay: rows.filter(r => r.isOffDay).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-primary" />
              Mess Attendance
            </h1>
            <p className="text-muted-foreground">Mark daily meal attendance</p>
          </div>
          <div className="flex gap-2 items-center">
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-44" />
            <Button onClick={handleSave} disabled={saving} className="gradient-primary gap-2">
              <Check className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="py-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Members</div>
          </CardContent></Card>
          <Card><CardContent className="py-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            <div className="text-xs text-muted-foreground">Present</div>
          </CardContent></Card>
          <Card><CardContent className="py-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.offDay}</div>
            <div className="text-xs text-muted-foreground">Off Day</div>
          </CardContent></Card>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold mb-1">No Active Members</h3>
              <p className="text-muted-foreground text-sm">Add members first from the Members page</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-3 px-4 text-sm font-semibold">Member</th>
                      <th className="text-center py-3 px-3 text-sm font-semibold">
                        <div className="flex flex-col items-center gap-1">
                          <span>🌅 Breakfast</span>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => markAllPresent("breakfast")}>
                            <CheckCheck className="w-3 h-3 mr-1" /> All
                          </Button>
                        </div>
                      </th>
                      <th className="text-center py-3 px-3 text-sm font-semibold">
                        <div className="flex flex-col items-center gap-1">
                          <span>☀️ Lunch</span>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => markAllPresent("lunch")}>
                            <CheckCheck className="w-3 h-3 mr-1" /> All
                          </Button>
                        </div>
                      </th>
                      <th className="text-center py-3 px-3 text-sm font-semibold">
                        <div className="flex flex-col items-center gap-1">
                          <span>🌙 Dinner</span>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => markAllPresent("dinner")}>
                            <CheckCheck className="w-3 h-3 mr-1" /> All
                          </Button>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={row.memberId} className={`border-b last:border-0 ${row.isOffDay ? "bg-yellow-50/50 dark:bg-yellow-900/10" : ""}`}>
                        <td className="py-3 px-4">
                          <div className="font-medium text-sm">{row.name}</div>
                          {row.isOffDay && <Badge variant="outline" className="text-[10px] text-yellow-600 mt-1">Off Day</Badge>}
                        </td>
                        {(["breakfast", "lunch", "dinner"] as const).map(meal => (
                          <td key={meal} className="text-center py-3 px-3">
                            {row.planMeals.includes(meal) ? (
                              <Checkbox
                                checked={row[meal]}
                                disabled={row.isOffDay}
                                onCheckedChange={() => toggleMeal(idx, meal)}
                                className="mx-auto"
                              />
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MessAttendance;
