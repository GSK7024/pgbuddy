import StaticPageLayout from "./StaticPageLayout";
import { Mail } from "lucide-react";

const Careers = () => (
  <StaticPageLayout title="Careers">
    <p>Join us in transforming the PG management industry across India. We're always looking for talented individuals who are passionate about building great products.</p>

    <h2 className="text-xl font-semibold text-foreground">Why Work With Us?</h2>
    <ul className="list-disc pl-6 space-y-2">
      <li>Work on a product used by thousands of PG owners and tenants</li>
      <li>Remote-first culture with flexible hours</li>
      <li>Competitive compensation and equity options</li>
      <li>Fast-paced startup environment with real impact</li>
    </ul>

    <h2 className="text-xl font-semibold text-foreground">Open Positions</h2>
    <p>We don't have any open positions at the moment, but we're always interested in hearing from talented people. If you think you'd be a great fit, send us your resume.</p>

    <div className="flex items-center gap-2 text-foreground">
      <Mail className="w-4 h-4" />
      <a href="mailto:careers@pgbuddy.in" className="text-primary hover:underline">careers@pgbuddy.in</a>
    </div>
  </StaticPageLayout>
);

export default Careers;
