import StaticPageLayout from "./StaticPageLayout";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

const Contact = () => (
  <StaticPageLayout title="Contact Us">
    <p>Have questions, feedback, or need help? We'd love to hear from you.</p>

    <div className="grid gap-4 sm:grid-cols-2 mt-4">
      {[
        { icon: Mail, label: "Email", value: "support@pgbuddy.in", href: "mailto:support@pgbuddy.in" },
        { icon: Phone, label: "Phone", value: "+91 98765 43210", href: "tel:+919876543210" },
        { icon: MapPin, label: "Location", value: "Bangalore, Karnataka, India" },
        { icon: Clock, label: "Support Hours", value: "Mon–Sat, 9 AM – 7 PM IST" },
      ].map((item) => (
        <div key={item.label} className="flex items-start gap-3 border border-border rounded-xl p-4">
          <item.icon className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">{item.label}</p>
            {item.href ? (
              <a href={item.href} className="text-sm text-primary hover:underline">{item.value}</a>
            ) : (
              <p className="text-sm">{item.value}</p>
            )}
          </div>
        </div>
      ))}
    </div>

    <h2 className="text-xl font-semibold text-foreground mt-4">Frequently Asked Questions</h2>
    <p>Before reaching out, check our <a href="/faqs" className="text-primary hover:underline">FAQs page</a> — your question might already be answered.</p>
  </StaticPageLayout>
);

export default Contact;
