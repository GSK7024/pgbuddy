import { useEffect, useState } from "react";
import { IndianRupee, QrCode, Building2, Save, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useStaffAccess } from "@/hooks/useStaffAccess";

interface PaymentInfoData {
  id?: string;
  property_id: string | null;
  owner_id: string | null;
  upi_id: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  account_holder: string;
}

interface Property {
  id: string;
  name: string;
}

const PaymentSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { effectiveOwnerId, isStaff, loading: staffLoading } = useStaffAccess();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("default");
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form
  const [upiId, setUpiId] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  useEffect(() => {
    if (!effectiveOwnerId || staffLoading) return;
    const fetchProperties = async () => {
      const { data } = await supabase.from("properties").select("id, name").eq("owner_id", effectiveOwnerId);
      const props = data ?? [];
      setProperties(props);
      // Even if no properties, default can be selected
      setSelectedProperty("default");
      setLoading(false);
    };
    fetchProperties();
  }, [effectiveOwnerId, staffLoading]);

  useEffect(() => {
    if (!selectedProperty || !effectiveOwnerId) return;
    const fetchInfo = async () => {
      let query = (supabase as any).from("payment_info").select("*");
      if (selectedProperty === "default") {
        query = query.is("property_id", null).eq("owner_id", effectiveOwnerId);
      } else {
        query = query.eq("property_id", selectedProperty);
      }
      
      const { data } = await query.maybeSingle();
      if (data) {
        setPaymentInfo(data as unknown as PaymentInfoData);
        setUpiId(data.upi_id ?? "");
        setBankName(data.bank_name ?? "");
        setAccountNumber(data.account_number ?? "");
        setIfscCode(data.ifsc_code ?? "");
        setAccountHolder(data.account_holder ?? "");
      } else {
        setPaymentInfo(null);
        setUpiId(""); setBankName(""); setAccountNumber(""); setIfscCode(""); setAccountHolder("");
      }
    };
    fetchInfo();
  }, [selectedProperty, effectiveOwnerId]);

  const handleSave = async () => {
    if (!selectedProperty || !effectiveOwnerId) return;
    setSaving(true);

    const payload = {
      property_id: selectedProperty === "default" ? null : selectedProperty,
      owner_id: effectiveOwnerId,
      upi_id: upiId || null,
      bank_name: bankName || null,
      account_number: accountNumber || null,
      ifsc_code: ifscCode || null,
      account_holder: accountHolder || null,
    };

    let error;
    if (paymentInfo?.id) {
      ({ error } = await supabase.from("payment_info").update(payload).eq("id", paymentInfo.id));
    } else {
      ({ error } = await supabase.from("payment_info").insert(payload));
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Payment info saved!" });
      // Refresh
      let query = (supabase as any).from("payment_info").select("*");
      if (selectedProperty === "default") {
        query = query.is("property_id", null).eq("owner_id", effectiveOwnerId);
      } else {
        query = query.eq("property_id", selectedProperty);
      }
      const { data } = await query.maybeSingle();
      setPaymentInfo(data as unknown as PaymentInfoData);
    }
    setSaving(false);
  };

  const upiQrUrl = upiId ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(accountHolder || "PG Owner")}` : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Payment Settings</h1>
          <p className="text-muted-foreground">Set up payment details so tenants can pay you directly</p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <>
            {/* Property selector */}
            <div className="max-w-xs">
              <Label>Select Property scope</Label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default" className="font-semibold text-primary">Default (All Properties)</SelectItem>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* UPI Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-primary" />
                    UPI Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>UPI ID</Label>
                    <Input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi or 9876543210@paytm" disabled={isStaff} />
                  </div>
                  {upiQrUrl && (
                    <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium">QR Code Preview</p>
                      <img src={upiQrUrl} alt="UPI QR Code" className="w-48 h-48 rounded-lg border border-border" />
                      <Badge variant="outline" className="text-xs">{upiId}</Badge>
                      <p className="text-xs text-muted-foreground">Tenants can scan this to pay directly</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bank Details Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-primary" />
                    Bank Account Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Account Holder Name</Label>
                    <Input value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="John Doe" disabled={isStaff} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="State Bank of India" disabled={isStaff} />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="1234567890" disabled={isStaff} />
                  </div>
                  <div className="space-y-2">
                    <Label>IFSC Code</Label>
                    <Input value={ifscCode} onChange={e => setIfscCode(e.target.value)} placeholder="SBIN0001234" disabled={isStaff} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {!isStaff && (
              <Button onClick={handleSave} disabled={saving} className="gradient-primary">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Payment Details"}
              </Button>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PaymentSettings;
