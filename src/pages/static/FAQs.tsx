import StaticPageLayout from "./StaticPageLayout";

const faqs = [
  { q: "What is PG Buddy?", a: "PG Buddy is a complete management platform for paying guest (PG) and hostel owners in India. It helps you manage tenants, rooms, rent payments, complaints, documents, and more from a single dashboard." },
  { q: "Is PG Buddy free to use?", a: "Yes! We offer a free plan with essential features. You can upgrade to premium plans for advanced features like unlimited tenants, utility bill tracking, and priority support." },
  { q: "How do tenants join my PG on the platform?", a: "You can send invite codes to your tenants. They sign up, enter the invite code, and get automatically assigned to their room and property." },
  { q: "Can tenants pay rent through PG Buddy?", a: "PG Buddy tracks rent payments and allows tenants to upload payment proofs. For direct online payments, you can configure your UPI or bank details in Payment Settings." },
  { q: "Is my data secure?", a: "Absolutely. We use industry-standard encryption, row-level security policies, and secure authentication. Your data is never shared with third parties." },
  { q: "Can I manage multiple properties?", a: "Yes! Owners can add and manage multiple PG properties from a single account. Each property has its own rooms, tenants, and settings." },
  { q: "How do I reset my password?", a: "Click 'Forgot Password' on the login page, enter your email, and you'll receive a password reset link." },
  { q: "Do you have a mobile app?", a: "PG Buddy is a responsive web app that works great on mobile browsers. A mobile app is also on our roadmap." },
];

const FAQs = () => (
  <StaticPageLayout title="Frequently Asked Questions">
    <div className="space-y-5">
      {faqs.map((faq) => (
        <div key={faq.q} className="border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
          <p className="text-sm">{faq.a}</p>
        </div>
      ))}
    </div>
  </StaticPageLayout>
);

export default FAQs;
