import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseAdminClient } from '../config/supabase.js';
import { ApiError } from '../utils/errors.js';
import type { UpdateCourierStatusInput } from '../validators/courier.validators.js';

const courierStatusSelect = 'id,user_id,is_online,updated_at';

interface CourierStatusRow {
  id: string;
  user_id: string;
  is_online: boolean;
  updated_at: string;
}

export interface CourierOperationalStatus {
  is_online: boolean;
  updated_at: string;
}

const toCourierOperationalStatus = (row: CourierStatusRow): CourierOperationalStatus => ({
  is_online: row.is_online,
  updated_at: row.updated_at,
});

const resolveCourierStatus = async (
  domainUserId: string,
  supabase: SupabaseClient,
): Promise<CourierStatusRow> => {
  const { data, error } = await supabase
    .from('couriers')
    .select(courierStatusSelect)
    .eq('user_id', domainUserId)
    .single<CourierStatusRow>();

  if (error || !data) {
    throw new ApiError(403, 'COURIER_PROFILE_REQUIRED', 'Perfil de motoboy nao encontrado');
  }

  return data;
};

export const getCourierOperationalStatus = async (
  domainUserId: string,
  supabase: SupabaseClient = getSupabaseAdminClient(),
): Promise<CourierOperationalStatus> => {
  const courier = await resolveCourierStatus(domainUserId, supabase);

  return toCourierOperationalStatus(courier);
};

export const updateCourierOperationalStatus = async (
  input: UpdateCourierStatusInput,
  domainUserId: string,
  supabase: SupabaseClient = getSupabaseAdminClient(),
): Promise<CourierOperationalStatus> => {
  const courier = await resolveCourierStatus(domainUserId, supabase);

  const { data, error } = await supabase
    .from('couriers')
    .update({
      is_online: input.isOnline,
    })
    .eq('id', courier.id)
    .select(courierStatusSelect)
    .single<CourierStatusRow>();

  if (error || !data) {
    throw new ApiError(500, 'COURIER_STATUS_UPDATE_FAILED', 'Status do motoboy nao foi atualizado');
  }

  return toCourierOperationalStatus(data);
};
