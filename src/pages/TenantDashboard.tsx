import { useEffect, useState } from "react";
import { Home, CreditCard, IndianRupee, MessageSquare, BellDot, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import TenantLayout from "@/components/dashboard/TenantLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Assignment {
  id: string;
  move_in_date: string;
  rooms: { room_number: string; room_type: string; rent_amount: number; amenities: string[] } | null;
  properties: { name: string; address: string; city: string; contact_phone: string | null } | null;
}

const TenantDashboard = () => {
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [pendingDues, setPendingDues] = useState(0);
  const [openComplaints, setOpenComplaints] = useState(0);
  const [activeNotice, setActiveNotice] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [assignRes, payRes, complaintRes, noticeRes] = await Promise.all([
        supabase
          .from("tenant_assignments")
          .select("id, move_in_date, rooms(room_number, room_type, rent_amount, amenities), properties(name, address, city, contact_phone)")
          .eq("tenant_id", user.id)
          .eq("is_active", true)
          .maybeSingle(),
        supabase
          .from("rent_payments")
          .select("amount")
          .eq("tenant_id", user.id)
          .eq("status", "pending"),
        supabase
          .from("complaints")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", user.id)
          .eq("status", "open"),
        supabase
          .from("vacancy_notices")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", user.id)
          .eq("status", "submitted"),
      ]);

      setAssignment(assignRes.data as Assignment | null);
      setPendingDues(payRes.data?.reduce((s, p) => s + Number(p.amount), 0) ?? 0);
      setOpenComplaints(complaintRes.count ?? 0);
      setActiveNotice((noticeRes.count ?? 0) > 0);
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

  return (
    <TenantLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your PG overview.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Dues</CardTitle>
              <CreditCard className="w-5 h-5 text-warning" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold flex items-center gap-1">
                <IndianRupee className="w-5 h-5" />{pendingDues.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open Complaints</CardTitle>
              <MessageSquare className="w-5 h-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{openComplaints}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Vacancy Notice</CardTitle>
              <BellDot className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <Badge variant={activeNotice ? "destructive" : "secondary"}>
                {activeNotice ? "Active" : "None"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Current Room Details */}
        {assignment ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5 text-primary" />
                My Room
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Property</p>
                  <p className="font-semibold">{assignment.properties?.name}</p>
                  <p className="text-sm text-muted-foreground">{assignment.properties?.address}, {assignment.properties?.city}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Room Details</p>
                  <p className="font-semibold">Room {assignment.rooms?.room_number}</p>
                  <p className="text-sm text-muted-foreground capitalize">{assignment.rooms?.room_type} room</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Monthly Rent</p>
                  <p className="text-xl font-bold flex items-center gap-1">
                    <IndianRupee className="w-4 h-4" />
                    {Number(assignment.rooms?.rent_amount ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Move-in Date</p>
                  <p className="font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {assignment.move_in_date}
                  </p>
                </div>
              </div>
              {assignment.rooms?.amenities && assignment.rooms.amenities.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Room Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {assignment.rooms.amenities.map(a => (
                      <Badge key={a} variant="secondary">{a}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {assignment.properties?.contact_phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Owner Contact</p>
                  <p className="font-medium">{assignment.properties.contact_phone}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Home className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No room assigned</h3>
              <p className="text-muted-foreground mb-4">Browse available PGs and find your perfect room</p>
              <Button asChild className="gradient-primary">
                <Link to="/tenant/marketplace">Browse PGs</Link>
              </Button>
            </CardContent>
          </Card>
        )}

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
              <Home className="w-5 h-5 text-primary" />
              <span className="text-xs">Browse PGs</span>
            </Link>
          </Button>
        </div>
      </div>
    </TenantLayout>
  );
};

export default TenantDashboard;
