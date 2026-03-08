import { useEffect, useState } from "react";
import { Megaphone, AlertTriangle, Info, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TenantLayout from "@/components/dashboard/TenantLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  created_at: string;
  properties?: { name: string };
}

const TenantAnnouncements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("announcements")
        .select("*, properties(name)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setAnnouncements(data ?? []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const priorityIcon = (p: string) => {
    if (p === "urgent") return <AlertTriangle className="w-4 h-4 text-destructive" />;
    if (p === "important") return <Bell className="w-4 h-4 text-warning" />;
    return <Info className="w-4 h-4 text-primary" />;
  };

  const priorityBadge = (p: string) => {
    if (p === "urgent") return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
    if (p === "important") return <Badge className="bg-warning text-xs">Important</Badge>;
    return null;
  };

  return (
    <TenantLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">Updates and rules from your PG owner</p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : announcements.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Megaphone className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No announcements</h3>
              <p className="text-muted-foreground">Your PG owner hasn't posted any updates yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {announcements.map(a => (
              <Card key={a.id} className={a.priority === "urgent" ? "border-destructive/30" : a.priority === "important" ? "border-warning/30" : ""}>
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {priorityIcon(a.priority)}
                      <div>
                        <h3 className="font-semibold">{a.title}</h3>
                        <p className="text-xs text-muted-foreground">{(a as any).properties?.name} · {new Date(a.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {priorityBadge(a.priority)}
                  </div>
                  <p className="text-sm pl-7">{a.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TenantLayout>
  );
};

export default TenantAnnouncements;
