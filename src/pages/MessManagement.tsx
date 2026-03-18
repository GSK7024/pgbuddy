import { useState } from "react";
import { UtensilsCrossed, Users, UserCheck, CreditCard, LayoutDashboard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import MessPlans from "./MessPlans";
import MessMembers from "./MessMembers";
import MessAttendance from "./MessAttendance";
import MessPayments from "./MessPayments";

const MessManagement = () => {
  const [activeTab, setActiveTab] = useState("members");

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
          <TabsList className="bg-muted/50 p-1">
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
            <TabsTrigger value="plans" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Plans
            </TabsTrigger>
          </TabsList>

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
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MessManagement;
