import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Title, Meta, MetaDefinition } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';

export interface OgConfig {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

interface SiteDefaults {
  siteName: string;
  baseUrl: string;
  defaultDescription: string;
  defaultImage: string;
  twitterHandle?: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  constructor(
    private title: Title,
    private meta: Meta,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  private defaults: SiteDefaults = {
    siteName: 'Geo Resin Store',
    baseUrl: 'https://www.georesinstore.com',
    defaultDescription:
      "Shop Nigeria's #1 trusted store for crystal clear epoxy resin, UV resin, silicone molds, and pigments. Fast delivery to Lagos, Abuja, PH & nationwide. Best prices for art & woodworking supplies.",
    defaultImage: 'https://www.georesinstore.com/hero-bg.png',
    twitterHandle: '@georesinstore',
  };

  setCanonical(path?: string) {
    if (!isPlatformBrowser(this.platformId)) return; // server will include rendered head; canonical safe but skip DOM duplication
    const href = this.defaults.baseUrl.replace(/\/$/, '') + (path || '/');
    let link: HTMLLinkElement | null = document.querySelector(
      "link[rel='canonical']",
    );
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  setTitle(value: string) {
    if (!value) return;
    const full = value.includes(this.defaults.siteName)
      ? value
      : `${value} | ${this.defaults.siteName}`;
    this.title.setTitle(full);
    this.setTag({ name: 'og:title', content: full });
    this.setTag({ property: 'og:title', content: full } as any);
    this.setTag({ name: 'twitter:title', content: full });
  }

  setDescription(desc: string) {
    if (!desc) return;
    this.setTag({ name: 'description', content: desc });
    this.setTag({ name: 'og:description', content: desc });
    this.setTag({ property: 'og:description', content: desc } as any);
    this.setTag({ name: 'twitter:description', content: desc });
  }

  setOg(cfg: OgConfig) {
    if (cfg.title) this.setTitle(cfg.title);
    if (cfg.description) this.setDescription(cfg.description);
    if (cfg.image) {
      this.setTag({ name: 'og:image', content: cfg.image });
      this.setTag({ property: 'og:image', content: cfg.image } as any);
      this.setTag({ name: 'twitter:image', content: cfg.image });
      this.setTag({ name: 'twitter:card', content: 'summary_large_image' });
    }
    if (cfg.url) {
      this.setTag({ name: 'og:url', content: cfg.url });
      this.setTag({ property: 'og:url', content: cfg.url } as any);
    }
    this.setTag({ name: 'og:type', content: cfg.type || 'website' });
    this.setTag({ property: 'og:type', content: cfg.type || 'website' } as any);
    this.setTag({ name: 'og:site_name', content: this.defaults.siteName });
    this.setTag({
      property: 'og:site_name',
      content: this.defaults.siteName,
    } as any);
    if (this.defaults.twitterHandle) {
      this.setTag({
        name: 'twitter:site',
        content: this.defaults.twitterHandle,
      });
      this.setTag({
        name: 'twitter:creator',
        content: this.defaults.twitterHandle,
      });
    }
  }

  setDefault(page?: {
    title?: string;
    description?: string;
    image?: string;
    path?: string;
  }) {
    const title = page?.title || this.defaults.siteName;
    const desc = page?.description || this.defaults.defaultDescription;
    const img = page?.image || this.defaults.defaultImage;
    const url = page?.path
      ? `${this.defaults.baseUrl.replace(/\/$/, '')}${
          page.path.startsWith('/') ? page.path : '/' + page.path
        }`
      : this.defaults.baseUrl;
    this.setOg({ title, description: desc, image: img, url, type: 'website' });
    this.setCanonical(page?.path || '/');
    this.setWebSiteStructuredData();
  }

  setProductStructuredData(product: {
    title: string;
    description?: string;
    image?: string;
    price?: number;
    currency?: string;
    slug?: string;
    category?: string;
    brand?: string;
    sku?: string;
  }) {
    if (!isPlatformBrowser(this.platformId)) return;
    const id = 'structured-data-product';
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    const data: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description: product.description || '',
      brand: {
        '@type': 'Brand',
        name: product.brand || 'Geo Resin Store',
      },
      category: product.category || 'Resin Materials',
      sku: product.sku || product.slug || '',
    };
    if (product.image) {
      data.image = [product.image];
    }
    if (product.price) {
      data.offers = {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: product.currency || 'NGN',
        availability: 'https://schema.org/InStock',
        url: `${this.defaults.baseUrl}/store/products/${product.slug}`,
        seller: {
          '@type': 'Organization',
          name: 'Geo Resin Store',
        },
      };
    }
    script.textContent = JSON.stringify(data);
  }

  private setWebSiteStructuredData() {
    if (!isPlatformBrowser(this.platformId)) return;
    const id = 'structured-data-website';
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    const data = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: this.defaults.siteName,
      alternateName: 'GeoResinStore',
      url: this.defaults.baseUrl,
      description: this.defaults.defaultDescription,
      inLanguage: 'en-NG',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${this.defaults.baseUrl}/store/products?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
      publisher: {
        '@type': 'Organization',
        name: this.defaults.siteName,
        logo: {
          '@type': 'ImageObject',
          url: `${this.defaults.baseUrl}/logo.png`,
        },
      },
    };
    script.textContent = JSON.stringify(data);
  }

  setLocalBusinessStructuredData() {
    if (!isPlatformBrowser(this.platformId)) return;
    const id = 'structured-data-local-business';
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Store',
      name: this.defaults.siteName,
      description: this.defaults.defaultDescription,
      url: this.defaults.baseUrl,
      telephone: '+234 705 071 3289',
      email: 'info@georesinstore.com',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'Nigeria',
        addressRegion: 'Lagos',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: '6.5244',
        longitude: '3.3792',
      },
      openingHours: ['Mo-Fr 09:00-18:00', 'Sa 09:00-16:00'],
      paymentAccepted: ['Cash', 'Credit Card', 'Bank Transfer'],
      currenciesAccepted: 'NGN',
      priceRange: '$$',
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Resin Materials Catalog',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Product',
              name: 'Epoxy Resin',
              category: 'Resin Materials',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Product',
              name: 'UV Resin',
              category: 'Resin Materials',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Product',
              name: 'Resin Pigments',
              category: 'Art Supplies',
            },
          },
        ],
      },
    };
    script.textContent = JSON.stringify(data);
  }

  setBreadcrumbStructuredData(breadcrumbs: { name: string; url: string }[]) {
    if (!isPlatformBrowser(this.platformId)) return;
    const id = 'structured-data-breadcrumb';
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    const data = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    };
    script.textContent = JSON.stringify(data);
  }

  setFAQStructuredData(faqs: { question: string; answer: string }[]) {
    if (!isPlatformBrowser(this.platformId)) return;
    const id = 'structured-data-faq';
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    const data = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
    script.textContent = JSON.stringify(data);
  }

  setKeywords(keywords: string[]) {
    const keywordString = keywords.join(', ');
    this.setTag({ name: 'keywords', content: keywordString });
  }

  setRobots(robots: string = 'index, follow') {
    this.setTag({ name: 'robots', content: robots });
    this.setTag({ name: 'googlebot', content: robots });
  }

  private setTag(def: MetaDefinition & { property?: string }) {
    if (!def.content) return;
    if (def.property) {
      // Remove potential old duplicates
      this.meta.updateTag(def, `property='${def.property}'`);
    } else if (def.name) {
      this.meta.updateTag(def, `name='${def.name}'`);
    }
  }
}
