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
  property_id: string;
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
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");
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
    if (!user) return;
    const fetchProperties = async () => {
      const { data } = await supabase.from("properties").select("id, name").eq("owner_id", user.id);
      const props = data ?? [];
      setProperties(props);
      if (props.length > 0) setSelectedProperty(props[0].id);
      setLoading(false);
    };
    fetchProperties();
  }, [user]);

  useEffect(() => {
    if (!selectedProperty) return;
    const fetchInfo = async () => {
      const { data } = await supabase
        .from("payment_info")
        .select("*")
        .eq("property_id", selectedProperty)
        .maybeSingle();
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
  }, [selectedProperty]);

  const handleSave = async () => {
    if (!selectedProperty) return;
    setSaving(true);

    const payload = {
      property_id: selectedProperty,
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
      const { data } = await supabase.from("payment_info").select("*").eq("property_id", selectedProperty).maybeSingle();
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
        ) : properties.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No properties yet</h3>
              <p className="text-muted-foreground">Add a property first to set up payment details</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Property selector */}
            <div className="max-w-xs">
              <Label>Select Property</Label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
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
                    <Input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi or 9876543210@paytm" />
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
                    <Input value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="State Bank of India" />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="1234567890" />
                  </div>
                  <div className="space-y-2">
                    <Label>IFSC Code</Label>
                    <Input value={ifscCode} onChange={e => setIfscCode(e.target.value)} placeholder="SBIN0001234" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button onClick={handleSave} disabled={saving} className="gradient-primary">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Payment Details"}
            </Button>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PaymentSettings;
