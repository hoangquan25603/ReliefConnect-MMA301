import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateQrMatrix } from '../src/lib/qr.ts';

test('generateQrMatrix generates valid square boolean matrix', () => {
  const matrix = generateQrMatrix('RELIEF:REQ:123');
  assert.ok(Array.isArray(matrix));
  assert.ok(matrix.length >= 21); // Version 1 is at least 21x21
  assert.equal(matrix.length, matrix[0].length);

  // Check finder patterns at (0,0), (0, max-7), (max-7, 0)
  // Top-left center at (3,3) should be dark (true)
  assert.equal(matrix[3][3], true);
  // (0,0) should be dark
  assert.equal(matrix[0][0], true);
  // (0,1) should be dark
  assert.equal(matrix[0][1], true);
});

test('generateQrMatrix generates different matrices for different data', () => {
  const m1 = generateQrMatrix('RELIEF:REQ:1');
  const m2 = generateQrMatrix('RELIEF:REQ:2');
  assert.notDeepEqual(m1, m2);
});
