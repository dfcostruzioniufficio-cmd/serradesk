import React from 'react';
import { Helmet } from 'react-helmet';
import { seoConfig } from '../seo.config';

export default function SEOManager({ title, description, keywords, path = '' }) {
  const metaTitle = title ? seoConfig.titleTemplate.replace('%s', title) : seoConfig.defaultTitle;
  const metaDescription = description || seoConfig.defaultDescription;
  const metaKeywords = keywords || seoConfig.defaultKeywords;
  
  // Rimuovi lo slash finale se presente per evitare doppi slash, a meno che non sia esattamente '/'
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const currentUrl = `${seoConfig.siteUrl}${cleanPath === '/' ? '' : cleanPath}`;

  return (
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={currentUrl} />
      <meta property="twitter:title" content={metaTitle} />
      <meta property="twitter:description" content={metaDescription} />
    </Helmet>
  );
}
