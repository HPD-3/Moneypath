import { Helmet } from "react-helmet-async";

const SITE_URL = "https://moneypath.my.id";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
const SITE_NAME = "MoneyPath";

/**
 * SEO component — drop into any page to set per-route meta tags.
 *
 * @param {string}  title       - Page title (appended with " | MoneyPath")
 * @param {string}  description - Meta description (max ~160 chars)
 * @param {string}  canonical   - Canonical URL path, e.g. "/dashboard"
 * @param {string}  image       - Absolute URL for OG/Twitter image
 * @param {string}  robots      - robots meta value, default "index, follow"
 * @param {object}  jsonLd      - Optional JSON-LD structured data object
 */
export default function SEO({
  title,
  description,
  canonical,
  image = DEFAULT_IMAGE,
  robots = "index, follow",
  jsonLd,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : SITE_URL;

  return (
    <Helmet>
      {/* Primary */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="id_ID" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
