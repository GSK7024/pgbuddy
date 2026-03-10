import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  type?: string;
  jsonLd?: object;
}

const SITE_NAME = "PG Buddy";
const DEFAULT_DESC = "Complete PG management platform for property owners and tenants. Manage properties, rooms, rent payments, complaints and more.";
const BASE_URL = "https://pgbuddy.lovable.app";
const DEFAULT_OG = "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/21c9c19c-348c-4a38-9084-fc6f19578629";

const SEOHead = ({
  title,
  description = DEFAULT_DESC,
  canonical,
  ogImage = DEFAULT_OG,
  type = "website",
  jsonLd,
}: SEOHeadProps) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} – Manage Your PG Properties & Tenants`;
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={ogImage} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
