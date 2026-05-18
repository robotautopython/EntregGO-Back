import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  broadcastDeliveryAccepted,
  broadcastDeliveryCreated,
  broadcastDeliveryStatusChanged,
  DELIVERY_ACCEPTED_EVENT,
  DELIVERY_AVAILABLE_TOPIC,
  DELIVERY_CREATED_EVENT,
  DELIVERY_STATUS_CHANGED_EVENT,
  REALTIME_BROADCAST_TIMEOUT_MS,
} from '../src/services/realtime-broadcast.service.js';

const makeSupabaseMock = () => {
  const httpSend = vi.fn().mockResolvedValue({ success: true });
  const channel = vi.fn(() => ({ httpSend }));
  const setAuth = vi.fn().mockResolvedValue(undefined);

  return {
    supabase: {
      realtime: { setAuth },
      channel,
    },
    channel,
    httpSend,
    setAuth,
  };
};

const delivery = {
  id: '66666666-6666-4666-8666-666666666666',
  status: 'aceita' as const,
  updated_at: '2026-05-18T12:00:00.000Z',
  store_id: 'store-private',
  courier_id: 'courier-private',
  destination_address: 'Rua privada',
  notes: 'Observacao privada',
  couriers: {
    full_name: 'Motoboy Teste',
  },
};

describe('realtime broadcast service', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalSupabaseUrl = process.env.SUPABASE_URL;

  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test';
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey;
    process.env.SUPABASE_URL = originalSupabaseUrl;
  });

  it('broadcasts delivery.created to the available private topic with a whitelisted payload', async () => {
    const mock = makeSupabaseMock();
    await broadcastDeliveryCreated(
      { id: delivery.id, status: 'aguardando', updated_at: delivery.updated_at },
      mock.supabase as never,
    );

    expect(mock.setAuth).toHaveBeenCalledWith('service-role-test');
    expect(mock.channel).toHaveBeenCalledWith(DELIVERY_AVAILABLE_TOPIC, {
      config: { private: true },
    });
    expect(mock.httpSend).toHaveBeenCalledWith(
      DELIVERY_CREATED_EVENT,
      {
        deliveryId: delivery.id,
        status: 'aguardando',
        updatedAt: delivery.updated_at,
      },
      { timeout: REALTIME_BROADCAST_TIMEOUT_MS },
    );
  });

  it('broadcasts store detail events on delivery-specific private topics', async () => {
    const acceptedMock = makeSupabaseMock();
    await broadcastDeliveryAccepted(delivery, acceptedMock.supabase as never);

    expect(acceptedMock.channel).toHaveBeenCalledWith(`delivery:${delivery.id}`, {
      config: { private: true },
    });
    expect(acceptedMock.httpSend).toHaveBeenCalledWith(
      DELIVERY_ACCEPTED_EVENT,
      {
        deliveryId: delivery.id,
        status: 'aceita',
        updatedAt: delivery.updated_at,
      },
      { timeout: REALTIME_BROADCAST_TIMEOUT_MS },
    );

    const statusMock = makeSupabaseMock();
    await broadcastDeliveryStatusChanged(
      { id: delivery.id, status: 'em_transito', updated_at: delivery.updated_at },
      statusMock.supabase as never,
    );

    expect(statusMock.channel).toHaveBeenCalledWith(`delivery:${delivery.id}`, {
      config: { private: true },
    });
    expect(statusMock.httpSend).toHaveBeenCalledWith(
      DELIVERY_STATUS_CHANGED_EVENT,
      {
        deliveryId: delivery.id,
        status: 'em_transito',
        updatedAt: delivery.updated_at,
      },
      { timeout: REALTIME_BROADCAST_TIMEOUT_MS },
    );
  });

  it('does not leak PII or internal ids in the broadcast payload or logs', async () => {
    const mock = makeSupabaseMock();
    await broadcastDeliveryAccepted(delivery, mock.supabase as never);

    const sentPayload = mock.httpSend.mock.calls[0][1] as Record<string, unknown>;
    expect(sentPayload).toEqual({
      deliveryId: delivery.id,
      status: 'aceita',
      updatedAt: delivery.updated_at,
    });
    expect(JSON.stringify(sentPayload)).not.toMatch(
      /store_id|courier_id|user_id|auth_id|email|phone|full_name|destination_address|notes|service-role/i,
    );

    const logPayload = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(logPayload).toEqual({
      event: DELIVERY_ACCEPTED_EVENT,
      delivery_id: delivery.id,
      result: 'success',
    });
  });

  it('captures broadcast failures without throwing', async () => {
    const mock = makeSupabaseMock();
    mock.httpSend.mockRejectedValueOnce(new Error('network down'));

    await expect(
      broadcastDeliveryCreated(delivery, mock.supabase as never),
    ).resolves.toBeUndefined();

    const logPayload = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(logPayload).toEqual({
      event: DELIVERY_CREATED_EVENT,
      delivery_id: delivery.id,
      result: 'failed',
    });
  });

  it('skips statuses outside the M-10A payload whitelist', async () => {
    const mock = makeSupabaseMock();
    await broadcastDeliveryStatusChanged(
      { id: delivery.id, status: 'cancelada', updated_at: delivery.updated_at },
      mock.supabase as never,
    );

    expect(mock.httpSend).not.toHaveBeenCalled();
    expect(JSON.parse(consoleLogSpy.mock.calls[0][0] as string)).toEqual({
      event: DELIVERY_STATUS_CHANGED_EVENT,
      delivery_id: delivery.id,
      result: 'skipped',
    });
  });
});
