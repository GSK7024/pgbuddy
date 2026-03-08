import StaticPageLayout from "./StaticPageLayout";

const TermsOfService = () => (
  <StaticPageLayout title="Terms of Service">
    <p className="text-sm">Last updated: March 1, 2026</p>

    <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
    <p>By accessing or using PG Manager, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>

    <h2 className="text-xl font-semibold text-foreground">2. Description of Service</h2>
    <p>PG Manager provides a web-based platform for paying guest (PG) property management, including tenant management, rent tracking, document handling, and communication tools.</p>

    <h2 className="text-xl font-semibold text-foreground">3. User Accounts</h2>
    <ul className="list-disc pl-6 space-y-1">
      <li>You must provide accurate information when creating an account</li>
      <li>You are responsible for maintaining the security of your account credentials</li>
      <li>One person may not maintain more than one account</li>
      <li>You must be at least 18 years old to use this service</li>
    </ul>

    <h2 className="text-xl font-semibold text-foreground">4. PG Owner Responsibilities</h2>
    <p>Owners are responsible for the accuracy of property listings, fair treatment of tenants, and compliance with local tenancy laws and regulations.</p>

    <h2 className="text-xl font-semibold text-foreground">5. Tenant Responsibilities</h2>
    <p>Tenants must provide accurate personal information and valid identification documents. Misuse of the platform, including uploading fraudulent documents, may result in account termination.</p>

    <h2 className="text-xl font-semibold text-foreground">6. Payments</h2>
    <p>PG Manager facilitates rent tracking but is not responsible for actual financial transactions between owners and tenants. Subscription payments for premium plans are processed via Razorpay.</p>

    <h2 className="text-xl font-semibold text-foreground">7. Termination</h2>
    <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time.</p>

    <h2 className="text-xl font-semibold text-foreground">8. Limitation of Liability</h2>
    <p>PG Manager is provided "as is" without warranties. We are not liable for disputes between owners and tenants, payment disputes, or any damages arising from platform use.</p>

    <h2 className="text-xl font-semibold text-foreground">9. Changes to Terms</h2>
    <p>We may update these terms periodically. Continued use of the platform after changes constitutes acceptance of the new terms.</p>

    <h2 className="text-xl font-semibold text-foreground">10. Contact</h2>
    <p>For questions about these terms, email <a href="mailto:legal@pgmanager.in" className="text-primary hover:underline">legal@pgmanager.in</a>.</p>
  </StaticPageLayout>
);

export default TermsOfService;
