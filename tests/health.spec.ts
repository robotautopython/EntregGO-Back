import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from '../src/app.js';

describe('GET /api/health', () => {
  it('returns the standard success contract', async () => {
    const response = await request(app).get('/api/health').expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        status: 'ok',
      },
      message: 'API online',
    });
  });
});
