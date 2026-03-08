import { useEffect, useState } from "react";
import { CreditCard, IndianRupee, CheckCircle, Clock, AlertTriangle, Upload, QrCode, Building2, Phone, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import TenantLayout from "@/components/dashboard/TenantLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import RentReceipt from "@/components/RentReceipt";

interface Payment {
  id: string;
  amount: number;
  month: string;
  status: string;
  payment_date: string | null;
  proof_url: string | null;
  proof_uploaded_at: string | null;
  rooms: { room_number: string } | null;
  properties: { name: string } | null;
}

interface PaymentInfo {
  upi_id: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  account_holder: string | null;
}

const TenantPayments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [payRes, assignRes] = await Promise.all([
        supabase
          .from("rent_payments")
          .select("*, rooms(room_number), properties(name)")
          .eq("tenant_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("tenant_assignments")
          .select("property_id")
          .eq("tenant_id", user.id)
          .eq("is_active", true)
          .maybeSingle(),
      ]);
      setPayments((payRes.data as unknown as Payment[]) ?? []);

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
    fetchData();
  }, [user]);

  const handleUploadProof = async (paymentId: string, file: File) => {
    if (!user) return;
    setUploading(paymentId);

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${paymentId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(filePath);

    await supabase.from("rent_payments").update({
      proof_url: urlData.publicUrl,
      proof_uploaded_at: new Date().toISOString(),
    }).eq("id", paymentId);

    toast({ title: "Payment proof uploaded!" });
    setUploading(null);

    // Refresh
    const { data } = await supabase
      .from("rent_payments")
      .select("*, rooms(room_number), properties(name)")
      .eq("tenant_id", user.id)
      .order("created_at", { ascending: false });
    setPayments((data as unknown as Payment[]) ?? []);
  };

  const statusIcon = (s: string) => {
    if (s === "paid") return <CheckCircle className="w-4 h-4 text-success" />;
    if (s === "overdue") return <AlertTriangle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-warning" />;
  };

  const totalPending = payments.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
  const upiQrUrl = paymentInfo?.upi_id ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${encodeURIComponent(paymentInfo.upi_id)}&pn=${encodeURIComponent(paymentInfo.account_holder || "PG Owner")}` : null;

  return (
    <TenantLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Payments</h1>
            <p className="text-muted-foreground">View rent payments and pay your dues</p>
          </div>
          {paymentInfo && (paymentInfo.upi_id || paymentInfo.bank_name) && (
            <Dialog open={showPaymentInfo} onOpenChange={setShowPaymentInfo}>
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
                  <p className="text-xs text-muted-foreground text-center">After paying, upload the payment proof against the relevant month below.</p>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {totalPending > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pending Dues</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <IndianRupee className="w-5 h-5" />{totalPending.toLocaleString()}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-warning" />
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : payments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payment records</h3>
              <p className="text-muted-foreground">Your payment history will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {payments.map(p => (
              <Card key={p.id}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {statusIcon(p.status)}
                      <div>
                        <p className="font-medium">{p.properties?.name} · Room {p.rooms?.room_number}</p>
                        <p className="text-sm text-muted-foreground">{p.month}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold flex items-center gap-1 justify-end">
                        <IndianRupee className="w-3 h-3" />{Number(p.amount).toLocaleString()}
                      </p>
                      <Badge variant={p.status === "paid" ? "default" : p.status === "overdue" ? "destructive" : "secondary"} className={p.status === "paid" ? "bg-success" : ""}>
                        {p.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Upload proof for pending payments */}
                  {p.status === "pending" && (
                    <div className="flex items-center gap-3 pt-2 border-t border-border">
                      {p.proof_url ? (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span className="text-muted-foreground">Proof uploaded</span>
                          <a href={p.proof_url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline">View</a>
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadProof(p.id, file);
                            }}
                            disabled={uploading === p.id}
                          />
                          <Button variant="outline" size="sm" className="gap-2" disabled={uploading === p.id} asChild>
                            <span>
                              <Upload className="w-3 h-3" />
                              {uploading === p.id ? "Uploading..." : "Upload Payment Proof"}
                            </span>
                          </Button>
                        </label>
                      )}
                    </div>
                  )}
                  {p.status === "paid" && p.proof_url && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                      <CheckCircle className="w-3 h-3 text-success" />
                      <span>Proof attached</span>
                      <a href={p.proof_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">View</a>
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

export default TenantPayments;
