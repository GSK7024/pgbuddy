import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Receipt, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStaffAccess } from "@/hooks/useStaffAccess";
import { format } from "date-fns";

interface MessExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  expense_date: string;
  notes: string | null;
}

const CATEGORIES = [
  { value: "groceries", label: "Groceries", color: "bg-blue-100 text-blue-700" },
  { value: "vegetables", label: "Vegetables & Fruits", color: "bg-green-100 text-green-700" },
  { value: "dairy", label: "Dairy & Eggs", color: "bg-yellow-100 text-yellow-700" },
  { value: "gas", label: "Gas / Fuel", color: "bg-orange-100 text-orange-700" },
  { value: "staff", label: "Staff Salary", color: "bg-purple-100 text-purple-700" },
  { value: "other", label: "Other", color: "bg-gray-100 text-gray-700" },
];

const MessExpenses = () => {
  const { toast } = useToast();
  const { effectiveOwnerId, loading: staffLoading } = useStaffAccess();
  const [expenses, setExpenses] = useState<MessExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("groceries");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!effectiveOwnerId || staffLoading) return;
    fetchExpenses();
  }, [effectiveOwnerId, staffLoading]);

  const fetchExpenses = async () => {
    const { data } = await supabase
      .from("mess_expenses" as any)
      .select("*")
      .eq("owner_id", effectiveOwnerId!)
      .order("expense_date", { ascending: false });

    setExpenses((data as any) || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!title || !amount) {
      toast({ title: "Error", description: "Title and amount are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("mess_expenses" as any).insert({
      owner_id: effectiveOwnerId!,
      title,
      amount: parseFloat(amount),
      category,
      expense_date: date,
      notes,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Expense added!" });
      setDialogOpen(false);
      setTitle("");
      setAmount("");
      setNotes("");
      fetchExpenses();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    await supabase.from("mess_expenses" as any).delete().eq("id", id);
    toast({ title: "Expense deleted" });
    fetchExpenses();
  };

  const filtered = expenses.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalThisMonth = filtered.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Mess Expenses
          </h2>
          <p className="text-sm text-muted-foreground">Track grocery, staff and utility costs</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary gap-2"><Plus className="w-4 h-4" /> Add Expense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Mess Expense</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Title / Item</Label>
                <Input placeholder="e.g. 50kg Rice, Milk Bill" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount (₹)</Label>
                  <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea placeholder="Any extra details..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary">
                {saving ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="pt-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search expenses..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                No expenses found
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(exp => (
                  <div key={exp.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{exp.title}</span>
                        <Badge className={`text-[10px] ${CATEGORIES.find(c => c.value === exp.category)?.color || ""}`}>
                          {CATEGORIES.find(c => c.value === exp.category)?.label || exp.category}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(exp.expense_date), "dd MMM yyyy")}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="font-bold">₹{exp.amount}</div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(exp.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent className="pt-6">
            <h3 className="text-lg font-bold mb-4">Summary</h3>
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="text-sm text-muted-foreground">Total Filtered</div>
                <div className="text-2xl font-bold flex items-center gap-1">
                  <IndianRupee className="w-5 h-5" />
                  {totalThisMonth.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Pro tip: Categorize your expenses correctly to see detailed breakdowns in the Analytics tab (coming soon).
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MessExpenses;
