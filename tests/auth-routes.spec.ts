import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DomainUser } from '../src/types/domain.js';

const supabaseMock = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
}));

vi.mock('../src/config/supabase.js', () => ({
  getSupabaseAdminClient: () => ({
    auth: {
      getUser: supabaseMock.getUser,
    },
    from: supabaseMock.from,
  }),
}));

const { app } = await import('../src/app.js');

const activeStoreUser: DomainUser = {
  id: '11111111-1111-4111-8111-111111111111',
  auth_id: 'auth-logista',
  email: 'store@example.com',
  role: 'logista',
  status: 'ativo',
  approved_at: '2026-05-14T00:00:00.000Z',
  approved_by: '22222222-2222-4222-8222-222222222222',
  created_at: '2026-05-14T00:00:00.000Z',
  updated_at: '2026-05-14T00:00:00.000Z',
};

describe('M-02A auth routes', () => {
  beforeEach(() => {
    supabaseMock.getUser.mockReset();
    supabaseMock.from.mockReset();
  });

  it('rejects invalid store registration payloads', async () => {
    const response = await request(app).post('/api/auth/register/store').send({}).expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid courier registration payloads', async () => {
    const response = await request(app).post('/api/auth/register/courier').send({}).expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects /api/auth/me without a bearer token', async () => {
    const response = await request(app).get('/api/auth/me').expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
      },
    });
  });

  it('rejects admin routes for authenticated non-admin users', async () => {
    supabaseMock.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'auth-logista',
        },
      },
      error: null,
    });
    supabaseMock.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: activeStoreUser,
            error: null,
          }),
        })),
      })),
    });

    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', 'Bearer test-token')
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('FORBIDDEN_ROLE');
    expect(supabaseMock.getUser).toHaveBeenCalledWith('test-token');
  });
});
