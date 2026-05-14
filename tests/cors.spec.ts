import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

const originalFrontendUrl = process.env.FRONTEND_URL;
const originalFrontendUrls = process.env.FRONTEND_URLS;

async function importAppWithOrigins(frontendUrls: string, frontendUrl?: string) {
  vi.resetModules();
  process.env.FRONTEND_URLS = frontendUrls;

  if (frontendUrl === undefined) {
    delete process.env.FRONTEND_URL;
  } else {
    process.env.FRONTEND_URL = frontendUrl;
  }

  return import('../src/app.js');
}

describe('CORS configuration', () => {
  afterEach(() => {
    vi.resetModules();

    if (originalFrontendUrl === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = originalFrontendUrl;
    }

    if (originalFrontendUrls === undefined) {
      delete process.env.FRONTEND_URLS;
    } else {
      process.env.FRONTEND_URLS = originalFrontendUrls;
    }
  });

  it('allows an explicitly configured local frontend origin in preflight requests', async () => {
    const { app } = await importAppWithOrigins(
      'http://localhost:3003, https://entreggo.vercel.app',
    );

    const response = await request(app)
      .options('/api/auth/register/courier')
      .set('Origin', 'http://localhost:3003')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3003');
  });

  it('keeps supporting the legacy FRONTEND_URL variable', async () => {
    const { app } = await importAppWithOrigins('', 'https://entreggo.vercel.app');

    const response = await request(app)
      .options('/api/auth/register/store')
      .set('Origin', 'https://entreggo.vercel.app')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBe('https://entreggo.vercel.app');
  });

  it('does not emit CORS allow-origin for unknown browser origins', async () => {
    const { app } = await importAppWithOrigins('https://entreggo.vercel.app');

    const response = await request(app)
      .options('/api/auth/register/courier')
      .set('Origin', 'http://localhost:3999')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
