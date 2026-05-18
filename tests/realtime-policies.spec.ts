import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const migrationPath = join(
  process.cwd(),
  'supabase',
  'migrations',
  '20260518120000_m10a_realtime_broadcast_policies.sql',
);

const migrationSql = readFileSync(migrationPath, 'utf8');

describe('M-10A realtime policies migration', () => {
  it('creates select-only private broadcast policies on realtime.messages', () => {
    expect(migrationSql).toContain('alter table realtime.messages enable row level security');
    expect(migrationSql).toContain('grant select on realtime.messages to authenticated');
    expect(migrationSql).toContain('for select');
    expect(migrationSql).toContain("realtime.messages.extension = 'broadcast'");
    expect(migrationSql).toContain("= 'delivery:available'");
    expect(migrationSql).toContain('realtime_delivery_store_detail_select_m10a');
    expect(migrationSql).not.toMatch(/create policy[\s\S]*for insert[\s\S]*to authenticated/i);
    expect(migrationSql).toContain('revoke insert, update, delete on realtime.messages');
  });

  it('restricts delivery:available to active online couriers', () => {
    expect(migrationSql).toContain("public.current_domain_user_role() = 'motoboy'");
    expect(migrationSql).toContain("public.current_domain_user_status() = 'ativo'");
    expect(migrationSql).toContain('from public.couriers c');
    expect(migrationSql).toContain('c.user_id = public.current_domain_user_id()');
    expect(migrationSql).toContain('c.is_online = true');
  });

  it('validates delivery-specific topics before casting to uuid', () => {
    const uuidTopicRegex =
      '^delivery:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

    expect(migrationSql).toContain(uuidTopicRegex);
    expect(migrationSql).toContain('case');
    expect(migrationSql.indexOf(uuidTopicRegex)).toBeLessThan(migrationSql.indexOf('::uuid'));
  });

  it('restricts delivery-specific topics to active owner stores only', () => {
    expect(migrationSql).toContain("public.current_domain_user_role() = 'logista'");
    expect(migrationSql).toContain("public.current_domain_user_status() = 'ativo'");
    expect(migrationSql).toContain('from public.delivery_requests dr');
    expect(migrationSql).toContain('join public.stores s on s.id = dr.store_id');
    expect(migrationSql).toContain('s.user_id = public.current_domain_user_id()');
  });
});
