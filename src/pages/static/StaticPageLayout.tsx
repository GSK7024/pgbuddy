import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import SEOHead from "@/components/SEOHead";
import { ReactNode } from "react";

const StaticPageLayout = ({ title, description, canonical, children }: { title: string; description?: string; canonical?: string; children: ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <SEOHead
      title={title}
      description={description || `${title} — PG Buddy, India's leading PG management platform.`}
      canonical={canonical}
    />
    <Navbar />
    <main className="flex-1 pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <h1 className="text-3xl font-bold mb-8">{title}</h1>
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          {children}
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default StaticPageLayout;
