import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Search, Building2, Users, Shield, Sparkles, LogIn, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Capacitor } from "@capacitor/core";

const HeroSection = () => {
  const { user, loading } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated gradient background */}
      <div className="absolute inset-0 animated-gradient" />
      
      {/* Mesh gradient orbs */}
      <div className="absolute top-20 left-10 w-80 h-80 bg-primary/8 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/8 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-accent/5 rounded-full blur-[80px]" />

      {/* Dot grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
        backgroundSize: "32px 32px"
      }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-primary/15 mb-8 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-medium text-primary">
              India's #1 PG Management Platform
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6"
          >
            Manage Your{" "}
            <span className="gradient-text">PG Business</span>
            <br />
            Like a Pro
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            The complete solution for PG owners and tenants. Manage properties, 
            collect rent, track expenses, and find your perfect PG – all in one place.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14"
          >
            {!loading && (
              user ? (
                <>
                  <Button
                    size="lg"
                    className="gradient-primary text-base px-8 py-6 shadow-lg hover:shadow-glow transition-all duration-300 group rounded-xl"
                    asChild
                  >
                    <Link to="/dashboard">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  {!Capacitor.isNativePlatform() && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-base px-8 py-6 border-2 hover:bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400 rounded-xl group"
                      asChild
                    >
                      <a href="/pg-buddy.apk" download>
                        <Download className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                        Download App
                      </a>
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="gradient-primary text-base px-8 py-6 shadow-lg hover:shadow-glow transition-all duration-300 group rounded-xl"
                    asChild
                  >
                    <Link to="/auth?mode=signup">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-base px-8 py-6 border-2 hover:bg-primary/5 rounded-xl"
                    asChild
                  >
                    <Link to="/auth">
                      <LogIn className="w-5 h-5 mr-2" />
                      Login
                    </Link>
                  </Button>
                  {!Capacitor.isNativePlatform() && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-base px-8 py-6 border-2 hover:bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400 rounded-xl group"
                      asChild
                    >
                      <a href="/pg-buddy.apk" download>
                        <Download className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                        Download App
                      </a>
                    </Button>
                  )}
                </>
              )
            )}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="inline-flex items-center gap-8 sm:gap-12 px-8 py-5 rounded-2xl glass-card border border-border/50 shadow-card"
          >
            {[
              { value: "10K+", label: "PG Properties" },
              { value: "50K+", label: "Happy Tenants" },
              { value: "₹5Cr+", label: "Rent Collected" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold gradient-text">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Floating Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="hidden lg:block"
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-8 top-1/2 -translate-y-1/2"
          >
            <div className="glass-card p-4 rounded-2xl shadow-card border border-border/50 w-60">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-success" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Verified PGs</div>
                  <div className="text-xs text-muted-foreground">100% Safe & Secure</div>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-4/5 gradient-primary rounded-full" />
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-8 top-1/3"
          >
            <div className="glass-card p-4 rounded-2xl shadow-card border border-border/50 w-52">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-sm">New Tenant</div>
                  <div className="text-xs text-muted-foreground">Just moved in!</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/20 flex justify-center pt-2"
        >
          <div className="w-1 h-2 bg-muted-foreground/40 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
