const fs = require('fs');
const path = require('path');

async function generateRoutes() {
  const apiUrls = [
    process.env.PUBLIC_API_URL,
    process.env.BASE_API_URL,
    'https://georesinstore.netlify.app/api',
    'https://georesinstore-api.onrender.com'
  ].filter(Boolean);

  let products = [];
  let successUrl = null;

  for (const baseUrl of apiUrls) {
    try {
      const cleanBaseUrl = baseUrl.replace(/\/$/, '');
      const url = `${cleanBaseUrl}/products?limit=250`;
      console.log(`Fetching products from: ${url}`);
      
      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        if (json && Array.isArray(json.data)) {
          products = json.data;
          successUrl = url;
          console.log(`Successfully fetched ${products.length} products.`);
          break;
        }
      } else {
        console.warn(`Fetch returned status ${response.status} from ${baseUrl}`);
      }
    } catch (error) {
      console.error(`Failed to fetch from ${baseUrl}:`, error.message);
    }
  }

  // Base routes that should be prerendered
  const routes = [
    '/',
    '/welcome',
    '/admin-login',
    '/admin',
    '/admin/categories',
    '/admin/categories/new',
    '/admin/config',
    '/admin/delivery-zones',
    '/admin/delivery-zones/new',
    '/admin/invoice',
    '/admin/option-groups',
    '/admin/option-groups/new',
    '/admin/orders',
    '/admin/products',
    '/admin/products/new',
    '/admin/variants',
    '/admin/variants/new',
    '/store',
    '/store/cart',
    '/store/checkout',
    '/store/orders/lookup',
    '/store/products',
    '/store/returns'
  ];

  // Add dynamic product detail routes
  if (products.length > 0) {
    products.forEach(product => {
      if (product.slug && product.isActive !== false) {
        routes.push(`/store/products/${product.slug}`);
      }
    });

    // Save fetched products to cache for server-side compilation
    const cacheFilePath = path.join(__dirname, 'prerender-products.json');
    fs.writeFileSync(cacheFilePath, JSON.stringify(products), 'utf8');
    console.log(`Saved product cache to ${cacheFilePath}`);
  } else {
    console.warn('No products found or all API requests failed. Prerendering only static routes.');
  }

  const routesFilePath = path.join(__dirname, 'routes.txt');
  fs.writeFileSync(routesFilePath, routes.join('\n'), 'utf8');
  console.log(`Saved product routes to ${routesFilePath}`);
}

generateRoutes().catch(err => {
  console.error('Critical error in routes generation:', err);
  // Do not fail the build if API is down, just write basic routes
  const routesFilePath = path.join(__dirname, 'routes.txt');
  const fallbackRoutes = [
    '/',
    '/welcome',
    '/admin-login',
    '/store',
    '/store/products',
    '/store/cart',
    '/store/checkout',
    '/store/returns'
  ];
  fs.writeFileSync(routesFilePath, fallbackRoutes.join('\n'), 'utf8');
});
