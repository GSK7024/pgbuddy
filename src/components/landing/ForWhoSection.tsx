import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Building2, User, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const ForWhoSection = () => {
  return (
    <section className="py-20 sm:py-32">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
            Who is it for?
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Built for <span className="gradient-text">Everyone</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Whether you own a PG or looking for one, we've got you covered.
          </p>
        </motion.div>

        {/* Two Column Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* For PG Owners */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative group"
          >
            <div className="absolute inset-0 gradient-primary rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative bg-card p-8 rounded-3xl border border-border overflow-hidden">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold mb-4">For PG Owners</h3>
              <p className="text-muted-foreground mb-6">
                Take control of your PG business with powerful management tools 
                designed to save time and maximize revenue.
              </p>

              {/* Benefits */}
              <ul className="space-y-3 mb-8">
                {[
                  "Manage multiple properties easily",
                  "Collect rent digitally via UPI",
                  "Track expenses & generate reports",
                  "Post vacancies to attract tenants",
                  "Handle complaints efficiently",
                ].map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button className="gradient-primary group/btn" asChild>
                <Link to="/auth?mode=signup&role=owner">
                  List Your PG
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* For Tenants */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative group"
          >
            <div className="absolute inset-0 gradient-accent rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative bg-card p-8 rounded-3xl border border-border overflow-hidden">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center mb-6 shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold mb-4">For Tenants</h3>
              <p className="text-muted-foreground mb-6">
                Find your perfect PG, pay rent hassle-free, and communicate 
                with your owner – all from your phone.
              </p>

              {/* Benefits */}
              <ul className="space-y-3 mb-8">
                {[
                  "Browse verified PGs near you",
                  "Pay rent with one tap via UPI",
                  "Get digital payment receipts",
                  "Raise & track complaints easily",
                  "Submit vacancy notices online",
                ].map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="border-2 hover:bg-accent/5" asChild>
                <Link to="/browse">
                  Find a PG
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ForWhoSection;
