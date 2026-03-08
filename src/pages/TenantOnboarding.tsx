import { useEffect, useState } from "react";
import { CheckCircle, Circle, Upload, FileText, CreditCard, Mail, ArrowRight, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import TenantLayout from "@/components/dashboard/TenantLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

interface OnboardingStep {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  done: boolean;
  link: string;
}

const TenantOnboarding = () => {
  const { user } = useAuth();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const [profileRes, assignRes, docRes, paymentRes] = await Promise.all([
        supabase.from("profiles").select("full_name, phone").eq("user_id", user.id).maybeSingle(),
        supabase.from("tenant_assignments").select("id, id_proof_type, emergency_contact_name").eq("tenant_id", user.id).eq("is_active", true).maybeSingle(),
        supabase.from("tenant_documents").select("id").eq("tenant_id", user.id).limit(1),
        supabase.from("rent_payments").select("id").eq("tenant_id", user.id).eq("status", "paid").limit(1),
      ]);

      const profile = profileRes.data;
      const assignment = assignRes.data;

      setSteps([
        {
          key: "profile",
          label: "Complete Your Profile",
          description: "Add your full name and phone number",
          icon: Mail,
          done: !!(profile?.full_name && profile?.phone),
          link: "/tenant/profile",
        },
        {
          key: "room",
          label: "Room Assigned",
          description: "Your PG owner assigns you to a room",
          icon: Shield,
          done: !!assignment,
          link: "/tenant",
        },
        {
          key: "documents",
          label: "Upload ID Proof",
          description: "Upload your Aadhaar, PAN, or other ID documents",
          icon: Upload,
          done: (docRes.data?.length ?? 0) > 0,
          link: "/tenant/documents",
        },
        {
          key: "emergency",
          label: "Emergency Contact",
          description: "Provide emergency contact information",
          icon: FileText,
          done: !!(assignment?.emergency_contact_name),
          link: "/tenant/profile",
        },
        {
          key: "payment",
          label: "First Rent Payment",
          description: "Complete your first rent payment",
          icon: CreditCard,
          done: (paymentRes.data?.length ?? 0) > 0,
          link: "/tenant/payments",
        },
      ]);
      setLoading(false);
    };
    check();
  }, [user]);

  const completedCount = steps.filter(s => s.done).length;
  const progress = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  if (loading) {
    return <TenantLayout><p className="text-muted-foreground">Loading...</p></TenantLayout>;
  }

  return (
    <TenantLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Welcome Onboarding</h1>
          <p className="text-muted-foreground">Complete these steps to get fully set up</p>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold">{completedCount}/{steps.length} steps completed</p>
              <p className="text-sm text-muted-foreground">{Math.round(progress)}%</p>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        <div className="space-y-3">
          {steps.map((step, i) => (
            <motion.div key={step.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={step.link}>
                <Card className={`transition-all hover:shadow-md cursor-pointer ${step.done ? "border-success/30 bg-success/5" : "hover:border-primary/30"}`}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-success/20" : "bg-muted"}`}>
                      {step.done ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <step.icon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${step.done ? "line-through text-muted-foreground" : ""}`}>{step.label}</p>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    {!step.done && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {completedCount === steps.length && (
          <Card className="border-success bg-success/10">
            <CardContent className="flex items-center gap-3 py-4">
              <CheckCircle className="w-6 h-6 text-success" />
              <div>
                <p className="font-semibold text-success">All set! 🎉</p>
                <p className="text-sm text-muted-foreground">You're fully onboarded. Enjoy your stay!</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TenantLayout>
  );
};

export default TenantOnboarding;
