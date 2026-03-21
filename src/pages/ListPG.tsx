import { Link } from "react-router-dom";
import { Building2, Users, BarChart3, Shield, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEOHead from "@/components/SEOHead";

const benefits = [
  { icon: Building2, title: "Manage Properties", description: "Add multiple PGs, rooms, and track occupancy in one place" },
  { icon: Users, title: "Tenant Management", description: "Assign tenants to rooms, track their details and documents" },
  { icon: BarChart3, title: "Financial Tracking", description: "Monitor rent payments, expenses, and generate financial reports" },
  { icon: Shield, title: "Complaint Resolution", description: "Handle tenant complaints and send notices efficiently" },
];

const steps = [
  "Sign up as a PG Owner — it's free",
  "Add your property details, amenities & rules",
  "Create rooms with pricing and capacity",
  "Start managing tenants and collecting rent",
];

const ListPG = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="List Your PG Property"
        description="List and manage your PG property for free. Add rooms, manage tenants, track payments, and grow your PG business with PG Buddy."
        canonical="/list-pg"
      />
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              List & Manage Your PG with Ease
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Join hundreds of PG owners who use PG Buddy to streamline their operations, track payments, and keep tenants happy.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="gradient-primary shadow-md" asChild>
                <Link to="/auth?mode=signup&role=owner">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/browse">See Listed PGs</Link>
              </Button>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
            {benefits.map((b) => (
              <Card key={b.title} className="hover:shadow-md transition-shadow">
                <CardContent className="flex gap-4 pt-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <b.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{b.title}</h3>
                    <p className="text-sm text-muted-foreground">{b.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Steps */}
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-2xl font-bold mb-8">Get Started in 4 Simple Steps</h2>
            <div className="space-y-4 text-left">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <p className="font-medium">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button size="lg" className="gradient-primary shadow-lg" asChild>
              <Link to="/auth?mode=signup&role=owner">
                Start Managing Your PG Today
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ListPG;
