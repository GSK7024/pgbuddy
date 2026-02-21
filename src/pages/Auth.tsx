import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Mail, Lock, User, ArrowLeft } from "lucide-react";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
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
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, role },
          },
        });
        if (error) throw error;

        toast({
          title: "Account created!",
          description: "Please check your email to verify your account before logging in.",
        });
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
          <span className="text-2xl font-bold gradient-text">PG Manager</span>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Sign in to your account"
                : "Get started with PG Manager"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary text-base py-5"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
              </Button>

              {mode === "login" && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!email) {
                      toast({ title: "Enter your email", description: "Please enter your email address first.", variant: "destructive" });
                      return;
                    }
                    setLoading(true);
                    try {
                      const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/reset-password`,
                      });
                      if (error) throw error;
                      toast({ title: "Check your email", description: "We've sent you a password reset link." });
                    } catch (error: any) {
                      toast({ title: "Error", description: error.message, variant: "destructive" });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => setMode("signup")}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setMode("login")}
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
