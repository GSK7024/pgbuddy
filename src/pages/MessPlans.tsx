import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, UtensilsCrossed, IndianRupee, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStaffAccess } from "@/hooks/useStaffAccess";

interface MessPlan {
  id: string;
  name: string;
  meals_included: string[];
  monthly_price: number;
  description: string | null;
  is_active: boolean;
  memberCount?: number;
}

const MEAL_OPTIONS = [
  { key: "breakfast", label: "Breakfast", emoji: "🌅" },
  { key: "lunch", label: "Lunch", emoji: "☀️" },
  { key: "dinner", label: "Dinner", emoji: "🌙" },
];

const MessPlans = ({ standalone = true }: { standalone?: boolean }) => {
  const { toast } = useToast();
  const { effectiveOwnerId, loading: staffLoading } = useStaffAccess();
  const [plans, setPlans] = useState<MessPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MessPlan | null>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [mealsIncluded, setMealsIncluded] = useState<string[]>(["lunch"]);

  useEffect(() => {
    if (!effectiveOwnerId || staffLoading) return;
    fetchPlans();
  }, [effectiveOwnerId, staffLoading]);

  const fetchPlans = async () => {
    const { data } = await supabase
      .from("mess_plans" as any)
      .select("*")
      .eq("owner_id", effectiveOwnerId!)
      .order("created_at", { ascending: true });

    if (data) {
      // Get member counts per plan
      const { data: members } = await supabase
        .from("mess_members" as any)
        .select("plan_id")
        .eq("owner_id", effectiveOwnerId!)
        .eq("status", "active");

      const countMap: Record<string, number> = {};
      (members ?? []).forEach((m: any) => {
        countMap[m.plan_id] = (countMap[m.plan_id] || 0) + 1;
      });

      setPlans((data as any[]).map(p => ({ ...p, memberCount: countMap[p.id] || 0 })));
    }
    setLoading(false);
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setDescription("");
    setMealsIncluded(["lunch"]);
    setEditing(null);
  };

  const openEdit = (plan: MessPlan) => {
    setEditing(plan);
    setName(plan.name);
    setPrice(String(plan.monthly_price));
    setDescription(plan.description || "");
    setMealsIncluded(plan.meals_included);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name || !price || mealsIncluded.length === 0) {
      toast({ title: "Error", description: "Fill all fields and select at least one meal", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      owner_id: effectiveOwnerId!,
      name,
      monthly_price: parseFloat(price),
      description: description || null,
      meals_included: mealsIncluded,
    };

    if (editing) {
      await supabase.from("mess_plans" as any).update(payload).eq("id", editing.id);
      toast({ title: "Plan updated!" });
    } else {
      await supabase.from("mess_plans" as any).insert(payload);
      toast({ title: "Plan created!" });
    }
    setSaving(false);
    setDialogOpen(false);
    resetForm();
    fetchPlans();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this plan? Members on this plan will be unlinked.")) return;
    await supabase.from("mess_plans" as any).delete().eq("id", id);
    toast({ title: "Plan deleted" });
    fetchPlans();
  };

  const toggleActive = async (plan: MessPlan) => {
    await supabase.from("mess_plans" as any).update({ is_active: !plan.is_active }).eq("id", plan.id);
    fetchPlans();
  };

  const toggleMeal = (meal: string) => {
    setMealsIncluded(prev =>
      prev.includes(meal) ? prev.filter(m => m !== meal) : [...prev, meal]
    );
  };

  const content = (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          {!standalone ? null : (
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <UtensilsCrossed className="w-6 h-6 text-primary" />
                Mess Plans
              </h1>
              <p className="text-muted-foreground">Create and manage meal subscription plans</p>
            </div>
          )}
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2"><Plus className="w-4 h-4" /> Create Plan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit Plan" : "Create New Plan"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Plan Name</Label>
                  <Input placeholder="e.g. Lunch Only, Full Day" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <Label>Monthly Price (₹)</Label>
                  <Input type="number" placeholder="2500" value={price} onChange={e => setPrice(e.target.value)} />
                </div>
                <div>
                  <Label>Meals Included</Label>
                  <div className="flex gap-4 mt-2">
                    {MEAL_OPTIONS.map(m => (
                      <label key={m.key} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={mealsIncluded.includes(m.key)}
                          onCheckedChange={() => toggleMeal(m.key)}
                        />
                        <span className="text-sm">{m.emoji} {m.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Textarea placeholder="Brief description of this plan..." value={description} onChange={e => setDescription(e.target.value)} rows={2} />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary">
                  {saving ? "Saving..." : editing ? "Update Plan" : "Create Plan"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading plans...</div>
        ) : plans.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <UtensilsCrossed className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold mb-1">No Plans Yet</h3>
              <p className="text-muted-foreground text-sm">Create your first meal plan to start adding members</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map(plan => (
              <Card key={plan.id} className={`relative transition-all ${!plan.is_active ? "opacity-60" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(plan)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(plan.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  {plan.description && <p className="text-xs text-muted-foreground">{plan.description}</p>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-1 text-2xl font-bold">
                    <IndianRupee className="w-5 h-5" />
                    {plan.monthly_price.toLocaleString("en-IN")}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.meals_included.map(m => {
                      const opt = MEAL_OPTIONS.find(o => o.key === m);
                      return (
                        <Badge key={m} variant="secondary" className="text-xs">
                          {opt?.emoji} {opt?.label || m}
                        </Badge>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      {plan.memberCount} active member{plan.memberCount !== 1 ? "s" : ""}
                    </span>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => toggleActive(plan)}>
                      {plan.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
  );

  return standalone ? <DashboardLayout>{content}</DashboardLayout> : content;
};

export default MessPlans;
