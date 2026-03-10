import StaticPageLayout from "./StaticPageLayout";

const PrivacyPolicy = () => (
  <StaticPageLayout title="Privacy Policy" description="PG Buddy privacy policy. Learn how we collect, use, and protect your personal data." canonical="/privacy">
    <p className="text-sm">Last updated: March 1, 2026</p>

    <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
    <p>We collect information you provide directly: name, email, phone number, and property details when you register. For tenants, we may also collect ID proof documents uploaded for verification purposes.</p>

    <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
    <ul className="list-disc pl-6 space-y-1">
      <li>To provide and maintain the PG Manager platform</li>
      <li>To process rent payments and send payment reminders</li>
      <li>To facilitate communication between owners and tenants</li>
      <li>To send important notifications about your account</li>
      <li>To improve our services and user experience</li>
    </ul>

    <h2 className="text-xl font-semibold text-foreground">3. Data Storage & Security</h2>
    <p>Your data is stored securely using industry-standard encryption. We implement row-level security policies ensuring users can only access their own data. Documents and files are stored in private, access-controlled storage buckets.</p>

    <h2 className="text-xl font-semibold text-foreground">4. Data Sharing</h2>
    <p>We do not sell your personal data. Tenant information is shared only with their respective PG owner for management purposes. We may share data with law enforcement if required by law.</p>

    <h2 className="text-xl font-semibold text-foreground">5. Your Rights</h2>
    <p>You can request access to, correction of, or deletion of your personal data at any time by contacting us at <a href="mailto:privacy@pgmanager.in" className="text-primary hover:underline">privacy@pgmanager.in</a>.</p>

    <h2 className="text-xl font-semibold text-foreground">6. Cookies</h2>
    <p>We use essential cookies for authentication and session management. No third-party tracking cookies are used.</p>

    <h2 className="text-xl font-semibold text-foreground">7. Contact</h2>
    <p>For privacy-related questions, email <a href="mailto:privacy@pgmanager.in" className="text-primary hover:underline">privacy@pgmanager.in</a>.</p>
  </StaticPageLayout>
);

export default PrivacyPolicy;
