import { motion } from "framer-motion";
import {
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Bell,
  Shield,
  Home,
  Wrench,
} from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Multi-Property Management",
    description: "Manage multiple PG properties from a single dashboard. Track rooms, beds, and occupancy easily.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Users,
    title: "Tenant Management",
    description: "Complete tenant lifecycle management with documents, timelines, and communication tools.",
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: CreditCard,
    title: "Rent Collection",
    description: "Collect rent via UPI, cards, and net banking. Generate digital receipts automatically.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Detailed insights on occupancy, revenue, and expenses. Export reports for tax purposes.",
    color: "bg-success/10 text-success",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Automated rent reminders, vacancy alerts, and maintenance updates via WhatsApp & SMS.",
    color: "bg-warning/10 text-warning",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Bank-grade security for all transactions. Your data is encrypted and protected 24/7.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Home,
    title: "PG Marketplace",
    description: "List vacant rooms and reach thousands of tenants actively looking for PG accommodation.",
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: Wrench,
    title: "Maintenance Tracking",
    description: "Track complaints and maintenance requests from submission to resolution efficiently.",
    color: "bg-accent/10 text-accent",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to{" "}
            <span className="gradient-text">Succeed</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Powerful tools designed specifically for the Indian PG market.
            Simplify your operations and grow your business.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full p-6 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                <div
                  className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
