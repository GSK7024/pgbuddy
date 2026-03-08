import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 animated-gradient" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-primary/15 mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-medium text-primary">
              Get started in 2 minutes
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
            Ready to Transform Your{" "}
            <span className="gradient-text">PG Business?</span>
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Join thousands of PG owners and tenants who are already enjoying 
            hassle-free property management.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="gradient-primary text-base px-8 py-6 shadow-lg hover:shadow-glow transition-all duration-300 group rounded-xl"
              asChild
            >
              <Link to="/auth?mode=signup">
                Get Started for Free
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 py-6 border-2 rounded-xl"
              asChild
            >
              <Link to="/browse">Browse PGs</Link>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-muted-foreground text-sm">
            {["Free to start", "No credit card required", "Setup in minutes"].map((text) => (
              <div key={text} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                {text}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
