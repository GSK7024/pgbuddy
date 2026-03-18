import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Utensils, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStaffAccess } from "@/hooks/useStaffAccess";
import { format } from "date-fns";

interface GuestMeal {
  id: string;
  guest_name: string;
  guest_phone: string | null;
  meal_type: string;
  amount: number;
  payment_method: string;
  meal_date: string;
}

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast", emoji: "🌅" },
  { value: "lunch", label: "Lunch", emoji: "☀️" },
  { value: "snacks", label: "Snacks", emoji: "☕" },
  { value: "dinner", label: "Dinner", emoji: "🌙" },
];

const MessGuests = () => {
  const { toast } = useToast();
  const { effectiveOwnerId, loading: staffLoading } = useStaffAccess();
  const [guestMeals, setGuestMeals] = useState<GuestMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [mealType, setMealType] = useState("lunch");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [mealDate, setMealDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    if (!effectiveOwnerId || staffLoading) return;
    fetchGuestMeals();
  }, [effectiveOwnerId, staffLoading]);

  const fetchGuestMeals = async () => {
    const { data, error } = await supabase
      .from("mess_one_time_meals" as any)
      .select("*")
      .eq("owner_id", effectiveOwnerId!)
      .order("meal_date", { ascending: false });

    if (!error) {
      setGuestMeals((data as any) || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!guestName || !amount) {
      toast({ title: "Error", description: "Name and Amount are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("mess_one_time_meals" as any).insert({
      owner_id: effectiveOwnerId!,
      guest_name: guestName,
      guest_phone: guestPhone || null,
      meal_type: mealType,
      amount: parseFloat(amount),
      payment_method: paymentMethod,
      meal_date: mealDate,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Guest meal recorded!" });
      setDialogOpen(false);
      resetForm();
      fetchGuestMeals();
    }
    setSaving(false);
  };

  const resetForm = () => {
    setGuestName("");
    setGuestPhone("");
    setMealType("lunch");
    setAmount("");
    setPaymentMethod("cash");
    setMealDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    await supabase.from("mess_one_time_meals" as any).delete().eq("id", id);
    toast({ title: "Record deleted" });
    fetchGuestMeals();
  };

  const filtered = guestMeals.filter(g => 
    g.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (g.guest_phone && g.guest_phone.includes(searchQuery))
  );

  const totalRevenue = filtered.reduce((sum, g) => sum + g.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary" />
            Guest & One-time Meals
          </h2>
          <p className="text-sm text-muted-foreground">Record payments for non-members</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if(!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary gap-2"><Plus className="w-4 h-4" /> Record Guest Meal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record One-time Meal</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Guest Name</Label>
                  <Input placeholder="Guest name" value={guestName} onChange={e => setGuestName(e.target.value)} />
                </div>
                <div>
                  <Label>Guest Phone (Optional)</Label>
                  <Input placeholder="9876543210" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Meal Type</Label>
                  <Select value={mealType} onValueChange={setMealType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MEAL_TYPES.map(m => <SelectItem key={m.value} value={m.value}>{m.emoji} {m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount (₹)</Label>
                  <Input type="number" placeholder="e.g. 100" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI / Online</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={mealDate} onChange={e => setMealDate(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary">
                {saving ? "Saving..." : "Record Payment"}
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
              <Input placeholder="Search guest name..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                No guest records found.
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(guest => (
                  <div key={guest.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{guest.guest_name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {MEAL_TYPES.find(m => m.value === guest.meal_type)?.emoji} {guest.meal_type}
                        </Badge>
                        <Badge className="text-[10px] bg-green-50 text-green-700 border-green-200">
                          {guest.payment_method}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(guest.meal_date), "dd MMM yyyy")} {guest.guest_phone && `• ${guest.guest_phone}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="font-bold">₹{guest.amount}</div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(guest.id)}>
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
            <h3 className="text-lg font-bold mb-4">Daily/Monthly Guest Revenue</h3>
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="text-sm text-muted-foreground">Total Revenue (Filtered)</div>
                <div className="text-2xl font-bold flex items-center gap-1">
                  <IndianRupee className="w-5 h-5" />
                  {totalRevenue.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                These entries are used to calculate total Mess earnings in the Analytics tab.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MessGuests;
