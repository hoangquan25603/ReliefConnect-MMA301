// Run only against an isolated Development database: node tests/workflow-smoke.mjs http://127.0.0.1:5093/api
// This intentionally creates test data. Never point it at a shared or production database.
import assert from 'node:assert/strict';
import { inflateRawSync } from 'node:zlib';

const base = process.argv[2] || 'http://127.0.0.1:5093/api';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+\/api$/.test(base)) throw new Error('Smoke tests require a loopback test API.');
const stamp = Date.now().toString(36);
const password = 'Relief@123456';
let checks = 0;
const results = [];
async function api(path, { token, method = 'GET', body, expect = 200, binary = false } = {}) {
  const response = await fetch(base + path, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  if (binary && response.status === expect) { checks++; return new Uint8Array(await response.arrayBuffer()); }
  const text = await response.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  assert.equal(response.status, expect, `${method} ${path}: ${JSON.stringify(data)}`); checks++;
  return data?.isSuccess === true ? data.result : data;
}
async function login(email) { return (await api('/auth/login', { method: 'POST', body: { email, password } })).accessToken; }
async function register(name) { return api('/auth/register', { method: 'POST', body: { email: `${name}.${stamp}@example.test`, fullName: `Smoke ${name}`, password, confirmPassword: password, phoneNumber: '0901234567' } }); }
async function section(name, fn) { await fn(); results.push(name); console.log(`PASS ${name}`); }
function assertXlsx(bytes) {
  const zip = Buffer.from(bytes); const entries = new Map();
  for (let p = 0; p + 46 < zip.length; p++) {
    if (zip.readUInt32LE(p) !== 0x02014b50) continue;
    const method = zip.readUInt16LE(p + 10), size = zip.readUInt32LE(p + 20), nameLen = zip.readUInt16LE(p + 28);
    const name = zip.subarray(p + 46, p + 46 + nameLen).toString(); const offset = zip.readUInt32LE(p + 42);
    const start = offset + 30 + zip.readUInt16LE(offset + 26) + zip.readUInt16LE(offset + 28);
    const body = zip.subarray(start, start + size); entries.set(name, (method === 8 ? inflateRawSync(body) : body).toString());
  }
  for (const required of ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/worksheets/sheet1.xml']) assert.ok(entries.has(required), `XLSX missing ${required}`);
  assert.match(entries.get('xl/worksheets/sheet1.xml'), /<sheetData>/);
  assert.match(entries.get('xl/worksheets/sheet1.xml'), /t="inlineStr"/);
  assert.ok(!entries.get('xl/worksheets/sheet1.xml').includes('<f>'), 'untrusted fields must never become Excel formulas');
}

const admin = await login('admin@relief.local');
const warehouse = await login('warehouse@relief.local');
const org = await login('organization@relief.local');
const volunteer = await login('volunteer@relief.local');
const owner = await register('owner');
const stranger = await register('stranger');
let item, wh, request, completedRequest, donation, assignment;
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aVb8AAAAASUVORK5CYII=';
const requestBody = { title: `Smoke cứu trợ ${stamp}`, description: 'Cần lương thực do mưa lớn, dùng cho kiểm thử tự động.', address: 'Địa chỉ thử nghiệm', region: 'Đà Nẵng', latitude: 16.05, longitude: 108.2, emergencyLevel: 2, affectedPeople: 5, needFood: true, needWater: false, needMedicine: false, needBlanket: false, needShelter: false, foodQuantity: 7, contactPhone: '0901234567', photoDataUrl: png };

await section('authorization, input validation and photo persistence', async () => {
  await api('/relief-requests', { expect: 401 });
  await api('/admin/volunteers', { token: owner.accessToken, expect: 403 });
  await api('/relief-requests', { token: owner.accessToken, method: 'POST', body: { ...requestBody, latitude: 91 }, expect: 400 });
  await api('/relief-requests', { token: owner.accessToken, method: 'POST', body: { ...requestBody, photoDataUrl: 'data:image/svg+xml;base64,PHN2Zz4=' }, expect: 400 });
  await api('/relief-requests', { token: owner.accessToken, method: 'POST', body: { ...requestBody, photoDataUrl: 'data:image/png;base64,SGVsbG9Xb3JsZA==' }, expect: 400 });
  await api('/relief-requests', { token: owner.accessToken, method: 'POST', body: { ...requestBody, photoDataUrl: 'data:image/png;base64,' + Buffer.alloc(1048577, 1).toString('base64') }, expect: 400 });
  request = (await api('/relief-requests', { token: owner.accessToken, method: 'POST', body: requestBody, expect: 201 })).id;
  const saved = await api(`/relief-requests/${request}`, { token: owner.accessToken });
  assert.equal(saved.photoDataUrl, png); assert.equal(saved.status, 'Pending');
  await api(`/relief-requests/${request}`, { token: stranger.accessToken, expect: 404 });
  await api(`/relief-requests/${request}/status`, { token: stranger.accessToken, method: 'PUT', body: { status: 'Cancelled' }, expect: 403 });
});

await section('request approval reserves stock once, cancellation restores stock once', async () => {
  wh = (await api('/warehouses', { token: admin, method: 'POST', body: { name: `Smoke warehouse ${stamp}`, address: 'Test', latitude: 16, longitude: 108 } })).id;
  item = (await api('/inventory-items', { token: warehouse, method: 'POST', body: { warehouseId: wh, itemName: `Smoke rice ${stamp}`, unit: 'kg', minimumQuantity: 2, category: 'Food' } })).id;
  await api(`/inventory-items/${item}/stock-in`, { token: warehouse, method: 'POST', body: { quantity: 20, referenceNo: 'SMOKE' } });
  await api(`/relief-requests/${request}/status`, { token: owner.accessToken, method: 'PUT', body: { status: 'Approved', targetHeadcount: 1 }, expect: 403 });
  await api(`/relief-requests/${request}/status`, { token: admin, method: 'PUT', body: { status: 'Approved' }, expect: 400 });
  const beforeItems = (await api('/inventory-items?pageSize=200', { token: admin })).items;
  const before = beforeItems.reduce((n, x) => n + (x.category === 'Food' ? x.quantity : 0), 0);
  const approval = await api(`/relief-requests/${request}/status`, { token: admin, method: 'PUT', body: { status: 'Approved', targetHeadcount: 1 } });
  assert.equal(approval.inventoryIssues[0].issuedQuantity, 7);
  assert.deepEqual((await api(`/relief-requests/${request}`, { token: admin })).inventoryIssues, approval.inventoryIssues);
  await api(`/relief-requests/${request}/status`, { token: admin, method: 'PUT', body: { status: 'Approved', targetHeadcount: 1 }, expect: 409 });
  const afterItems = (await api('/inventory-items?pageSize=200', { token: admin })).items;
  const reserved = afterItems.reduce((n, x) => n + (x.category === 'Food' ? x.quantity : 0), 0);
  assert.equal(reserved, before - 7);
  const allocatedStock = afterItems.find(x => beforeItems.some(b => b.id === x.id && b.quantity > x.quantity));
  assert.ok(allocatedStock, 'approval must create an identifiable stock reservation');
  const identity = { itemName: allocatedStock.itemName, unit: allocatedStock.unit, category: allocatedStock.category, minimumQuantity: allocatedStock.minimumQuantity };
  await api(`/inventory-items/${allocatedStock.id}`, { token: warehouse, method: 'PUT', body: { ...identity, itemName: 'Unsafe reserved item rename' }, expect: 400 });
  await api(`/inventory-items/${allocatedStock.id}`, { token: warehouse, method: 'PUT', body: { ...identity, category: 'Other' }, expect: 400 });
  await api(`/inventory-items/${allocatedStock.id}`, { token: warehouse, method: 'PUT', body: { ...identity, unit: 'hộp' }, expect: 400 });
  await api(`/inventory-items/${allocatedStock.id}`, { token: warehouse, method: 'PUT', body: { ...identity, minimumQuantity: identity.minimumQuantity + 1 } });
  await api(`/relief-requests/${request}/status`, { token: owner.accessToken, method: 'PUT', body: { status: 'Cancelled' } });
  await api(`/relief-requests/${request}/status`, { token: owner.accessToken, method: 'PUT', body: { status: 'Cancelled' }, expect: 409 });
  const restored = (await api('/inventory-items?pageSize=200', { token: admin })).items.reduce((n, x) => n + (x.category === 'Food' ? x.quantity : 0), 0);
  assert.equal(restored, before);
});

await section('open tasks enforce headcount, ownership and sequential progress', async () => {
  completedRequest = (await api('/relief-requests', { token: owner.accessToken, method: 'POST', body: { ...requestBody, needFood: false, photoDataUrl: null }, expect: 201 })).id;
  await api(`/relief-requests/${completedRequest}/status`, { token: admin, method: 'PUT', body: { status: 'Approved', targetHeadcount: 1 } });
  const open = (await api('/relief-requests/open-tasks', { token: volunteer })).items.find(x => x.id === completedRequest);
  assert.ok(open); assert.equal(open.address, requestBody.address); assert.equal(open.description, requestBody.description);
  assert.equal(open.latitude, requestBody.latitude); assert.equal(open.longitude, requestBody.longitude);
  const joined = await api(`/relief-requests/${completedRequest}/join`, { token: volunteer, method: 'POST' });
  assignment = joined.id;
  await api(`/relief-requests/${completedRequest}/join`, { token: volunteer, method: 'POST', expect: 409 });
  await api(`/assignments/${assignment}/status`, { token: stranger.accessToken, method: 'PUT', body: { status: 'OnTheWay' }, expect: 403 });
  await api(`/assignments/${assignment}/status`, { token: volunteer, method: 'PUT', body: { status: 'Completed' }, expect: 409 });
  await api(`/assignments/${assignment}/set-team-lead`, { token: admin, method: 'PUT' });
  assert.equal((await api(`/assignments/${assignment}`, { token: volunteer })).isTeamLead, true);
  await api(`/assignments/${assignment}/status`, { token: volunteer, method: 'PUT', body: { status: 'OnTheWay' } });
  await api(`/relief-requests/${completedRequest}/status`, { token: owner.accessToken, method: 'PUT', body: { status: 'Cancelled' }, expect: 409 });
  await api(`/assignments/${assignment}/status`, { token: volunteer, method: 'PUT', body: { status: 'Completed' } });
  assert.equal((await api(`/relief-requests/${completedRequest}`, { token: owner.accessToken })).status, 'Completed');
});

await section('volunteer profiles, catalog skills and admin approval', async () => {
  const profile = await api('/volunteers/profile', { token: stranger.accessToken, method: 'POST', body: { address: 'Test', latitude: 16, longitude: 108, experienceYears: 1, bio: 'Test' }, expect: 201 });
  await api('/volunteers/profile', { token: stranger.accessToken, method: 'POST', body: { address: 'Test', latitude: 16, longitude: 108, experienceYears: 1 }, expect: 409 });
  const skill = await api('/skills', { token: admin, method: 'POST', body: { name: `Smoke first aid ${stamp}`, description: 'Test skill' }, expect: 201 });
  await api('/skills', { token: admin, method: 'POST', body: { name: `Smoke first aid ${stamp}`, description: 'Test skill' }, expect: 409 });
  const added = await api('/volunteers/skills', { token: stranger.accessToken, method: 'POST', body: { skillIds: [skill.id, skill.id] } });
  assert.equal(added.addedCount, 1);
  await api(`/admin/volunteers/${profile.id}/approve`, { token: admin, method: 'PUT' });
  await api(`/admin/volunteers/${profile.id}/approve`, { token: admin, method: 'PUT', expect: 409 });
  assert.equal((await api('/auth/me', { token: stranger.accessToken })).role, 'Volunteer');
  await api(`/volunteers/skills/${skill.id}`, { token: stranger.accessToken, method: 'DELETE' });
  await api(`/skills/${skill.id}`, { token: admin, method: 'DELETE' });
});

await section('parallel claims reserve one slot, reviewed cancellations preserve dispatch history', async () => {
  const id = (await api('/relief-requests', { token: owner.accessToken, method: 'POST', body: { ...requestBody, needFood: false, photoDataUrl: null }, expect: 201 })).id;
  await api(`/relief-requests/${id}/status`, { token: admin, method: 'PUT', body: { status: 'Approved', targetHeadcount: 1 } });
  const contenders = [volunteer, stranger.accessToken];
  const claimed = await Promise.all(contenders.map(async token => {
    const response = await fetch(`${base}/relief-requests/${id}/join`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    return { token, status: response.status, body: await response.json() };
  }));
  assert.deepEqual(claimed.map(x => x.status).sort(), [200, 409]); checks += 2;
  const winner = claimed.find(x => x.status === 200);
  await api(`/assignments/${winner.body.id}/request-cancellation`, { token: winner.token, method: 'POST', body: { reason: 'Cannot attend' } });
  assert.ok((await api('/assignments/pending-cancellations', { token: admin })).some(a => a.id === winner.body.id));
  await api(`/assignments/${winner.body.id}/approve-cancellation`, { token: admin, method: 'PUT' });
  assert.equal((await api(`/relief-requests/${id}`, { token: owner.accessToken })).status, 'Approved');
  const rejoined = await api(`/relief-requests/${id}/join`, { token: winner.token, method: 'POST' });
  await api(`/assignments/${rejoined.id}/status`, { token: winner.token, method: 'PUT', body: { status: 'OnTheWay' } });
  await api(`/assignments/${rejoined.id}/request-cancellation`, { token: winner.token, method: 'POST', body: { reason: 'Vehicle breakdown' } });
  await api(`/assignments/${rejoined.id}/reject-cancellation`, { token: warehouse, method: 'PUT' });
  assert.equal((await api(`/assignments/${rejoined.id}`, { token: winner.token })).cancellationRequested, false);
  await api(`/assignments/${rejoined.id}/request-cancellation`, { token: winner.token, method: 'POST', body: { reason: 'Vehicle cannot proceed' } });
  await api(`/assignments/${rejoined.id}/approve-cancellation`, { token: warehouse, method: 'PUT' });
  await api(`/relief-requests/${id}/status`, { token: owner.accessToken, method: 'PUT', body: { status: 'Cancelled' }, expect: 409 });
  // Explicit admin assignment remains possible to replace a cancelled team member.
  const profile = await api('/volunteers/me', { token: winner.token });
  const manual = await api('/assignments', { token: warehouse, method: 'POST', body: { reliefRequestId: id, volunteerProfileId: profile.id, note: 'Replacement assignment' }, expect: 201 });
  await api(`/assignments/${manual.id}/status`, { token: winner.token, method: 'PUT', body: { status: 'Accepted' } });
  await api(`/assignments/${manual.id}/cancel`, { token: admin, method: 'PUT', body: { reason: 'Test cleanup' } });
});

await section('mixed inventory units require explicit manual allocation with durable warning', async () => {
  const mixed = (await api('/inventory-items', { token: warehouse, method: 'POST', body: { warehouseId: wh, itemName: `Smoke food boxes ${stamp}`, unit: 'hộp', minimumQuantity: 0, category: 'Food' } })).id;
  await api(`/inventory-items/${mixed}/stock-in`, { token: warehouse, method: 'POST', body: { quantity: 8 } });
  const id = (await api('/relief-requests', { token: owner.accessToken, method: 'POST', body: { ...requestBody, photoDataUrl: null }, expect: 201 })).id;
  const approved = await api(`/relief-requests/${id}/status`, { token: admin, method: 'PUT', body: { status: 'Approved', targetHeadcount: 1 } });
  assert.equal(approved.inventoryIssues[0].issuedQuantity, 0);
  assert.equal(approved.inventoryIssues[0].requiresManualAllocation, true);
  assert.match(approved.inventoryIssues[0].reason, /đơn vị/);
  assert.deepEqual((await api(`/relief-requests/${id}`, { token: admin })).inventoryIssues, approved.inventoryIssues);
  assert.equal((await api(`/inventory-items/${mixed}`, { token: admin })).quantity, 8);
  await api(`/relief-requests/${id}/status`, { token: owner.accessToken, method: 'PUT', body: { status: 'Cancelled' } });
});

await section('donation mapping is complete, atomic, unit-safe and single-use', async () => {
  donation = (await api('/donations', { token: org, method: 'POST', body: { note: 'Smoke', items: [{ itemName: 'Rice', unit: 'kg', quantity: 3 }, { itemName: 'New blanket', unit: 'cái', quantity: 4 }] }, expect: 201 })).id;
  await api('/donations/pending', { token: owner.accessToken, expect: 403 });
  const d = (await api('/donations/pending', { token: admin })).items.find(d => d.id === donation);
  const initial = (await api(`/inventory-items/${item}`, { token: admin })).quantity;
  await api(`/donations/${donation}/approve`, { token: admin, method: 'PUT', body: { itemMappings: [{ donationItemId: d.items[0].id, createNewItem: false, inventoryItemId: item }] }, expect: 400 });
  await api(`/donations/${donation}/approve`, { token: admin, method: 'PUT', body: { itemMappings: d.items.map(i => ({ donationItemId: i.id, createNewItem: false, inventoryItemId: item })) }, expect: 400 });
  assert.equal((await api(`/inventory-items/${item}`, { token: admin })).quantity, initial, 'failed second mapping must roll back first');
  const mappings = [{ donationItemId: d.items[0].id, createNewItem: false, inventoryItemId: item }, { donationItemId: d.items[1].id, createNewItem: true, warehouseId: wh }];
  await api(`/donations/${donation}/approve`, { token: warehouse, method: 'PUT', body: { itemMappings: mappings } });
  await api(`/donations/${donation}/approve`, { token: admin, method: 'PUT', body: { itemMappings: mappings }, expect: 409 });
  assert.equal((await api(`/inventory-items/${item}`, { token: admin })).quantity, initial + 3);
  assert.equal((await api('/donations/my', { token: org })).items.find(d => d.id === donation).status, 'Approved');
});

await section('role upgrades reject escalation and require admin review', async () => {
  await api('/role-requests', { token: owner.accessToken, method: 'POST', body: { requestedRoleName: 'Admin', reason: 'Test' }, expect: 400 });
  const role = await api('/role-requests', { token: owner.accessToken, method: 'POST', body: { requestedRoleName: 'Organization', reason: 'Test organization request' }, expect: 201 });
  await api('/role-requests', { token: owner.accessToken, method: 'POST', body: { requestedRoleName: 'Coordinator', reason: 'Duplicate' }, expect: 409 });
  await api(`/admin/role-requests/${role.id}/approve`, { token: owner.accessToken, method: 'PUT', expect: 403 });
  await api(`/admin/role-requests/${role.id}/approve`, { token: admin, method: 'PUT' });
  await api(`/admin/role-requests/${role.id}/approve`, { token: admin, method: 'PUT', expect: 409 });
  assert.equal((await api('/auth/me', { token: owner.accessToken })).role, 'Organization');
});

await section('notifications are private, reports valid XLSX, public data anonymized', async () => {
  const notices = (await api('/notifications', { token: owner.accessToken })).items;
  assert.ok(notices.length > 0);
  await api(`/notifications/${notices[0].id}/read`, { token: stranger.accessToken, method: 'PUT', expect: 404 });
  await api(`/notifications/${notices[0].id}/read`, { token: owner.accessToken, method: 'PUT' });
  await api('/notifications/read-all', { token: owner.accessToken, method: 'PUT' });
  assert.equal((await api('/notifications/unread-count', { token: owner.accessToken })).count, 0);
  for (const report of ['relief-requests', 'assignments', 'inventory']) {
    await api(`/reports/${report}/excel`, { token: owner.accessToken, expect: 403 });
    const bytes = await api(`/reports/${report}/excel`, { token: admin, binary: true });
    assert.deepEqual([...bytes.slice(0, 4)], [80, 75, 3, 4]);
    assertXlsx(bytes);
  }
  const dashboard = await api('/dashboard/summary', { token: admin }); assert.ok(dashboard.totalReliefRequests >= 2);
  const timeline = await api('/dashboard/requests-over-time?days=7', { token: admin }); assert.equal(timeline.length, 7);
  await api('/dashboard/map', { token: admin }); await api('/admin/audit-logs', { token: admin });
  const highlights = await api('/public/highlights'); assert.ok(!JSON.stringify(highlights).includes('0901234567')); assert.ok(!JSON.stringify(highlights).includes('photoDataUrl'));
  await api('/public/contact', { method: 'POST', body: { fullName: 'Test', email: 'invalid', phoneNumber: '', content: 'Test' }, expect: 400 });
  await api('/public/contact', { method: 'POST', body: { fullName: 'Test', email: 'contact@example.test', phoneNumber: '', content: 'Local smoke test' }, expect: 201 });
});

console.log(JSON.stringify({ outcome: 'passed', httpChecks: checks, scenarios: results, api: base }, null, 2));
