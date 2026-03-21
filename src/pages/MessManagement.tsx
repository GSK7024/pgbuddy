import { useState } from "react";
import { UtensilsCrossed, Users, UserCheck, CreditCard, LayoutDashboard, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import MessPlans from "./MessPlans";
import MessMembers from "./MessMembers";
import MessAttendance from "./MessAttendance";
import MessPayments from "./MessPayments";
import MessDashboard from "./MessDashboard";
import MessExpenses from "./MessExpenses";
import MessGuests from "./MessGuests";
import { useSubscriptionPlan } from "@/hooks/useSubscriptionPlan";
import { useStaffAccess } from "@/hooks/useStaffAccess";
import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

const MessManagement = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { effectiveOwnerId } = useStaffAccess();
  const { isPro, loading: planLoading } = useSubscriptionPlan(effectiveOwnerId);

  if (!planLoading && !isPro) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <Card className="max-w-md w-full border-dashed border-2 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Crown className="w-48 h-48" />
            </div>
            <CardContent className="pt-8 pb-8 px-6 text-center space-y-6 relative z-10">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold font-heading">Mess Management is Locked</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Manage mess attendance, subscriptions, expenses, and automated billing seamlessly. 
                  Upgrade to the <strong className="text-foreground">Pro Plan</strong> or higher to unlock this feature.
                </p>
              </div>
              <div className="pt-2">
                <Button asChild size="lg" className="w-full gradient-primary gap-2 font-bold shadow-md hover:shadow-lg transition-all">
                  <Link to="/dashboard/subscription">
                    <Crown className="w-4 h-4" />
                    Upgrade to Pro
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UtensilsCrossed className="w-6 h-6 text-primary" />
              Mess Management
            </h1>
            <p className="text-muted-foreground">Manage plans, members, attendance and payments in one place</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="w-4 h-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2">
              <UserCheck className="w-4 h-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="guests" className="gap-2">
              <UtensilsCrossed className="w-4 h-4" />
              Guests
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Plans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="border-none p-0 outline-none">
            <MessDashboard />
          </TabsContent>
          <TabsContent value="plans" className="border-none p-0 outline-none">
            <MessPlans standalone={false} />
          </TabsContent>
          <TabsContent value="members" className="border-none p-0 outline-none">
            <MessMembers standalone={false} />
          </TabsContent>
          <TabsContent value="attendance" className="border-none p-0 outline-none">
            <MessAttendance standalone={false} />
          </TabsContent>
          <TabsContent value="payments" className="border-none p-0 outline-none">
            <MessPayments standalone={false} />
          </TabsContent>
          <TabsContent value="guests" className="border-none p-0 outline-none">
            <MessGuests />
          </TabsContent>
          <TabsContent value="expenses" className="border-none p-0 outline-none">
            <MessExpenses />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MessManagement;
