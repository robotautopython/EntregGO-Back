import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseAdminClient } from '../config/supabase.js';
import type { DeliveryRequest } from '../types/domain.js';
import { ApiError } from '../utils/errors.js';
import type { CreateDeliveryInput } from '../validators/delivery.validators.js';

const storeOwnershipSelect = 'id,user_id';
const deliveryRequestSelect =
  'id,store_id,destination_address,notes,status,courier_id,created_at,expires_at,accepted_at,collected_at,in_transit_at,delivered_at,updated_at';

interface StoreOwnership {
  id: string;
  user_id: string;
}

const normalizeOptionalText = (value: string | undefined): string | null => {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
};

export const createDelivery = async (
  input: CreateDeliveryInput,
  domainUserId: string,
  supabase: SupabaseClient = getSupabaseAdminClient(),
): Promise<DeliveryRequest> => {
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select(storeOwnershipSelect)
    .eq('user_id', domainUserId)
    .single<StoreOwnership>();

  if (storeError || !store) {
    throw new ApiError(403, 'STORE_PROFILE_REQUIRED', 'Perfil de loja nao encontrado');
  }

  const destinationAddress = normalizeOptionalText(input.destinationAddress);
  const notes = normalizeOptionalText(input.notes);
  const { data, error } = await supabase
    .from('delivery_requests')
    .insert({
      store_id: store.id,
      destination_address: destinationAddress,
      notes,
    })
    .select(deliveryRequestSelect)
    .single<DeliveryRequest>();

  if (error || !data) {
    throw new ApiError(500, 'DELIVERY_CREATE_FAILED', 'Solicitacao de entrega nao pode ser criada');
  }

  return data;
};
