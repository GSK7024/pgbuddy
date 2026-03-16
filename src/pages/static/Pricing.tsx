import StaticPageLayout from "./StaticPageLayout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  { name: "Starter", price: "Free", period: "", features: ["Up to 5 tenants", "1 property", "Rent tracking", "Complaint management", "Meal menu", "Community chat"], cta: "Get Started", popular: false },
  { name: "Pro", price: "₹799", period: "/month", features: ["Up to 50 tenants", "3 properties", "Everything in Starter", "Utility bill tracking", "Document verification", "Payment reminders", "Visitor log", "Priority support"], cta: "Start Free Trial", popular: true },
  { name: "Business", price: "₹1,499", period: "/month", features: ["Up to 100 tenants", "Unlimited properties", "Everything in Pro", "Advanced analytics", "Digital agreements", "WhatsApp support", "Dedicated support"], cta: "Subscribe", popular: false },
  { name: "Enterprise", price: "₹2,999", period: "/month", features: ["Unlimited tenants", "Unlimited properties", "Everything in Business", "Custom branding", "API access", "Dedicated account manager", "Custom integrations"], cta: "Contact Sales", popular: false },
];

const Pricing = () => (
  <StaticPageLayout title="Pricing" description="Simple, transparent pricing for PG owners. Free starter plan, Pro at ₹499/mo, Business at ₹999/mo. 14-day free trial." canonical="/pricing">
    <p className="text-center">Simple, transparent pricing for PG owners of all sizes.</p>

    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-8 not-prose">
      {plans.map((plan) => (
        <div key={plan.name} className={`rounded-2xl border p-6 flex flex-col ${plan.popular ? "border-primary ring-2 ring-primary/20 relative" : "border-border"}`}>
          {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">Most Popular</span>}
          <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
          <div className="mt-2 mb-4">
            <span className="text-3xl font-bold text-foreground">{plan.price}</span>
            <span className="text-muted-foreground text-sm">{plan.period}</span>
          </div>
          <ul className="space-y-2 flex-1 mb-6">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <Link to="/auth?mode=signup">
            <Button className={`w-full ${plan.popular ? "gradient-primary" : ""}`} variant={plan.popular ? "default" : "outline"}>
              {plan.cta}
            </Button>
          </Link>
        </div>
      ))}
    </div>

    <p className="text-center text-sm mt-6">All plans include a 14-day free trial. No credit card required.</p>
  </StaticPageLayout>
);

export default Pricing;
