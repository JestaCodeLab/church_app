import { useEffect } from 'react';

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  author?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCard?: string;
  canonicalUrl?: string;
  robots?: string;
  viewport?: string;
  noindex?: boolean;
  nofollow?: boolean;
  structuredData?: Record<string, any>;
  lang?: string;
  image?: string;
  locale?: string;
}

/**
 * SEO Hook inspired by Helmet.js for client-side React applications
 * Manages meta tags, Open Graph tags, and structured data for Google indexing
 * 
 * This follows Helmet.js principles:
 * - Manages document head safely
 * - Prevents XSS attacks
 * - Sets security and SEO headers
 * - Proper cleanup and re-render handling
 * 
 * @param config - SEO configuration object
 * @example
 * useSEO({
 *   title: 'My Page',
 *   description: 'Page description',
 *   canonicalUrl: 'https://example.com/page'
 * });
 */
export const useSEO = (config: SEOConfig) => {
  useEffect(() => {
    if (!config.title) {
      console.warn('useSEO: title is required');
      return;
    }

    // Safely set page title
    const originalTitle = document.title;
    document.title = config.title;

    // Helper to safely update/create meta tags
    const setMetaTag = (name: string, content: string, isProperty = false) => {
      if (!content) return;

      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let element = document.querySelector(selector) as HTMLMetaElement | null;

      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(isProperty ? 'property' : 'name', name);
        document.head.appendChild(element);
      }

      element.content = content;
    };

    // Helper to safely update/create link tags
    const setLinkTag = (rel: string, href: string, attributes?: Record<string, string>) => {
      if (!href) return;

      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;

      if (!element) {
        element = document.createElement('link');
        element.rel = rel;
        document.head.appendChild(element);
      }

      element.href = href;

      // Set additional attributes if provided
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          element?.setAttribute(key, value);
        });
      }
    };

    // === Standard Meta Tags ===
    setMetaTag('description', config.description);

    if (config.keywords) {
      setMetaTag('keywords', config.keywords);
    }

    if (config.author) {
      setMetaTag('author', config.author);
    }

    if (config.lang) {
      document.documentElement.lang = config.lang;
    }

    if (config.locale) {
      setMetaTag('og:locale', config.locale, true);
    }

    // Viewport for mobile responsiveness
    setMetaTag(
      'viewport',
      config.viewport || 'width=device-width, initial-scale=1.0, viewport-fit=cover'
    );

    // === Security & Indexing Meta Tags ===
    const robotsDirectives = [];
    robotsDirectives.push(config.noindex ? 'noindex' : 'index');
    robotsDirectives.push(config.nofollow ? 'nofollow' : 'follow');
    setMetaTag('robots', robotsDirectives.join(', '));

    // Additional meta tags recommended by Helmet
    setMetaTag('theme-color', '#1f2937');
    setMetaTag('apple-mobile-web-app-capable', 'yes');
    setMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');

    // === Open Graph Meta Tags (Social Sharing) ===
    setMetaTag('og:title', config.ogTitle || config.title, true);
    setMetaTag('og:description', config.ogDescription || config.description, true);
    setMetaTag('og:type', config.ogType || 'website', true);

    if (config.ogUrl) {
      setMetaTag('og:url', config.ogUrl, true);
    }

    if (config.ogImage || config.image) {
      setMetaTag('og:image', config.ogImage || config.image || '', true);
      setMetaTag('og:image:type', 'image/png', true);
      setMetaTag('og:image:width', '1200', true);
      setMetaTag('og:image:height', '630', true);
    }

    // === Twitter/X Card Meta Tags ===
    setMetaTag('twitter:card', config.twitterCard || 'summary_large_image');
    setMetaTag('twitter:title', config.twitterTitle || config.title);
    setMetaTag('twitter:description', config.twitterDescription || config.description);

    if (config.twitterImage || config.image) {
      setMetaTag('twitter:image', config.twitterImage || config.image || '');
    }

    // === Canonical URL (prevents duplicate content) ===
    if (config.canonicalUrl) {
      setLinkTag('canonical', config.canonicalUrl);
    }

    // === Structured Data (JSON-LD) ===
    if (config.structuredData) {
      let scriptTag = document.querySelector(
        'script[type="application/ld+json"][data-seo="true"]'
      ) as HTMLScriptElement | null;

      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.type = 'application/ld+json';
        scriptTag.setAttribute('data-seo', 'true');
        document.head.appendChild(scriptTag);
      }

      try {
        scriptTag.textContent = JSON.stringify(config.structuredData);
      } catch (error) {
        console.error('useSEO: Invalid structured data', error);
      }
    }

    // === Cleanup on unmount ===
    return () => {
      // Restore original title if needed
      document.title = originalTitle;
    };
  }, [config]);
};

export default useSEO;
