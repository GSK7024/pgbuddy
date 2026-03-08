import { useEffect, useState } from "react";
import { Zap, Plus, Droplets } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Bill {
  id: string;
  bill_type: string;
  previous_reading: number | null;
  current_reading: number | null;
  units_consumed: number | null;
  rate_per_unit: number;
  amount: number;
  bill_month: string;
  status: string;
  rooms?: { room_number: string };
  properties?: { name: string };
}

interface TenantInfo {
  tenant_id: string;
  room_id: string;
  property_id: string;
  rooms: { room_number: string } | null;
  properties: { name: string } | null;
}

const UtilityBills = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bills, setBills] = useState<Bill[]>([]);
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [billType, setBillType] = useState("electricity");
  const [selectedTenant, setSelectedTenant] = useState("");
  const [prevReading, setPrevReading] = useState("");
  const [currReading, setCurrReading] = useState("");
  const [rate, setRate] = useState("8");
  const [billMonth, setBillMonth] = useState(new Date().toISOString().slice(0, 7));

  const fetchData = async () => {
    if (!user) return;
    const [billRes, tenantRes] = await Promise.all([
      supabase.from("utility_bills").select("*, rooms(room_number), properties(name)").order("created_at", { ascending: false }),
      supabase.from("tenant_assignments")
        .select("tenant_id, room_id, property_id, rooms(room_number), properties(name)")
        .eq("is_active", true),
    ]);
    setBills(billRes.data ?? []);
    setTenants((tenantRes.data ?? []) as unknown as TenantInfo[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const units = prevReading && currReading ? Math.max(0, Number(currReading) - Number(prevReading)) : 0;
  const amount = units * Number(rate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tenant = tenants.find(t => `${t.tenant_id}-${t.room_id}` === selectedTenant);
    if (!tenant) return;

    const { error } = await supabase.from("utility_bills").insert({
      property_id: tenant.property_id,
      room_id: tenant.room_id,
      tenant_id: tenant.tenant_id,
      bill_type: billType,
      previous_reading: Number(prevReading) || null,
      current_reading: Number(currReading) || null,
      units_consumed: units,
      rate_per_unit: Number(rate),
      amount,
      bill_month: billMonth,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bill generated!" });
      setDialogOpen(false);
      setPrevReading(""); setCurrReading("");
      fetchData();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Utility Bills</h1>
            <p className="text-muted-foreground">Track meter readings & generate bills</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2">
                <Plus className="w-4 h-4" /> Generate Bill
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Utility Bill</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Bill Type</Label>
                  <Select value={billType} onValueChange={setBillType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electricity">⚡ Electricity</SelectItem>
                      <SelectItem value="water">💧 Water</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tenant / Room *</Label>
                  <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                    <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                    <SelectContent>
                      {tenants.map(t => (
                        <SelectItem key={`${t.tenant_id}-${t.room_id}`} value={`${t.tenant_id}-${t.room_id}`}>
                          {(t as any).properties?.name} · Room {(t as any).rooms?.room_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bill Month</Label>
                  <Input type="month" value={billMonth} onChange={e => setBillMonth(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Previous Reading</Label>
                    <Input type="number" value={prevReading} onChange={e => setPrevReading(e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Reading</Label>
                    <Input type="number" value={currReading} onChange={e => setCurrReading(e.target.value)} placeholder="0" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Rate per Unit (₹)</Label>
                  <Input type="number" value={rate} onChange={e => setRate(e.target.value)} />
                </div>
                {units > 0 && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                    <p>Units consumed: <strong>{units}</strong></p>
                    <p>Amount: <strong>₹{amount.toLocaleString()}</strong></p>
                  </div>
                )}
                <Button type="submit" className="w-full gradient-primary">Generate Bill</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : bills.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Zap className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No utility bills</h3>
              <p className="text-muted-foreground">Generate bills by entering meter readings</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bills.map(b => (
              <Card key={b.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    {b.bill_type === "water" ? <Droplets className="w-5 h-5 text-blue-500" /> : <Zap className="w-5 h-5 text-warning" />}
                    <div>
                      <p className="font-medium capitalize">{b.bill_type} · {b.bill_month}</p>
                      <p className="text-sm text-muted-foreground">
                        {(b as any).properties?.name} · Room {(b as any).rooms?.room_number}
                        {b.units_consumed != null && ` · ${b.units_consumed} units`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold">₹{Number(b.amount).toLocaleString()}</p>
                    <Badge className={b.status === "paid" ? "bg-success" : "bg-warning"}>{b.status}</Badge>
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

export default UtilityBills;
