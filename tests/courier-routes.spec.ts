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

const activeCourierUser: DomainUser = {
  id: '44444444-4444-4444-8444-444444444444',
  auth_id: 'auth-courier',
  email: 'courier@example.com',
  role: 'motoboy',
  status: 'ativo',
  approved_at: '2026-05-14T00:00:00.000Z',
  approved_by: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  created_at: '2026-05-14T00:00:00.000Z',
  updated_at: '2026-05-14T00:00:00.000Z',
};

const activeStoreUser: DomainUser = {
  ...activeCourierUser,
  id: '11111111-1111-4111-8111-111111111111',
  auth_id: 'auth-store',
  email: 'store@example.com',
  role: 'logista',
};

const pendingCourierUser: DomainUser = {
  ...activeCourierUser,
  id: '55555555-5555-4555-8555-555555555555',
  auth_id: 'auth-pending-courier',
  status: 'pendente',
  approved_at: null,
  approved_by: null,
};

const blockedCourierUser: DomainUser = {
  ...activeCourierUser,
  id: '66666666-6666-4666-8666-666666666666',
  auth_id: 'auth-blocked-courier',
  status: 'bloqueado',
};

const courierStatus = {
  id: '99999999-9999-4999-8999-999999999999',
  user_id: activeCourierUser.id,
  is_online: false,
  updated_at: '2026-05-16T12:00:00.000Z',
};

const updatedCourierStatus = {
  ...courierStatus,
  is_online: true,
  updated_at: '2026-05-16T12:01:00.000Z',
};

const notFoundResult = {
  data: null,
  error: {
    message: 'not found',
  },
};

const createSelectSingleTable = (result: unknown) => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      single: vi.fn().mockResolvedValue(result),
    })),
  })),
});

const createCourierStatusTable = ({
  selectResult,
  updateResult,
}: {
  selectResult: { data: unknown; error: unknown };
  updateResult?: { data: unknown; error: unknown };
}) => {
  const updateSingle = vi.fn().mockResolvedValue(updateResult ?? selectResult);
  const updateSelect = vi.fn(() => ({
    single: updateSingle,
  }));
  const updateEq = vi.fn(() => ({
    select: updateSelect,
  }));
  const updateBuilder = {
    eq: updateEq,
  };

  const selectSingle = vi.fn().mockResolvedValue(selectResult);
  const selectEq = vi.fn(() => ({
    single: selectSingle,
  }));

  return {
    select: vi.fn(() => ({
      eq: selectEq,
    })),
    update: vi.fn(() => updateBuilder),
    updateBuilder,
    updateEq,
    updateSelect,
    updateSingle,
    selectEq,
    selectSingle,
  };
};

const mockAuthenticatedUser = (domainUser: DomainUser, tables: Record<string, unknown> = {}) => {
  supabaseMock.getUser.mockResolvedValue({
    data: {
      user: {
        id: domainUser.auth_id,
      },
    },
    error: null,
  });

  const usersTable = createSelectSingleTable({
    data: domainUser,
    error: null,
  });

  supabaseMock.from.mockImplementation((table: string) => {
    if (table === 'users') {
      return usersTable;
    }

    return tables[table] ?? createSelectSingleTable(notFoundResult);
  });

  return usersTable;
};

describe('Fatia 3 courier operational status', () => {
  beforeEach(() => {
    supabaseMock.getUser.mockReset();
    supabaseMock.from.mockReset();
  });

  it('rejects status lookup without a bearer token', async () => {
    const response = await request(app).get('/api/couriers/me/status').expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'AUTH_REQUIRED' },
    });
  });

  it('rejects status lookup with an invalid token', async () => {
    supabaseMock.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'invalid' },
    });

    const response = await request(app)
      .get('/api/couriers/me/status')
      .set('Authorization', 'Bearer bad-token')
      .expect(401);

    expect(response.body.error.code).toBe('INVALID_TOKEN');
  });

  it('rejects status lookup when the authenticated account has no domain user', async () => {
    supabaseMock.getUser.mockResolvedValue({
      data: { user: { id: 'auth-missing-domain' } },
      error: null,
    });
    supabaseMock.from.mockReturnValue(createSelectSingleTable(notFoundResult));

    const response = await request(app)
      .get('/api/couriers/me/status')
      .set('Authorization', 'Bearer tok')
      .expect(403);

    expect(response.body.error.code).toBe('DOMAIN_USER_NOT_FOUND');
  });

  it.each([
    [pendingCourierUser, 'USER_PENDING'],
    [blockedCourierUser, 'USER_BLOCKED'],
  ])('rejects status lookup for courier users with status %s', async (domainUser, code) => {
    mockAuthenticatedUser(domainUser);

    const response = await request(app)
      .get('/api/couriers/me/status')
      .set('Authorization', 'Bearer tok')
      .expect(403);

    expect(response.body.error.code).toBe(code);
  });

  it('rejects status lookup from non-couriers', async () => {
    mockAuthenticatedUser(activeStoreUser);

    const response = await request(app)
      .get('/api/couriers/me/status')
      .set('Authorization', 'Bearer tok')
      .expect(403);

    expect(response.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  it('requires a courier profile before returning status', async () => {
    mockAuthenticatedUser(activeCourierUser, {
      couriers: createSelectSingleTable(notFoundResult),
    });

    const response = await request(app)
      .get('/api/couriers/me/status')
      .set('Authorization', 'Bearer tok')
      .expect(403);

    expect(response.body.error.code).toBe('COURIER_PROFILE_REQUIRED');
  });

  it('rejects unknown query parameters on status lookup', async () => {
    const courierTable = createCourierStatusTable({
      selectResult: { data: courierStatus, error: null },
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: courierTable,
    });

    const response = await request(app)
      .get('/api/couriers/me/status?courier_id=forbidden')
      .set('Authorization', 'Bearer tok')
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(courierTable.select).not.toHaveBeenCalled();
  });

  it('returns only the authenticated courier operational status', async () => {
    const courierTable = createCourierStatusTable({
      selectResult: { data: courierStatus, error: null },
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: courierTable,
    });

    const response = await request(app)
      .get('/api/couriers/me/status')
      .set('Authorization', 'Bearer tok')
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        is_online: false,
        updated_at: courierStatus.updated_at,
      },
    });
    expect(JSON.stringify(response.body.data)).not.toContain('id');
    expect(JSON.stringify(response.body.data)).not.toContain('user_id');
    expect(courierTable.select).toHaveBeenCalledWith('id,user_id,is_online,updated_at');
    expect(courierTable.selectEq).toHaveBeenCalledWith('user_id', activeCourierUser.id);
  });

  it('rejects invalid status update payloads', async () => {
    const courierTable = createCourierStatusTable({
      selectResult: { data: courierStatus, error: null },
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: courierTable,
    });

    const response = await request(app)
      .patch('/api/couriers/me/status')
      .set('Authorization', 'Bearer tok')
      .send({ is_online: true })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(courierTable.update).not.toHaveBeenCalled();
  });

  it('updates only the authenticated courier operational status', async () => {
    const courierTable = createCourierStatusTable({
      selectResult: { data: courierStatus, error: null },
      updateResult: { data: updatedCourierStatus, error: null },
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: courierTable,
    });

    const response = await request(app)
      .patch('/api/couriers/me/status')
      .set('Authorization', 'Bearer tok')
      .send({ isOnline: true })
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        is_online: true,
        updated_at: updatedCourierStatus.updated_at,
      },
    });
    expect(JSON.stringify(response.body.data)).not.toContain('id');
    expect(JSON.stringify(response.body.data)).not.toContain('user_id');
    expect(courierTable.update).toHaveBeenCalledWith({ is_online: true });
    expect(courierTable.updateEq).toHaveBeenCalledWith('id', courierStatus.id);
    expect(courierTable.updateSelect).toHaveBeenCalledWith('id,user_id,is_online,updated_at');
  });

  it('returns a standardized error when status update fails', async () => {
    const courierTable = createCourierStatusTable({
      selectResult: { data: courierStatus, error: null },
      updateResult: { data: null, error: { message: 'update failed' } },
    });
    mockAuthenticatedUser(activeCourierUser, {
      couriers: courierTable,
    });

    const response = await request(app)
      .patch('/api/couriers/me/status')
      .set('Authorization', 'Bearer tok')
      .send({ isOnline: true })
      .expect(500);

    expect(response.body.error.code).toBe('COURIER_STATUS_UPDATE_FAILED');
  });
});
