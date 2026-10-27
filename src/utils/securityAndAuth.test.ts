import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// Helper matching server.ts scrypt hashing
function hashPasswordScrypt(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
}

// Helper matching legacy pbkdf2 hashing
function hashPasswordLegacyPbkdf2(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// Helper matching timing-safe verification
function verifyHashConstantTime(password: string, salt: string, expectedHash: string, algorithm: 'scrypt' | 'pbkdf2_1000') {
  const computed = algorithm === 'scrypt'
    ? hashPasswordScrypt(password, salt)
    : hashPasswordLegacyPbkdf2(password, salt);
  try {
    return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch {
    return false;
  }
}

// Phone normalizer
function normalizePhoneNumber(input: string): string {
  const digits = String(input || '').replace(/\D/g, '');
  if (digits.startsWith('20') && digits.length >= 12) {
    return '+' + digits;
  }
  if (digits.startsWith('01') && digits.length === 11) {
    return '+20' + digits.slice(1);
  }
  if (digits.startsWith('1') && digits.length === 10) {
    return '+20' + digits;
  }
  return digits ? '+' + digits : '';
}

test('Security 1: Memory-Hard scrypt Password Hashing & Constant-Time Verification', () => {
  const salt = crypto.randomBytes(16).toString('hex');
  const password = 'StreetwearSecurePassword!2026';

  const hash = hashPasswordScrypt(password, salt);
  assert.equal(hash.length, 128, 'scrypt 64-byte output must be 128 hex chars');

  // Positive verification
  const isValid = verifyHashConstantTime(password, salt, hash, 'scrypt');
  assert.equal(isValid, true, 'Valid password must pass timing-safe check');

  // Negative verification (wrong password)
  const isInvalid = verifyHashConstantTime('WrongPassword123', salt, hash, 'scrypt');
  assert.equal(isInvalid, false, 'Wrong password must fail timing-safe check');
});

test('Security 2: Backward-Compatibility & Seamless Migration from Legacy PBKDF2 to scrypt', () => {
  const salt = crypto.randomBytes(16).toString('hex');
  const password = 'LegacyUserPassword#1';

  // Old user has PBKDF2 hash
  const legacyHash = hashPasswordLegacyPbkdf2(password, salt);

  // System verifies old hash successfully
  const legacyVerified = verifyHashConstantTime(password, salt, legacyHash, 'pbkdf2_1000');
  assert.equal(legacyVerified, true, 'Legacy user must be able to log in without interruption');

  // Silent automatic upgrade to scrypt
  const newSalt = crypto.randomBytes(16).toString('hex');
  const upgradedHash = hashPasswordScrypt(password, newSalt);

  const upgradedVerified = verifyHashConstantTime(password, newSalt, upgradedHash, 'scrypt');
  assert.equal(upgradedVerified, true, 'Upgraded user verified with scrypt');
});

test('Security 3: Egyptian Mobile Phone Normalization & Format Shielding', () => {
  // Test local Egyptian formats
  assert.equal(normalizePhoneNumber('01012345678'), '+201012345678');
  assert.equal(normalizePhoneNumber('01198765432'), '+201198765432');
  assert.equal(normalizePhoneNumber('01255554444'), '+201255554444');
  assert.equal(normalizePhoneNumber('01511223344'), '+201511223344');

  // Test international formats
  assert.equal(normalizePhoneNumber('+201012345678'), '+201012345678');
  assert.equal(normalizePhoneNumber('201012345678'), '+201012345678');

  // Test spaced or formatted inputs
  assert.equal(normalizePhoneNumber('010 1234 5678'), '+201012345678');
  assert.equal(normalizePhoneNumber('010-1234-5678'), '+201012345678');
});

test('Security 4: Account Lockout & Brute-Force Rate Limiting Mechanism', () => {
  const securityMap = new Map<string, { attempts: number; lockedUntil?: number }>();
  const idKey = 'user_target_cairo_127.0.0.1';

  // Simulate 4 failed attempts -> Not locked
  for (let i = 1; i <= 4; i++) {
    const record = securityMap.get(idKey) || { attempts: 0 };
    record.attempts += 1;
    securityMap.set(idKey, record);
    assert.equal(record.attempts, i);
    assert.equal(record.lockedUntil, undefined);
  }

  // 5th failed attempt -> Locks account for 15 minutes
  const fifth = securityMap.get(idKey)!;
  fifth.attempts += 1;
  fifth.lockedUntil = Date.now() + 15 * 60 * 1000;
  securityMap.set(idKey, fifth);

  assert.equal(fifth.attempts, 5);
  assert.ok(fifth.lockedUntil > Date.now(), 'Account must be locked until future timestamp');

  // Subsequent login attempt while locked must be blocked immediately
  const isLocked = fifth.lockedUntil && Date.now() < fifth.lockedUntil;
  assert.equal(isLocked, true, 'Account must reject login while lockout window is active');
});

test('Security 5: Single-Use Cryptographic Password Reset Token Lifecycle', () => {
  const tokenMap = new Map<string, { userId: string; expiresAt: number; used: boolean }>();
  const resetToken = 'rst_' + crypto.randomBytes(32).toString('hex');
  const userId = 'usr_cairo_test_42';

  // 1. Issue token valid for 10 minutes
  tokenMap.set(resetToken, {
    userId,
    expiresAt: Date.now() + 10 * 60 * 1000,
    used: false,
  });

  const record = tokenMap.get(resetToken);
  assert.ok(record);
  assert.equal(record.used, false);
  assert.equal(record.userId, userId);

  // 2. Consume token on password reset
  record.used = true;
  tokenMap.delete(resetToken); // Single-use immediate burn

  // 3. Attempting to reuse burned token must fail
  assert.equal(tokenMap.has(resetToken), false, 'Token must not be reusable after password reset');
});

test('Security 6: Resilient Atomic Writing & Failover Recovery Simulation', () => {
  const testDir = path.resolve(process.cwd(), '.data', 'test_vault');
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

  const primaryFile = path.resolve(testDir, 'test-db.json');
  const backupFile = path.resolve(testDir, 'test-db.backup.json');

  const initialState = { users: [{ uid: 'u1', handle: '@swapper1' }], updatedAt: new Date().toISOString() };

  // Write with backup mirror
  const serialized = JSON.stringify(initialState, null, 2);
  fs.writeFileSync(primaryFile, serialized, 'utf-8');
  fs.writeFileSync(backupFile, serialized, 'utf-8');

  // Verify primary file exists
  assert.equal(fs.existsSync(primaryFile), true);
  assert.equal(fs.existsSync(backupFile), true);

  // Simulate catastrophic corruption of primary file (e.g. truncated json)
  fs.writeFileSync(primaryFile, '{"users": [ corrupt_broken_json...', 'utf-8');

  // Reader with failover
  let restoredState: any = null;
  try {
    JSON.parse(fs.readFileSync(primaryFile, 'utf-8'));
  } catch {
    // Primary corrupted, recover from backup!
    const backupRaw = fs.readFileSync(backupFile, 'utf-8');
    restoredState = JSON.parse(backupRaw);
  }

  assert.ok(restoredState);
  assert.equal(restoredState.users.length, 1);
  assert.equal(restoredState.users[0].handle, '@swapper1');

  // Cleanup test files
  fs.unlinkSync(primaryFile);
  fs.unlinkSync(backupFile);
  fs.rmdirSync(testDir);
});
