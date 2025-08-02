import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';

const { comparePasswords } = await import('./auth.ts');

test('comparePasswords returns false for malformed stored strings', async () => {
  const result = await comparePasswords('password', 'invalid');
  assert.equal(result, false);
});

test('comparePasswords returns false when stored has too many parts', async () => {
  const result = await comparePasswords('password', 'a.b.c');
  assert.equal(result, false);
});
