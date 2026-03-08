import StaticPageLayout from "./StaticPageLayout";
import { Link } from "react-router-dom";

const topics = [
  { title: "Getting Started", items: ["Creating your account", "Setting up your first property", "Adding rooms and tenants", "Configuring payment settings"] },
  { title: "Rent & Payments", items: ["How rent tracking works", "Uploading payment proofs", "Setting up payment reminders", "Viewing payment history"] },
  { title: "Tenant Management", items: ["Inviting tenants via invite codes", "Tenant onboarding process", "Document verification", "Managing move-in/move-out"] },
  { title: "Troubleshooting", items: ["Can't log in to my account", "Payment proof not uploading", "Not receiving notifications", "Contact support for other issues"] },
];

const HelpCenter = () => (
  <StaticPageLayout title="Help Center">
    <p>Find answers to common questions and learn how to get the most out of PG Manager.</p>

    <div className="space-y-6 mt-4">
      {topics.map((topic) => (
        <div key={topic.title} className="border border-border rounded-xl p-5">
          <h3 className="text-lg font-semibold text-foreground mb-3">{topic.title}</h3>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            {topic.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ))}
    </div>

    <p className="text-sm mt-4">Still need help? Email us at <a href="mailto:support@pgmanager.in" className="text-primary hover:underline">support@pgmanager.in</a></p>
  </StaticPageLayout>
);

export default HelpCenter;
