import { useEffect, useState } from "react";
import { Home, CreditCard, IndianRupee, MessageSquare, BellDot, Calendar, TrendingUp, Clock, CheckCircle, AlertTriangle, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import TenantLayout from "@/components/dashboard/TenantLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

interface Assignment {
  id: string;
  move_in_date: string;
  rooms: { room_number: string; room_type: string; rent_amount: number; amenities: string[] } | null;
  properties: { name: string; address: string; city: string; contact_phone: string | null; amenities: string[] | null } | null;
}

interface RecentPayment {
  id: string;
  amount: number;
  month: string;
  status: string;
  payment_date: string | null;
  payment_type?: string;
}

interface RecentComplaint {
  id: string;
  title: string;
  status: string;
  category: string;
  created_at: string;
}

const TenantDashboard = () => {
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [pendingDues, setPendingDues] = useState(0);
  const [openComplaints, setOpenComplaints] = useState(0);
  const [activeNotice, setActiveNotice] = useState(false);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<RecentComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysStayed, setDaysStayed] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [assignRes, payRes, complaintRes, noticeRes, recentPayRes, recentCompRes] = await Promise.all([
        supabase
          .from("tenant_assignments")
          .select("id, move_in_date, rooms(room_number, room_type, rent_amount, amenities), properties(name, address, city, contact_phone, amenities)")
          .eq("tenant_id", user.id)
          .eq("is_active", true)
          .maybeSingle(),
        supabase.from("rent_payments").select("amount").eq("tenant_id", user.id).eq("status", "pending"),
        supabase.from("complaints").select("id", { count: "exact", head: true }).eq("tenant_id", user.id).eq("status", "open"),
        supabase.from("vacancy_notices").select("id", { count: "exact", head: true }).eq("tenant_id", user.id).eq("status", "submitted"),
        supabase.from("rent_payments").select("id, amount, month, status, payment_date, payment_type").eq("tenant_id", user.id).order("created_at", { ascending: false }).limit(3),
        supabase.from("complaints").select("id, title, status, category, created_at").eq("tenant_id", user.id).order("created_at", { ascending: false }).limit(3),
      ]);

      const assign = assignRes.data as Assignment | null;
      setAssignment(assign);
      setPendingDues(payRes.data?.reduce((s, p) => s + Number(p.amount), 0) ?? 0);
      setOpenComplaints(complaintRes.count ?? 0);
      setActiveNotice((noticeRes.count ?? 0) > 0);
      setRecentPayments((recentPayRes.data as any[]) ?? []);
      setRecentComplaints(recentCompRes.data ?? []);
      
      if (assign) {
        const moveIn = new Date(assign.move_in_date);
        const today = new Date();
        setDaysStayed(Math.floor((today.getTime() - moveIn.getTime()) / (1000 * 60 * 60 * 24)));
      }
      
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <TenantLayout>
        <p className="text-muted-foreground">Loading...</p>
      </TenantLayout>
    );
  }

  const statusIcon = (s: string) => {
    if (s === "paid") return <CheckCircle className="w-4 h-4 text-success" />;
    if (s === "overdue") return <AlertTriangle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-warning" />;
  };

  return (
    <TenantLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your PG overview.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card className={pendingDues > 0 ? "border-warning/50" : ""}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Pending Dues</CardTitle>
                <CreditCard className="w-4 h-4 text-warning" />
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold flex items-center gap-0.5">
                  <IndianRupee className="w-4 h-4" />{pendingDues.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Open Complaints</CardTitle>
                <MessageSquare className="w-4 h-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{openComplaints}</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Vacancy Notice</CardTitle>
                <BellDot className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <Badge variant={activeNotice ? "destructive" : "secondary"} className="text-xs">
                  {activeNotice ? "Active" : "None"}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Days Stayed</CardTitle>
                <Calendar className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{daysStayed > 0 ? daysStayed : "—"}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Current Room Details */}
        {assignment ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Home className="w-5 h-5 text-primary" />
                My Room
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Property</p>
                  <p className="font-semibold">{assignment.properties?.name}</p>
                  <p className="text-xs text-muted-foreground">{assignment.properties?.address}, {assignment.properties?.city}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Room</p>
                  <p className="font-semibold">Room {assignment.rooms?.room_number}</p>
                  <p className="text-xs text-muted-foreground capitalize">{assignment.rooms?.room_type} room</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Monthly Rent</p>
                  <p className="text-lg font-bold flex items-center gap-0.5">
                    <IndianRupee className="w-4 h-4" />
                    {Number(assignment.rooms?.rent_amount ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Move-in Date</p>
                  <p className="font-semibold">{new Date(assignment.move_in_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
              </div>
              {/* PG Amenities */}
              {assignment.properties?.amenities && assignment.properties.amenities.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">PG Amenities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {assignment.properties.amenities.map(a => (
                        <Badge key={a} variant="outline" className="text-xs font-normal">{a}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {assignment.properties?.contact_phone && (
                <p className="text-sm text-muted-foreground">
                  Owner Contact: <a href={`tel:${assignment.properties.contact_phone}`} className="font-medium text-primary">{assignment.properties.contact_phone}</a>
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Home className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No room assigned</h3>
              <p className="text-muted-foreground mb-4">Your PG owner will assign you a room. Contact them if you haven't been assigned yet.</p>
              <Button variant="outline" asChild>
                <Link to="/tenant/marketplace">
                  <Search className="w-4 h-4 mr-2" />Browse Available PGs
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Payments */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Payments</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs" asChild>
                  <Link to="/tenant/payments">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No payments yet</p>
              ) : (
                <div className="space-y-3">
                  {recentPayments.map(p => (
                    <div key={p.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {statusIcon(p.status)}
                        <div>
                          <p className="text-sm font-medium">
                            {p.month}
                            {p.payment_type === "deposit" && (
                              <span className="text-[10px] ml-2 text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">Deposit</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">{p.status}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-sm flex items-center gap-0.5">
                        <IndianRupee className="w-3 h-3" />{Number(p.amount).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Complaints */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Complaints</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs" asChild>
                  <Link to="/tenant/complaints">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentComplaints.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No complaints filed</p>
              ) : (
                <div className="space-y-3">
                  {recentComplaints.map(c => (
                    <div key={c.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{c.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{c.category} · {new Date(c.created_at).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={c.status === "resolved" ? "default" : "secondary"} className={`text-xs ${c.status === "resolved" ? "bg-success" : c.status === "open" ? "bg-destructive" : "bg-warning"}`}>
                        {c.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
            <Link to="/tenant/payments">
              <CreditCard className="w-5 h-5 text-primary" />
              <span className="text-xs">View Payments</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
            <Link to="/tenant/complaints">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span className="text-xs">File Complaint</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
            <Link to="/tenant/notices">
              <BellDot className="w-5 h-5 text-primary" />
              <span className="text-xs">Vacancy Notice</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
            <Link to="/tenant/marketplace">
              <Search className="w-5 h-5 text-primary" />
              <span className="text-xs">Browse PGs</span>
            </Link>
          </Button>
        </div>
      </div>
    </TenantLayout>
  );
};

export default TenantDashboard;
