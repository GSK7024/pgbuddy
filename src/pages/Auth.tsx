import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Mail, Lock, User, ArrowLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const isSignup = searchParams.get("mode") === "signup";
  const [mode, setMode] = useState<"login" | "signup">(isSignup ? "signup" : "login");
  const [role, setRole] = useState<"owner" | "tenant">("tenant");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role: userRole } = useAuth();

  useEffect(() => {
    if (user && userRole) {
      navigate(userRole === "owner" ? "/dashboard" : "/tenant", { replace: true });
    }
  }, [user, userRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanPhone = phone.replace(/\D/g, "");
      if (cleanPhone.length < 10) throw new Error("Please enter a valid 10-digit mobile number.");
      const formattedPhone = `+91${cleanPhone.slice(-10)}`;

      if (!showOtp) {
        // Send OTP via WhatsApp Edge Function (triggering Supabase OTP)
        const { error } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
          options: mode === "signup" ? {
            data: { full_name: fullName, role, phone: formattedPhone },
          } : undefined,
        });
        if (error) throw error;

        setShowOtp(true);
        toast({ title: "Code sent!", description: "Check your WhatsApp for the 6-digit code." });
      } else {
        // Verify code
        if (!otp || otp.length < 6) throw new Error("Please enter the 6-digit code.");
        const { error } = await supabase.auth.verifyOtp({
          phone: formattedPhone,
          token: otp,
          type: 'sms',
        });
        if (error) throw error;
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-hero">
      {/* Back to home */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-md">
            <Building2 className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold gradient-text">PG Buddy</span>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Sign in to your account"
                : "Get started with PG Buddy"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!showOtp ? (
                <>
                  {mode === "signup" && (
                    <>
                      {/* Role selection */}
                      <div className="space-y-2">
                        <Label>I am a</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setRole("owner")}
                            className={`p-3 rounded-xl border-2 text-center transition-all ${
                              role === "owner"
                                ? "border-primary bg-primary/10 text-primary font-semibold"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <Building2 className="w-5 h-5 mx-auto mb-1" />
                            PG Owner
                          </button>
                          <button
                            type="button"
                            onClick={() => setRole("tenant")}
                            className={`p-3 rounded-xl border-2 text-center transition-all ${
                              role === "tenant"
                                ? "border-primary bg-primary/10 text-primary font-semibold"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <User className="w-5 h-5 mx-auto mb-1" />
                            Tenant
                          </button>
                        </div>
                      </div>

                      {/* Full name */}
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="fullName"
                            placeholder="Enter your full name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Phone number */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (WhatsApp)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                        required
                        maxLength={10}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-muted rounded-lg text-sm text-center">
                    Enter the 6-digit code sent via WhatsApp to <b>+91 {phone}</b>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="otp"
                        type="text"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="pl-10 tracking-widest text-center"
                        required
                        maxLength={6}
                      />
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowOtp(false)} className="text-sm text-primary hover:underline block w-full text-center">Change Number?</button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full gradient-primary text-base py-5"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : showOtp
                  ? "Verify & Sign In"
                  : mode === "login"
                  ? "Send WhatsApp Code"
                  : "Send WhatsApp Code"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => {
                        setMode("signup");
                        setShowOtp(false);
                    }}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                        setMode("login");
                        setShowOtp(false);
                    }}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
