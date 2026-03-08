import { useEffect, useState } from "react";
import { Zap, Droplets, IndianRupee, CheckCircle, Clock, Upload, QrCode, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import TenantLayout from "@/components/dashboard/TenantLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface UtilityBill {
  id: string;
  bill_type: string;
  units_consumed: number | null;
  rate_per_unit: number;
  amount: number;
  bill_month: string;
  status: string;
  proof_url: string | null;
  rooms?: { room_number: string };
  properties?: { name: string };
}

interface PaymentInfo {
  upi_id: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  account_holder: string | null;
}

const TenantUtilityBills = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bills, setBills] = useState<UtilityBill[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [showPayInfo, setShowPayInfo] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const [billRes, assignRes] = await Promise.all([
      supabase.from("utility_bills")
        .select("*, rooms(room_number), properties(name)")
        .eq("tenant_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("tenant_assignments")
        .select("property_id")
        .eq("tenant_id", user.id)
        .eq("is_active", true)
        .maybeSingle(),
    ]);
    setBills(billRes.data ?? []);

    if (assignRes.data) {
      const { data: info } = await supabase
        .from("payment_info")
        .select("upi_id, bank_name, account_number, ifsc_code, account_holder")
        .eq("property_id", assignRes.data.property_id)
        .maybeSingle();
      setPaymentInfo(info as unknown as PaymentInfo | null);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleUploadProof = async (billId: string, file: File) => {
    if (!user) return;
    setUploading(billId);

    const ext = file.name.split(".").pop();
    const path = `utility/${user.id}/${billId}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from("payment-proofs").upload(path, file, { upsert: true });
    if (uploadErr) {
      toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(path);

    await supabase.from("utility_bills").update({
      proof_url: urlData.publicUrl,
      proof_uploaded_at: new Date().toISOString(),
    }).eq("id", billId);

    toast({ title: "Payment proof uploaded! Owner will review shortly." });
    setUploading(null);
    fetchData();
  };

  const totalPending = bills.filter(b => b.status === "pending").reduce((s, b) => s + Number(b.amount), 0);
  const upiQrUrl = paymentInfo?.upi_id ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${encodeURIComponent(paymentInfo.upi_id)}&pn=${encodeURIComponent(paymentInfo.account_holder || "PG Owner")}` : null;

  return (
    <TenantLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Utility Bills</h1>
            <p className="text-muted-foreground">Electricity & water bills for your room</p>
          </div>
          {paymentInfo && (paymentInfo.upi_id || paymentInfo.bank_name) && (
            <Dialog open={showPayInfo} onOpenChange={setShowPayInfo}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <QrCode className="w-4 h-4" /> Payment Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>How to Pay</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {paymentInfo.upi_id && (
                    <div className="space-y-3">
                      <h3 className="font-semibold flex items-center gap-2"><QrCode className="w-4 h-4 text-primary" /> UPI Payment</h3>
                      {upiQrUrl && (
                        <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
                          <img src={upiQrUrl} alt="UPI QR" className="w-40 h-40 rounded-lg" />
                          <p className="text-sm font-medium">{paymentInfo.upi_id}</p>
                          <p className="text-xs text-muted-foreground">Scan with any UPI app to pay</p>
                        </div>
                      )}
                    </div>
                  )}
                  {paymentInfo.bank_name && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Bank Transfer</h3>
                        <div className="space-y-1 text-sm bg-muted/50 p-3 rounded-lg">
                          {paymentInfo.account_holder && <p><span className="text-muted-foreground">Name:</span> {paymentInfo.account_holder}</p>}
                          <p><span className="text-muted-foreground">Bank:</span> {paymentInfo.bank_name}</p>
                          {paymentInfo.account_number && <p><span className="text-muted-foreground">A/C:</span> {paymentInfo.account_number}</p>}
                          {paymentInfo.ifsc_code && <p><span className="text-muted-foreground">IFSC:</span> {paymentInfo.ifsc_code}</p>}
                        </div>
                      </div>
                    </>
                  )}
                  <p className="text-xs text-muted-foreground text-center">After paying, upload the payment proof against the relevant bill below.</p>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Pending summary */}
        {totalPending > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pending Utility Bills</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <IndianRupee className="w-5 h-5" />{totalPending.toLocaleString()}
                </p>
              </div>
              <Zap className="w-8 h-8 text-warning" />
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : bills.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Zap className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No utility bills</h3>
              <p className="text-muted-foreground">Your owner hasn't generated any bills yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bills.map(b => (
              <Card key={b.id}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {b.bill_type === "water" ? <Droplets className="w-5 h-5 text-primary" /> : <Zap className="w-5 h-5 text-warning" />}
                      <div>
                        <p className="font-medium capitalize">{b.bill_type} · {b.bill_month}</p>
                        <p className="text-sm text-muted-foreground">
                          {(b as any).properties?.name} · Room {(b as any).rooms?.room_number}
                          {b.units_consumed != null && ` · ${b.units_consumed} units @ ₹${b.rate_per_unit}/unit`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold flex items-center gap-0.5 justify-end">
                        <IndianRupee className="w-3 h-3" />{Number(b.amount).toLocaleString()}
                      </p>
                      <Badge className={b.status === "paid" ? "bg-success" : "bg-warning"}>{b.status}</Badge>
                    </div>
                  </div>

                  {/* Payment proof section */}
                  {b.status === "pending" && (
                    <div className="flex items-center gap-3 pt-2 border-t border-border">
                      {b.proof_url ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-warning" />
                          <span className="text-muted-foreground">Proof uploaded — awaiting owner approval</span>
                          <a href={b.proof_url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline">View</a>
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadProof(b.id, file);
                            }}
                            disabled={uploading === b.id}
                          />
                          <Button variant="outline" size="sm" className="gap-2" disabled={uploading === b.id} asChild>
                            <span>
                              <Upload className="w-3 h-3" />
                              {uploading === b.id ? "Uploading..." : "Upload Payment Proof"}
                            </span>
                          </Button>
                        </label>
                      )}
                    </div>
                  )}

                  {b.status === "paid" && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                      <CheckCircle className="w-3 h-3 text-success" />
                      <span>Payment verified by owner</span>
                      {b.proof_url && (
                        <a href={b.proof_url} target="_blank" rel="noopener noreferrer" className="text-primary underline ml-1">View proof</a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TenantLayout>
  );
};

export default TenantUtilityBills;
