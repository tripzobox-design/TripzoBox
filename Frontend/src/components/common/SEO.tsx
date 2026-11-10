import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  noIndex?: boolean;
  structuredData?: Record<string, any> | Array<Record<string, any>>;
}

const DEFAULT_TITLE = 'TripzoBox — Connect, Plan Trips & Discover Places Together';
const DEFAULT_DESCRIPTION =
  'TripzoBox brings verified travellers together. Discover curated destinations, join shared travel groups, secure documents offline in your Travel Vault, and record memories in your Travel Diary.';
const DEFAULT_OG_IMAGE = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=85';
const BASE_DOMAIN = 'https://tripzobox.com';

export const SEO: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noIndex = false,
  structuredData,
}) => {
  const location = useLocation();

  useEffect(() => {
    // 1. Page Title
    const fullTitle = title ? `${title} | TripzoBox` : DEFAULT_TITLE;
    document.title = fullTitle;

    // Helper to update or create meta tags
    const setMeta = (nameAttr: 'name' | 'property', attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${nameAttr}="${attrValue}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(nameAttr, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Standard Meta
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    // 3. Canonical URL
    const canonicalUrl = canonical || `${BASE_DOMAIN}${location.pathname}`;
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // 4. Open Graph Meta Tags
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:image', ogImage);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:site_name', 'TripzoBox');

    // 5. Twitter Card Meta Tags
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', ogImage);

    // 6. JSON-LD Structured Data
    const defaultSchema = [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'TripzoBox',
        url: BASE_DOMAIN,
        logo: `${BASE_DOMAIN}/logo.png`,
        description: DEFAULT_DESCRIPTION,
        sameAs: [
          'https://twitter.com/tripzobox',
          'https://instagram.com/tripzobox',
          'https://facebook.com/tripzobox',
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'TripzoBox',
        url: BASE_DOMAIN,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${BASE_DOMAIN}/trips?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ];

    const finalSchema = structuredData
      ? Array.isArray(structuredData)
        ? [...defaultSchema, ...structuredData]
        : [...defaultSchema, structuredData]
      : defaultSchema;

    let scriptTag = document.querySelector('script[id="tripzobox-jsonld"]') as HTMLScriptElement;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'tripzobox-jsonld';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(finalSchema);
  }, [title, description, canonical, ogImage, ogType, noIndex, structuredData, location.pathname]);

  return null;
};

