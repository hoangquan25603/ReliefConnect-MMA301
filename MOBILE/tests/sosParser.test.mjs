import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSosMessage } from '../src/lib/sosParser.ts';

test('parseSosMessage extracts phone number correctly', () => {
  const text1 = 'Cứu với! Nhà ngập quá. Gọi 0905123456 giúp em với!';
  const res1 = parseSosMessage(text1);
  assert.equal(res1.contactPhone, '0905123456');

  const text2 = 'Liên hệ: +84988 567 890, gia đình 4 người';
  const res2 = parseSosMessage(text2);
  assert.equal(res2.contactPhone, '0988567890');
});

test('parseSosMessage detects people count and urgency', () => {
  const text = 'Gia đình 5 người đang trèo lên mái nhà, nước ngập sâu sắp chìm! Cần cano cứu nạn gấp. SĐT 0912345678';
  const res = parseSosMessage(text);
  assert.equal(res.affectedPeople, '5');
  assert.equal(res.emergencyLevel, '3');
  assert.equal(res.contactPhone, '0912345678');
  assert.ok(res.detectedNeeds.some(n => n.includes('Chỗ ở')));
});

test('parseSosMessage extracts location and region', () => {
  const text = 'Địa chỉ tại số 45 đường Lê Duẩn, Đà Nẵng. Cần 10 thùng mì tôm và nước sạch. 4 người. LH 0935111222';
  const res = parseSosMessage(text);
  assert.equal(res.region, 'Đà Nẵng');
  assert.ok(res.address.includes('Lê Duẩn') || res.address.includes('Đà Nẵng'));
  assert.equal(res.foodQuantity, '10');
  assert.ok(res.detectedNeeds.includes('Lương thực'));
  assert.ok(res.detectedNeeds.includes('Nước sạch'));
});

test('parseSosMessage handles minimal text safely', () => {
  const res = parseSosMessage('Cần giúp đỡ');
  assert.equal(res.affectedPeople, '1');
  assert.equal(res.emergencyLevel, '1');
  assert.ok(res.title.startsWith('[SOS]'));
});
