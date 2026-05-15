import type { SupabaseClient, User } from '@supabase/supabase-js';

import { getSupabaseAdminClient } from '../config/supabase.js';
import type { CourierProfile, DomainUser, StoreProfile } from '../types/domain.js';
import { ApiError } from '../utils/errors.js';
import type { RegisterCourierInput, RegisterStoreInput } from '../validators/auth.validators.js';

const domainUserSelect =
  'id,auth_id,email,role,status,approved_at,approved_by,created_at,updated_at';
const storeSelect = 'id,user_id,name,owner_name,address,logo_url,description,created_at,updated_at';
const courierSelect =
  'id,user_id,full_name,bike_photo_url,license_photo_url,is_online,created_at,updated_at';

export interface RegistrationResult<TProfile> {
  user: DomainUser;
  profile: TProfile;
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const createAuthUser = async (
  supabase: SupabaseClient,
  email: string,
  password: string,
  role: 'logista' | 'motoboy',
): Promise<User> => {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role,
    },
  });

  if (error || !data.user) {
    throw new ApiError(409, 'REGISTRATION_REJECTED', 'Cadastro nao pode ser concluido');
  }

  return data.user;
};

const deleteAuthUserBestEffort = async (supabase: SupabaseClient, authUserId: string) => {
  try {
    await supabase.auth.admin.deleteUser(authUserId);
  } catch {
    // Best-effort compensation only. Do not log auth identifiers or secrets here.
  }
};

const createDomainUser = async (
  supabase: SupabaseClient,
  authUser: User,
  email: string,
  role: 'logista' | 'motoboy',
): Promise<DomainUser> => {
  const { data, error } = await supabase
    .from('users')
    .insert({
      auth_id: authUser.id,
      email,
      role,
      status: 'pendente',
    })
    .select(domainUserSelect)
    .single<DomainUser>();

  if (error || !data) {
    throw new ApiError(500, 'DOMAIN_USER_CREATE_FAILED', 'Cadastro de dominio falhou');
  }

  return data;
};

export const registerStore = async (
  input: RegisterStoreInput,
  supabase: SupabaseClient = getSupabaseAdminClient(),
): Promise<RegistrationResult<StoreProfile>> => {
  const email = normalizeEmail(input.email);
  const authUser = await createAuthUser(supabase, email, input.password, 'logista');

  try {
    const user = await createDomainUser(supabase, authUser, email, 'logista');
    const { data: profile, error } = await supabase
      .from('stores')
      .insert({
        user_id: user.id,
        name: input.store.name,
        owner_name: input.store.ownerName,
        address: input.store.address,
        description: input.store.description ?? null,
      })
      .select(storeSelect)
      .single<StoreProfile>();

    if (error || !profile) {
      throw new ApiError(500, 'STORE_PROFILE_CREATE_FAILED', 'Cadastro de loja falhou');
    }

    return { user, profile };
  } catch (error) {
    await deleteAuthUserBestEffort(supabase, authUser.id);

    if (error instanceof ApiError) {
      throw new ApiError(500, 'REGISTRATION_FAILED', 'Cadastro nao pode ser concluido');
    }

    throw error;
  }
};

export const registerCourier = async (
  input: RegisterCourierInput,
  supabase: SupabaseClient = getSupabaseAdminClient(),
): Promise<RegistrationResult<CourierProfile>> => {
  const email = normalizeEmail(input.email);
  const authUser = await createAuthUser(supabase, email, input.password, 'motoboy');

  try {
    const user = await createDomainUser(supabase, authUser, email, 'motoboy');
    const { data: profile, error } = await supabase
      .from('couriers')
      .insert({
        user_id: user.id,
        full_name: input.courier.fullName,
      })
      .select(courierSelect)
      .single<CourierProfile>();

    if (error || !profile) {
      throw new ApiError(500, 'COURIER_PROFILE_CREATE_FAILED', 'Cadastro de motoboy falhou');
    }

    return { user, profile };
  } catch (error) {
    await deleteAuthUserBestEffort(supabase, authUser.id);

    if (error instanceof ApiError) {
      throw new ApiError(500, 'REGISTRATION_FAILED', 'Cadastro nao pode ser concluido');
    }

    throw error;
  }
};
