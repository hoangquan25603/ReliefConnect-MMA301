import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatVoucherText } from '../src/lib/voucher.ts';

test('formatVoucherText generates well-formatted receipt', () => {
  const voucher = formatVoucherText({
    id: 42,
    title: 'Cứu hộ gia đình ngập sâu',
    address: '12 Trưng Nữ Vương',
    region: 'Đà Nẵng',
    contactPhone: '0905123456',
    status: 'Approved',
    affectedPeople: 4,
    emergencyLevel: 3,
    inventoryIssues: [
      { category: 'Food', requestedQuantity: 10, issuedQuantity: 10 },
      { category: 'Water', requestedQuantity: 20, issuedQuantity: 15, reason: 'Kho còn 15 bình' },
    ],
  });

  assert.ok(voucher.includes('#VOUCHER-42'));
  assert.ok(voucher.includes('12 Trưng Nữ Vương'));
  assert.ok(voucher.includes('Đà Nẵng'));
  assert.ok(voucher.includes('0905123456'));
  assert.ok(voucher.includes('Lương thực'));
  assert.ok(voucher.includes('Nước sạch'));
  assert.ok(voucher.includes('Kho còn 15 bình'));
  assert.ok(voucher.includes('RELIEF:REQ:42'));
});
