import { useEffect, useState } from "react";
import { CreditCard, IndianRupee, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TenantLayout from "@/components/dashboard/TenantLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Payment {
  id: string;
  amount: number;
  month: string;
  status: string;
  payment_date: string | null;
  rooms: { room_number: string } | null;
  properties: { name: string } | null;
}

const TenantPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("rent_payments")
        .select("*, rooms(room_number), properties(name)")
        .eq("tenant_id", user.id)
        .order("created_at", { ascending: false });
      setPayments(data ?? []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const statusIcon = (s: string) => {
    if (s === "paid") return <CheckCircle className="w-4 h-4 text-success" />;
    if (s === "overdue") return <AlertTriangle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-warning" />;
  };

  const totalPending = payments.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <TenantLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Payments</h1>
          <p className="text-muted-foreground">View your rent payment history</p>
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
                <CardContent className="flex items-center justify-between py-4">
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
