import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Lock, User, ArrowLeft, Phone, BadgeCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getAppName, getAppLogo, isWhiteLabel } from "@/lib/branding";

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
        if (!otp || otp.length < 6) throw new Error("Please enter the 6-digit code.");
        const { error } = await supabase.auth.verifyOtp({
          phone: formattedPhone,
          token: otp,
          type: 'sms',
        });
        if (error) throw error;
        toast({ title: "Success!", description: "Logged in successfully! Loading dashboard..." });
        
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (mode === "signup") {
    // ----------------------------------------------------
    // SIGN UP LAYOUT (Glass Card Design)
    // ----------------------------------------------------
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center p-6 relative selection:bg-primary/10">
        {/* Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-slate-200/40 rounded-full blur-[120px]"></div>
        </div>



        <motion.main 
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full max-w-[1000px] mx-auto z-10"
        >
          <div className="bg-white/80 backdrop-blur-3xl rounded-3xl shadow-[0_20px_50px_-12px_rgba(30,41,59,0.08)] overflow-hidden flex flex-col md:flex-row border border-white/80">
            
            {/* Left Side: Brand & Visuals */}
            <div className="hidden md:flex md:w-[42%] p-8 md:p-14 bg-slate-50/50 flex-col justify-between border-r border-slate-100">
              <div>
                <div className="flex items-center gap-3 mb-12">
                  {isWhiteLabel ? (
                    <img src={getAppLogo()} alt={getAppName()} className="h-12 w-auto object-contain object-center drop-shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <span className="font-extrabold text-xl tracking-tight text-primary">{getAppName()}</span>
                </div>
                
                <div className="space-y-6">
                  <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
                    Welcome to <br/><span className="text-primary">{getAppName()}</span>
                  </h1>
                  <p className="text-slate-500 text-base leading-relaxed max-w-[280px]">
                    Experience a seamless stay with premium managed spaces tailored for your comfort.
                  </p>
                </div>
                

              </div>
              
              {/* Premium Architecture Image */}
              <div className="mt-14 relative group hidden md:block">
                <div className="absolute inset-0 bg-primary/10 rounded-2xl translate-x-3 translate-y-3 -z-10 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
                <img 
                  alt="Premium coliving space" 
                  className="w-full h-56 object-cover rounded-2xl shadow-md grayscale-[0.2]" 
                  src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80"
                />
              </div>
            </div>

            {/* Right Side: Signup Form */}
            <div className="w-full md:w-[58%] p-6 py-10 md:p-14 bg-white flex flex-col justify-center">

              {/* Mobile-Only Header */}
              <div className="md:hidden flex flex-col items-center justify-center gap-3 mb-8 w-full border-b border-slate-100 pb-6">
                {isWhiteLabel ? (
                  <img src={getAppLogo()} alt={getAppName()} className="h-16 w-auto object-contain object-center drop-shadow-sm" />
                ) : (
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-md">
                    <Building2 className="w-6 h-6 text-primary-foreground" />
                  </div>
                )}
                <span className="font-extrabold text-2xl tracking-tight text-primary">{getAppName()}</span>
              </div>

              <div className="mb-10 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Join the Community</h2>
                <p className="text-sm md:text-base text-slate-500">Enter your details to discover exclusive properties.</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {!showOtp ? (
                  <>
                    {/* Role Selection */}
                    <div className="group">
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Account Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setRole("tenant")}
                          className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                            role === "tenant" ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-slate-100 text-slate-500 hover:border-slate-200"
                          }`}
                        >
                          Tenant
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole("owner")}
                          className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                            role === "owner" ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-slate-100 text-slate-500 hover:border-slate-200"
                          }`}
                        >
                          PG Owner
                        </button>
                      </div>
                    </div>

                    {/* Name Input */}
                    <div className="group">
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1 transition-colors group-focus-within:text-primary">Your Full Name</label>
                      <div className="relative border-b-2 border-slate-100 group-focus-within:border-primary transition-all pb-2">
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-slate-900 placeholder:text-slate-300 focus-visible:ring-0 text-base shadow-none h-8 font-medium"
                          placeholder="e.g. Kenneth Sato" 
                          required
                        />
                        <User className="absolute right-0 top-1 w-5 h-5 text-slate-300" />
                      </div>
                    </div>
                
                    {/* Mobile Number Input */}
                    <div className="group">
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1 transition-colors group-focus-within:text-primary">Mobile Number (WhatsApp)</label>
                      <div className="flex items-center gap-4">
                        <div className="flex-grow flex items-center gap-3 relative border-b-2 border-slate-100 group-focus-within:border-primary transition-all pb-2">
                          <span className="text-slate-400 font-bold">+91</span>
                          <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-transparent border-none p-0 text-slate-900 placeholder:text-slate-300 focus-visible:ring-0 text-base shadow-none h-8 font-medium tracking-wide"
                            placeholder="00000 00000" 
                            required
                            maxLength={10}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* OTP Code */
                  <AnimatePresence>
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="group">
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1 transition-colors group-focus-within:text-primary">Verification Code</label>
                      <p className="text-xs text-primary font-bold mb-4 ml-1">Code sent to +91 {phone}</p>
                      <div className="relative border-b-2 border-slate-100 group-focus-within:border-primary transition-all pb-2">
                        <Input
                          id="otp"
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-transparent border-none p-0 text-primary placeholder:text-slate-200 focus-visible:ring-0 shadow-none h-12 text-2xl tracking-[0.7em] font-extrabold text-left pl-2"
                          placeholder="000000"
                          maxLength={6}
                          required
                        />
                      </div>
                      <button type="button" onClick={() => setShowOtp(false)} className="text-[11px] font-bold text-slate-400 hover:text-primary mt-4 uppercase tracking-widest transition-colors">Change Number</button>
                    </motion.div>
                  </AnimatePresence>
                )}

                {/* Terms */}
                {mode === "signup" && !showOtp && (
                  <div className="flex items-start gap-4 pt-2">
                    <div className="relative flex items-center h-5">
                       <input id="terms" type="checkbox" required className="w-4 h-4 rounded border-slate-200 text-primary focus:ring-primary/20 cursor-pointer" />
                    </div>
                    <label htmlFor="terms" className="text-[11px] text-slate-400 leading-relaxed font-medium">
                      By registering, I agree to the <a href="#" className="text-slate-900 font-bold hover:underline">Terms</a> and <a href="#" className="text-slate-900 font-bold hover:underline">Privacy Policy</a>.
                    </label>
                  </div>
                )}
                
                {/* CTA */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground font-bold text-sm py-6 rounded-full shadow-[0_10px_20px_-5px_rgba(30,41,59,0.2)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                >
                   {loading ? "Please wait..." : showOtp ? "Verify & Enter" : "Send OTP"}
                </Button>
              </form>
              
              <div className="mt-12 pt-8 border-t border-slate-50 text-center">
                <p className="text-xs text-slate-400 font-medium">
                   Already have an account? 
                   <button onClick={() => { setMode("login"); setShowOtp(false); }} className="text-primary font-bold ml-1 hover:underline underline-offset-4">
                     Sign In
                   </button>
                </p>
              </div>
            </div>
            
          </div>
        </motion.main>
      </div>
    );
  }

  // ----------------------------------------------------
  // LOGIN LAYOUT (Split Screen Design)
  // ----------------------------------------------------
  return (
    <main className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-background">
      {/* Left Side: Visual Narrative */}
      <section className="hidden md:flex md:w-1/2 lg:w-[55%] relative items-end p-12 overflow-hidden bg-zinc-950">
        <div className="absolute inset-0 z-0">
          <img 
            className="w-full h-full object-cover opacity-80" 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80" 
            alt="Interior" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
        </div>
        
        <div className="relative z-10 text-white max-w-md">
          <div className="mb-8 flex items-center gap-3">
            {isWhiteLabel ? (
              <img src={getAppLogo()} alt={getAppName()} className="h-14 w-auto object-contain object-left drop-shadow-xl ml-4" />
            ) : (
               <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-xl">
                 <Building2 className="w-6 h-6 text-white" />
               </div>
            )}
            {!isWhiteLabel && <span className="font-bold text-2xl tracking-tighter shadow-sm">{getAppName()}</span>}
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-[1.1] tracking-tight text-white drop-shadow-md">Your Gateway to <br/>Seamless Living.</h2>
          <p className="text-white/80 font-medium text-lg leading-relaxed drop-shadow-sm">Manage your stay, track expenses, and connect with the {getAppName()} community effortlessly.</p>
        </div>
      </section>

      {/* Right Side: Interaction Canvas */}
      <section className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 lg:p-24 bg-card relative">
        <Link to="/" className="absolute top-6 left-6 hidden items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.4 }}
           className="w-full max-w-[420px] pt-16 md:pt-0"
        >
          {/* Mobile Brand Logo */}
          <div className="md:hidden flex flex-col justify-center items-center gap-3 px-2 pb-8 mb-10 w-full border-b border-border/50">
            {isWhiteLabel ? (
              <img src={getAppLogo()} alt={getAppName()} className="h-16 w-auto object-contain object-center drop-shadow-md" />
            ) : (
               <>
                 <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                   <Building2 className="w-6 h-6 text-primary-foreground" />
                 </div>
                 <span className="font-bold text-2xl tracking-tighter text-foreground">{getAppName()}</span>
               </>
            )}
          </div>

          <header className="mb-10 text-center md:text-left">
            <h1 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
               {isWhiteLabel ? `Sign in to ${getAppName()}` : "Welcome Back"}
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
               Enter your registered WhatsApp number to continue.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!showOtp ? (
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-muted-foreground ml-1">Mobile Number (WhatsApp)</Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-border pr-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground font-medium text-sm">+91</span>
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="00000 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-24 pr-4 h-14 bg-muted/30 hover:bg-muted/50 focus:bg-background rounded-xl border-border focus:ring-2 focus:ring-primary/20 transition-all font-medium tracking-wide"
                    required
                    maxLength={10}
                  />
                </div>
              </div>
            ) : (
              <AnimatePresence>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm text-center font-medium text-primary">
                    Code sent to <b className="tracking-wide">+91 {phone}</b> via WhatsApp
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-sm font-semibold text-muted-foreground ml-1">Verification Code</Label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pr-3 border-r border-border">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-16 pr-4 h-14 bg-muted/30 hover:bg-muted/50 focus:bg-background rounded-xl border-border focus:ring-2 focus:ring-primary/20 transition-all tracking-[0.5em] text-center font-bold text-lg"
                        required
                        maxLength={6}
                      />
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowOtp(false)} className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors block w-full text-center hover:underline">Change Mobile Number?</button>
                </motion.div>
              </AnimatePresence>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-14 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all duration-300 text-base"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : showOtp
                ? "Verify & Sign In"
                : "Send OTP via WhatsApp"}
            </Button>
          </form>

          {/* Support & Secondary Links */}
          <div className="mt-8 space-y-4 text-center md:text-left">
            <div className="text-sm font-medium">
              <span className="text-muted-foreground">Don't have an account?</span>
              <button
                onClick={() => {
                    setMode("signup");
                    setShowOtp(false);
                }}
                className="text-primary hover:text-primary/80 ml-2 transition-colors font-bold hover:underline"
              >
                Sign Up
              </button>
            </div>
          </div>
          
          <footer className="mt-16 text-center md:text-left flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 opacity-50">
            <a href="#" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Terms</a>
            <a href="#" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Support</a>
          </footer>
        </motion.div>
      </section>
    </main>
  );
};

export default Auth;
