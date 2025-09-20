import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bootstrap from './main.server';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');

const app = express();
const commonEngine = new CommonEngine();

// Basic health
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Robots.txt
app.get('/robots.txt', (req, res) => {
  const host = req.headers.host;
  const base = `https://${host}`;
  const content = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    `Sitemap: ${base}/sitemap.xml`
  ].join('\n');
  res.setHeader('Content-Type', 'text/plain');
  res.send(content);
});

// Sitemap.xml (products + core pages)
app.get('/sitemap.xml', async (req, res) => {
  try {
    const host = req.headers.host;
    const base = `https://${host}`;
    // Core static routes
    const urls: { loc: string; changefreq?: string; priority?: number; lastmod?: string }[] = [
      { loc: `${base}/`, priority: 1.0, changefreq: 'daily' },
      { loc: `${base}/store`, priority: 0.9, changefreq: 'daily' },
      { loc: `${base}/store/products`, priority: 0.8, changefreq: 'daily' },
      { loc: `${base}/store/cart`, priority: 0.3, changefreq: 'weekly' },
      { loc: `${base}/store/orders/lookup`, priority: 0.4, changefreq: 'weekly' }
    ];

    // Fetch product slugs from API (paginate until exhausted or max limit)
    const apiBase = process.env['PUBLIC_API_URL'] || process.env['BASE_API_URL'] || '';
    if (apiBase) {
      let page = 1;
      const limit = 100; // large page to reduce calls
      const maxPages = 10; // safety cap
      while (page <= maxPages) {
        const resp = await fetch(`${apiBase}/products?page=${page}&limit=${limit}`);
        if (!resp.ok) break;
        const json: any = await resp.json();
        if (Array.isArray(json.data)) {
          for (const p of json.data) {
            if (p?.slug && p?.isActive !== false) {
              urls.push({
                loc: `${base}/store/products/${p.slug}`,
                changefreq: 'weekly',
                priority: 0.7,
                lastmod: p.updatedAt || p.createdAt || new Date().toISOString()
              });
            }
          }
          if (json.data.length < limit) break; // no more pages
        } else {
          break;
        }
        page++;
      }
    }

    const xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
    for (const u of urls) {
      xml.push('<url>');
      xml.push(`<loc>${u.loc}</loc>`);
      if (u.lastmod) xml.push(`<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>`);
      if (u.changefreq) xml.push(`<changefreq>${u.changefreq}</changefreq>`);
      if (typeof u.priority === 'number') xml.push(`<priority>${u.priority.toFixed(1)}</priority>`);
      xml.push('</url>');
    }
    xml.push('</urlset>');
    res.setHeader('Content-Type', 'application/xml');
    res.send(xml.join(''));
  } catch (e) {
    res.status(500).send('');
  }
});

/**
 * Serve static files from /browser
 */
app.get(
  '**',
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html'
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.get('**', (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers } = req;

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
    })
    .then((html) => res.send(html))
    .catch((err) => next(err));
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    // console.log(`Node Express server listening on http://localhost:${port}`);
  });
}
