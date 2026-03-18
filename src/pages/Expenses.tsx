import { useEffect, useState } from "react";
import { Receipt, IndianRupee, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useStaffAccess } from "@/hooks/useStaffAccess";

interface Expense {
  id: string;
  property_id: string;
  amount: number;
  category: string;
  description: string | null;
  expense_date: string;
  created_at: string;
  properties?: { name: string };
}

interface Property {
  id: string;
  name: string;
}

const CATEGORIES = ["electricity", "water", "maintenance", "staff", "cleaning", "internet", "gas", "repairs", "other"];

const Expenses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { effectiveOwnerId, isStaff, accessiblePropertyIds, loading: staffLoading } = useStaffAccess();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    property_id: "",
    amount: "",
    category: "maintenance",
    description: "",
    expense_date: new Date().toISOString().split("T")[0],
  });

  const fetchData = async () => {
    if (!effectiveOwnerId) return;
    const [expRes, propRes] = await Promise.all([
      supabase
        .from("expenses")
        .select("*, properties(name)")
        .order("expense_date", { ascending: false }),
      supabase
        .from("properties")
        .select("id, name")
        .eq("owner_id", effectiveOwnerId),
    ]);
    let fetchedExpenses = expRes.data ?? [];
    let fetchedProperties = propRes.data ?? [];

    if (isStaff && accessiblePropertyIds.length > 0) {
      fetchedExpenses = fetchedExpenses.filter(e => accessiblePropertyIds.includes(e.property_id));
      fetchedProperties = fetchedProperties.filter(p => accessiblePropertyIds.includes(p.id));
    }

    setExpenses(fetchedExpenses);
    setProperties(fetchedProperties);
    setLoading(false);
  };

  useEffect(() => {
    if (!staffLoading) fetchData();
  }, [effectiveOwnerId, staffLoading]);

  const handleAdd = async () => {
    if (!form.property_id || !form.amount || submitting) {
      if (!form.property_id || !form.amount) toast({ title: "Fill required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("expenses").insert({
      property_id: form.property_id,
      amount: Number(form.amount),
      category: form.category,
      description: form.description || null,
      expense_date: form.expense_date,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    toast({ title: "Expense added!" });
    setDialogOpen(false);
    setForm({ property_id: "", amount: "", category: "maintenance", description: "", expense_date: new Date().toISOString().split("T")[0] });
    setSubmitting(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("expenses").delete().eq("id", id);
    toast({ title: "Expense deleted" });
    fetchData();
  };

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {} as Record<string, number>);

  const categoryColors: Record<string, string> = {
    electricity: "bg-yellow-500",
    water: "bg-blue-500",
    maintenance: "bg-orange-500",
    staff: "bg-purple-500",
    cleaning: "bg-green-500",
    internet: "bg-cyan-500",
    gas: "bg-red-500",
    repairs: "bg-pink-500",
    other: "bg-gray-500",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Expenses</h1>
            <p className="text-muted-foreground">Track and manage PG expenses</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2">
                <Plus className="w-4 h-4" /> Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Property *</Label>
                  <Select value={form.property_id} onValueChange={(v) => setForm({ ...form, property_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                    <SelectContent>
                      {properties.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount (₹) *</Label>
                    <Input type="number" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Optional notes..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <Button onClick={handleAdd} className="w-full gradient-primary" disabled={submitting}>{submitting ? "Adding..." : "Add Expense"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold flex items-center gap-1">
                <IndianRupee className="w-5 h-5" />{totalExpenses.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          {Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([cat, total]) => (
              <Card key={cat}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground capitalize">{cat}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold flex items-center gap-1">
                    <IndianRupee className="w-5 h-5" />{total.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Expense List */}
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : expenses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No expenses recorded</h3>
              <p className="text-muted-foreground">Start tracking your PG expenses</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {expenses.map((e) => (
              <Card key={e.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${categoryColors[e.category] || "bg-gray-500"}`} />
                    <div>
                      <p className="font-medium capitalize">{e.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {(e as any).properties?.name} · {e.expense_date}
                      </p>
                      {e.description && <p className="text-xs text-muted-foreground mt-1">{e.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold flex items-center gap-1">
                      <IndianRupee className="w-3 h-3" />{Number(e.amount).toLocaleString()}
                    </p>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(e.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Expenses;
