// Vercel Serverless Function entry for Angular SSR
// This file is compiled by Vercel (ts-node like transpile) at deploy time.
// It loads the built Express app from the dist server bundle.

// Avoid importing @vercel/node types locally; Vercel provides the runtime types at deploy.

// The build places server output at dist/grs-frontend/server/server.mjs
// We dynamically import so cold starts only pay parsing cost once.
let cachedApp: any; // express.Application

async function getApp() {
  if (!cachedApp) {
    // Import ESM module dynamically
    const serverModule: any = await import('../dist/grs-frontend/server/server.mjs');
    // The build exports the express app as `app`
    cachedApp = serverModule.app || serverModule.default?.app || serverModule.default || serverModule;
    if (typeof cachedApp !== 'function') {
      throw new Error('Could not resolve Express app export from server bundle.');
    }
  }
  return cachedApp;
}

export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();
    // Express expects (req, res); Vercel provides Node's IncomingMessage/ServerResponse compatible objects
    return app(req, res);
  } catch (err: any) {
    console.error('SSR handler error', err);
    res.status(500).send('SSR Error');
  }
}
