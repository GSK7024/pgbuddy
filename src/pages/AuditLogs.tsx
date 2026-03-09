import { useEffect, useState } from "react";
import { Activity, Filter, Users, CreditCard, MessageSquare, ArrowUpDown, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStaffAccess } from "@/hooks/useStaffAccess";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  property_id: string | null;
  description: string;
  created_at: string;
}

const tableIcons: Record<string, typeof Activity> = {
  tenant_assignments: Users,
  rent_payments: CreditCard,
  complaints: MessageSquare,
};

const actionColors: Record<string, string> = {
  INSERT: "bg-success/10 text-success border-success/20",
  UPDATE: "bg-primary/10 text-primary border-primary/20",
  DELETE: "bg-destructive/10 text-destructive border-destructive/20",
};

const AuditLogs = () => {
  const { user } = useAuth();
  const { effectiveOwnerId, loading: staffLoading } = useStaffAccess();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTable, setFilterTable] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [filterProperty, setFilterProperty] = useState<string>("all");

  useEffect(() => {
    if (!effectiveOwnerId || staffLoading) return;
    const fetchProperties = async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, name")
        .eq("owner_id", effectiveOwnerId);
      setProperties(data ?? []);
    };
    fetchProperties();
  }, [effectiveOwnerId, staffLoading]);

  useEffect(() => {
    if (!user) return;
    const fetchLogs = async () => {
      setLoading(true);
      let query = supabase
        .from("audit_logs")
        .select("id, user_id, action, table_name, record_id, property_id, description, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filterTable !== "all") query = query.eq("table_name", filterTable);
      if (filterAction !== "all") query = query.eq("action", filterAction);
      if (filterProperty !== "all") query = query.eq("property_id", filterProperty);

      const { data } = await query;
      setLogs((data as unknown as AuditLog[]) ?? []);
      setLoading(false);
    };
    fetchLogs();
  }, [user, filterTable, filterAction, filterProperty]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const getPropertyName = (propId: string | null) => {
    if (!propId) return "";
    return properties.find(p => p.id === propId)?.name || "";
  };

  const tableLabels: Record<string, string> = {
    tenant_assignments: "Tenants",
    rent_payments: "Payments",
    complaints: "Complaints",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" /> Activity Log
          </h1>
          <p className="text-muted-foreground">Track all changes across your properties</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={filterProperty} onValueChange={setFilterProperty}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-3 h-3 mr-1" />
              <SelectValue placeholder="Property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {properties.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterTable} onValueChange={setFilterTable}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="w-3 h-3 mr-1" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="tenant_assignments">Tenants</SelectItem>
              <SelectItem value="rent_payments">Payments</SelectItem>
              <SelectItem value="complaints">Complaints</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="INSERT">Created</SelectItem>
              <SelectItem value="UPDATE">Updated</SelectItem>
              <SelectItem value="DELETE">Deleted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Log entries */}
        {loading ? (
          <p className="text-muted-foreground">Loading activity...</p>
        ) : logs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
              <p className="text-muted-foreground">Changes to tenants, payments, and complaints will appear here automatically</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const Icon = tableIcons[log.table_name] || Activity;
              const propName = getPropertyName(log.property_id);
              return (
                <Card key={log.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="py-3 flex items-start gap-3">
                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{log.description}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${actionColors[log.action] || ""}`}>
                          {log.action === "INSERT" ? "Created" : log.action === "UPDATE" ? "Updated" : "Deleted"}
                        </Badge>
                        {propName && (
                          <span className="text-xs text-muted-foreground">{propName}</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {tableLabels[log.table_name] || log.table_name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatTime(log.created_at)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AuditLogs;
