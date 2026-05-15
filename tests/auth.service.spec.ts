import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { registerCourier, registerStore } from '../src/services/auth.service.js';
import type { CourierProfile, DomainUser, StoreProfile } from '../src/types/domain.js';

const domainUser: DomainUser = {
  id: '11111111-1111-4111-8111-111111111111',
  auth_id: 'auth-user-1',
  email: 'owner@example.com',
  role: 'logista',
  status: 'pendente',
  approved_at: null,
  approved_by: null,
  created_at: '2026-05-14T00:00:00.000Z',
  updated_at: '2026-05-14T00:00:00.000Z',
};

const storeProfile: StoreProfile = {
  id: '22222222-2222-4222-8222-222222222222',
  user_id: domainUser.id,
  name: 'Loja Teste',
  owner_name: 'Pessoa Teste',
  address: 'Rua Teste, 123',
  logo_url: null,
  description: null,
  created_at: '2026-05-14T00:00:00.000Z',
  updated_at: '2026-05-14T00:00:00.000Z',
};

const courierProfile: CourierProfile = {
  id: '33333333-3333-4333-8333-333333333333',
  user_id: domainUser.id,
  full_name: 'Motoboy Teste',
  bike_photo_url: null,
  license_photo_url: null,
  is_online: false,
  created_at: '2026-05-14T00:00:00.000Z',
  updated_at: '2026-05-14T00:00:00.000Z',
};

const createSingleResultTable = (result: unknown) => ({
  insert: vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn().mockResolvedValue(result),
    })),
  })),
});

const createSupabaseMock = (tables: Record<string, unknown>) => {
  const createUser = vi.fn().mockResolvedValue({
    data: {
      user: {
        id: 'auth-user-1',
      },
    },
    error: null,
  });
  const deleteUser = vi.fn().mockResolvedValue({
    data: {},
    error: null,
  });
  const from = vi.fn((table: string) => tables[table]);

  return {
    client: {
      auth: {
        admin: {
          createUser,
          deleteUser,
        },
      },
      from,
    } as unknown as SupabaseClient,
    createUser,
    deleteUser,
    from,
  };
};

describe('auth service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates Supabase Auth, domain user and store profile with mocked Supabase only', async () => {
    const usersTable = createSingleResultTable({ data: domainUser, error: null });
    const storesTable = createSingleResultTable({ data: storeProfile, error: null });
    const supabase = createSupabaseMock({
      users: usersTable,
      stores: storesTable,
    });

    const result = await registerStore(
      {
        email: 'OWNER@EXAMPLE.COM',
        password: 'valid-password',
        store: {
          name: 'Loja Teste',
          ownerName: 'Pessoa Teste',
          address: 'Rua Teste, 123',
        },
      },
      supabase.client,
    );

    expect(result.user.status).toBe('pendente');
    expect(result.profile).toEqual(storeProfile);
    expect(supabase.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'owner@example.com',
        email_confirm: true,
        password: 'valid-password',
        user_metadata: {
          role: 'logista',
        },
      }),
    );
    expect(supabase.from).toHaveBeenCalledWith('users');
    expect(supabase.from).toHaveBeenCalledWith('stores');
  });

  it('creates Supabase Auth, domain user and courier profile with mocked Supabase only', async () => {
    const usersTable = createSingleResultTable({
      data: {
        ...domainUser,
        role: 'motoboy',
      },
      error: null,
    });
    const couriersTable = createSingleResultTable({ data: courierProfile, error: null });
    const supabase = createSupabaseMock({
      users: usersTable,
      couriers: couriersTable,
    });

    const result = await registerCourier(
      {
        email: 'courier@example.com',
        password: 'valid-password',
        courier: {
          fullName: 'Motoboy Teste',
        },
      },
      supabase.client,
    );

    expect(result.user.role).toBe('motoboy');
    expect(result.profile).toEqual(courierProfile);
    expect(supabase.from).toHaveBeenCalledWith('couriers');
  });

  it('attempts Auth compensation when store profile creation fails', async () => {
    const usersTable = createSingleResultTable({ data: domainUser, error: null });
    const storesTable = createSingleResultTable({
      data: null,
      error: {
        message: 'mocked failure',
      },
    });
    const supabase = createSupabaseMock({
      users: usersTable,
      stores: storesTable,
    });

    await expect(
      registerStore(
        {
          email: 'owner@example.com',
          password: 'valid-password',
          store: {
            name: 'Loja Teste',
            ownerName: 'Pessoa Teste',
            address: 'Rua Teste, 123',
          },
        },
        supabase.client,
      ),
    ).rejects.toMatchObject({
      code: 'REGISTRATION_FAILED',
    });

    expect(supabase.deleteUser).toHaveBeenCalledWith('auth-user-1');
  });
});
