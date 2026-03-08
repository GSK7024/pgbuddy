import StaticPageLayout from "./StaticPageLayout";

const AboutUs = () => (
  <StaticPageLayout title="About Us">
    <p>PG Manager is India's leading paying guest and hostel management platform, built to simplify property operations for PG owners and enhance the living experience for tenants across the country.</p>

    <h2 className="text-xl font-semibold text-foreground">Our Mission</h2>
    <p>We believe managing a PG shouldn't require spreadsheets, WhatsApp groups, and manual follow-ups. Our mission is to digitize every aspect of PG operations — from rent collection and tenant onboarding to meal menus and complaint resolution — so owners can focus on growing their business while tenants enjoy a seamless living experience.</p>

    <h2 className="text-xl font-semibold text-foreground">What We Do</h2>
    <ul className="list-disc pl-6 space-y-2">
      <li><strong>For PG Owners:</strong> Manage properties, rooms, tenants, rent payments, utility bills, expenses, visitor logs, and more — all from one dashboard.</li>
      <li><strong>For Tenants:</strong> Find PGs, pay rent, raise complaints, view meal menus, submit documents, and communicate with your PG owner effortlessly.</li>
    </ul>

    <h2 className="text-xl font-semibold text-foreground">Why Choose PG Manager?</h2>
    <ul className="list-disc pl-6 space-y-2">
      <li>Purpose-built for the Indian PG ecosystem</li>
      <li>Supports both owners and tenants on one platform</li>
      <li>Automated rent reminders and payment tracking</li>
      <li>Document verification and digital agreements</li>
      <li>Free tier available — no credit card required</li>
    </ul>

    <h2 className="text-xl font-semibold text-foreground">Our Team</h2>
    <p>We're a passionate team of developers and entrepreneurs who've lived in PGs ourselves. We understand the pain points firsthand and are committed to building tools that actually solve real problems for PG owners and tenants across India.</p>
  </StaticPageLayout>
);

export default AboutUs;
