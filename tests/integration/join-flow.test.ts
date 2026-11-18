// Guest Join Flow Integration Tests

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';

const adminClient = createClient(supabaseUrl, serviceKey);

describe('Guest Join Flow', () => {
  let testWeddingId: string;
  let testHostId: string;

  beforeAll(async () => {
    // Create test host
    const { data: authData } = await adminClient.auth.admin.createUser({
      email: `join-test-host-${Date.now()}@example.com`,
      password: 'testpassword',
      email_confirm: true,
    });
    testHostId = authData.user.id;

    // Create test wedding
    const { data: wedding } = await adminClient
      .from('weddings')
      .insert({
        slug: `join-test-${Date.now()}`,
        host_id: testHostId,
        name: 'Join Test Wedding',
        date: '2025-12-31',
        theme: {},
      })
      .select()
      .single();
    testWeddingId = wedding.id;

    await adminClient.from('wedding_hosts').insert({
      wedding_id: testWeddingId,
      user_id: testHostId,
      role: 'owner',
    });
  });

  afterAll(async () => {
    await adminClient.from('weddings').delete().eq('id', testWeddingId);
    await adminClient.auth.admin.deleteUser(testHostId);
  });

  it('creates new guest session on first join', async () => {
    const deviceId = 'join-test-device-' + Date.now();

    const { data, error } = await adminClient
      .rpc('join_wedding', {
        p_wedding_id: testWeddingId,
        p_name: 'New Guest',
        p_phone: '+15551234567',
        p_device_id: deviceId,
      })
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.id).toBeDefined();
    expect(data.session_token).toBeDefined();
    expect(data.session_token.length).toBeGreaterThan(20);

    // Verify guest record
    const { data: guest } = await adminClient
      .from('guests')
      .select('*')
      .eq('id', data.id)
      .single();

    expect(guest).toBeDefined();
    expect(guest?.name).toBe('New Guest');
    expect(guest?.phone).toBe('+15551234567');
    expect(guest?.device_id).toBe(deviceId);
    expect(guest?.session_token).toBe(data.session_token);
  });

  it('updates existing guest session on re-join', async () => {
    const deviceId = 'join-test-device-' + Date.now();

    // First join
    const { data: firstJoin } = await adminClient
      .rpc('join_wedding', {
        p_wedding_id: testWeddingId,
        p_name: 'First Name',
        p_phone: '',
        p_device_id: deviceId,
      })
      .single();

    expect(firstJoin).toBeDefined();

    // Second join with different name
    const { data: secondJoin } = await adminClient
      .rpc('join_wedding', {
        p_wedding_id: testWeddingId,
        p_name: 'Updated Name',
        p_phone: '+15559999999',
        p_device_id: deviceId,
      })
      .single();

    expect(secondJoin).toBeDefined();
    expect(secondJoin.id).toBe(firstJoin.id); // Same guest ID
    expect(secondJoin.session_token).not.toBe(firstJoin.session_token); // New token

    // Verify updated record
    const { data: guest } = await adminClient
      .from('guests')
      .select('*')
      .eq('id', firstJoin.id)
      .single();

    expect(guest?.name).toBe('Updated Name');
    expect(guest?.phone).toBe('+15559999999');
  });

  it('validates required fields', async () => {
    // Missing name
    const { error } = await adminClient
      .rpc('join_wedding', {
        p_wedding_id: testWeddingId,
        p_name: '',
        p_phone: '',
        p_device_id: 'test-device-validation',
      });

    expect(error).toBeDefined();
  });

  it('rejects join for non-existent wedding', async () => {
    const { error } = await adminClient
      .rpc('join_wedding', {
        p_wedding_id: '00000000-0000-0000-0000-000000000000',
        p_name: 'Test Guest',
        p_phone: '',
        p_device_id: 'test-device-nonexistent',
      });

    expect(error).toBeDefined();
  });
});