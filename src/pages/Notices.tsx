import { useEffect, useState } from "react";
import { BellDot, Calendar, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Notice {
  id: string;
  tenant_id: string;
  notice_date: string;
  expected_move_out: string;
  status: string;
  reason: string | null;
  rooms?: { room_number: string };
  properties?: { name: string };
}

const Notices = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotices = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("vacancy_notices")
      .select("*, rooms(room_number), properties(name)")
      .order("created_at", { ascending: false });
    setNotices(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchNotices(); }, [user]);

  const acknowledgeNotice = async (id: string) => {
    await supabase.from("vacancy_notices").update({ status: "acknowledged" }).eq("id", id);
    toast({ title: "Notice acknowledged" });
    fetchNotices();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Vacancy Notices</h1>
          <p className="text-muted-foreground">Tenant move-out notices</p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : notices.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BellDot className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No vacancy notices</h3>
              <p className="text-muted-foreground">No pending move-out notices</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notices.map(n => (
              <Card key={n.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{(n as any).properties?.name} · Room {(n as any).rooms?.room_number}</p>
                      <p className="text-sm text-muted-foreground">
                        Notice: {n.notice_date} → Move-out: {n.expected_move_out}
                      </p>
                      {n.reason && <p className="text-sm mt-1">{n.reason}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={n.status === "acknowledged" ? "default" : "secondary"}
                      className={n.status === "acknowledged" ? "bg-success" : ""}>
                      {n.status}
                    </Badge>
                    {n.status === "submitted" && (
                      <Button size="sm" variant="outline" onClick={() => acknowledgeNotice(n.id)}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Acknowledge
                      </Button>
                    )}
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

export default Notices;
