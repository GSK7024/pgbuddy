import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ForWhoSection from "@/components/landing/ForWhoSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import SEOHead from "@/components/SEOHead";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": "PG Buddy",
      "url": "https://pgbuddy.lovable.app",
      "logo": "https://pgbuddy.lovable.app/favicon.ico",
      "description": "India's #1 PG management platform for property owners and tenants.",
      "sameAs": []
    },
    {
      "@type": "WebSite",
      "name": "PG Buddy",
      "url": "https://pgbuddy.lovable.app",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://pgbuddy.lovable.app/browse?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "SoftwareApplication",
      "name": "PG Buddy",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "INR"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "500"
      }
    }
  ]
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        canonical="/"
        title="PG Management Software for Owners & Tenants"
        description="India's #1 PG management platform. Manage properties, collect rent, track expenses, handle complaints, and find PGs — all in one place. Free to start."
        jsonLd={jsonLd}
      />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <ForWhoSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
