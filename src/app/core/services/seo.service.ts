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
  ) { }

  private defaults: SiteDefaults = {
    siteName: 'Geo Resin Store',
    baseUrl: 'https://www.georesinstore.com',
    defaultDescription: 'Premium resin materials, pigments, molds and artisan supplies. Discover quality products for epoxy and resin art projects.',
    defaultImage: 'https://www.georesinstore.com/hero-bg.png',
    twitterHandle: '@georesinstore'
  };

  setCanonical(path?: string) {
    if (!isPlatformBrowser(this.platformId)) return; // server will include rendered head; canonical safe but skip DOM duplication
    const href = (this.defaults.baseUrl.replace(/\/$/, '')) + (path || '/');
    let link: HTMLLinkElement | null = document.querySelector("link[rel='canonical']");
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  setTitle(value: string) {
    if (!value) return;
    const full = value.includes(this.defaults.siteName) ? value : `${value} | ${this.defaults.siteName}`;
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
    this.setTag({ property: 'og:site_name', content: this.defaults.siteName } as any);
    if (this.defaults.twitterHandle) {
      this.setTag({ name: 'twitter:site', content: this.defaults.twitterHandle });
      this.setTag({ name: 'twitter:creator', content: this.defaults.twitterHandle });
    }
  }

  setDefault(page?: { title?: string; description?: string; image?: string; path?: string; }) {
    const title = page?.title || this.defaults.siteName;
    const desc = page?.description || this.defaults.defaultDescription;
    const img = page?.image || this.defaults.defaultImage;
    const url = page?.path ? `${this.defaults.baseUrl.replace(/\/$/, '')}${page.path.startsWith('/') ? page.path : '/' + page.path}` : this.defaults.baseUrl;
    this.setOg({ title, description: desc, image: img, url, type: 'website' });
    this.setCanonical(page?.path || '/');
    this.setWebSiteStructuredData();
  }

  setProductStructuredData(product: { title: string; description?: string; image?: string; price?: number; currency?: string; slug?: string; }) {
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
    };
    if (product.image) data.image = product.image;
    if (product.price) {
      data.offers = {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: product.currency || 'NGN',
        availability: 'https://schema.org/InStock'
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
      url: this.defaults.baseUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${this.defaults.baseUrl}/store/products?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };
    script.textContent = JSON.stringify(data);
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
