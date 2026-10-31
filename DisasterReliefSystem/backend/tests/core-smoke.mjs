// Real HTTP integration tests against a fresh SQLite database; never uses hosted/user data.
// Run after dotnet build: node backend/tests/core-smoke.mjs (from repository root or any cwd).
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';

const apiDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../DisasterReliefSystem.API');
const port = Number(process.env.CORE_TEST_PORT || 5094);
const base = `http://127.0.0.1:${port}/api`;
const runId = Date.now().toString();
await mkdir(resolve(apiDirectory, '.local'), { recursive: true });
const server = spawn('dotnet', [process.env.CORE_API_DLL || 'bin/Debug/net10.0/DisasterReliefSystem.API.dll', '--urls', `http://127.0.0.1:${port}`], {
  cwd: apiDirectory,
  env: { ...process.env, ASPNETCORE_ENVIRONMENT: 'Development', SeedDemo: 'true',
    ConnectionStrings__DefaultConnection: `Data Source=${resolve(apiDirectory, `.local/core-test-${runId}.db`)}` },
  windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', chunk => { serverLog += chunk; });
server.stderr.on('data', chunk => { serverLog += chunk; });
let checks = 0;
const sections = [];
function check(condition, label) { assert.ok(condition, label); checks++; }
function equal(actual, expected, label) { assert.deepEqual(actual, expected, label); checks++; }
async function request(path, { method = 'GET', body, token, status = 200 } = {}) {
  const response = await fetch(base + path, { method, headers: {
    ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000) });
  const text = await response.text();
  equal(response.status, status, `${method} ${path}: expected ${status}, got ${response.status}: ${text.slice(0, 500)}`);
  if (!text) return null;
  const data = JSON.parse(text); return data && 'isSuccess' in data ? data.result : data;
}
const login = email => request('/auth/login', { method: 'POST', body: { email, password: 'Relief@123456' } });
function section(name) { sections.push(name); console.log(`PASS ${name}`); }
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error(`API exited: ${serverLog}`);
    try { const response = await fetch(base + '/health', { signal: AbortSignal.timeout(1000) }); if (response.ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  check(ready, 'isolated server starts');
  equal((await request('/health')).application, 'ReliefConnect', 'health identifies backend');
  const admin = await login('admin@relief.local'); const coordinator = await login('warehouse@relief.local');
  const requester = await login('requester@relief.local'); const volunteer = await login('volunteer@relief.local');
  const organization = await login('organization@relief.local');
  for (const session of [admin, coordinator, requester, volunteer, organization]) {
    check(typeof session.userId === 'string', 'IDs serialize as strings');
    equal(session.accessToken.length, 64, 'cryptographic opaque access token');
    equal((await request('/auth/me', { token: session.accessToken })).role, session.role, 'DB role identity');
  }
  await request('/inventory-items', { status: 401 });
  await request('/admin/users', { token: requester.accessToken, status: 403 });
  await request('/auth/login', { method: 'POST', body: { email: 'admin@relief.local', password: 'WrongPassword123' }, status: 401 });
  section('demo accounts, authentication and role enforcement');

  const newEmail = `core-${runId}@test.local`;
  const registration = { email: newEmail, password: 'StrongPassword123', confirmPassword: 'StrongPassword123', fullName: 'Core test', phoneNumber: '0900000000', roleName: 'Admin' };
  const registered = await request('/auth/register', { method: 'POST', body: registration });
  equal(registered.role, 'Requester', 'registration never accepts elevated role');
  await request('/auth/register', { method: 'POST', body: registration, status: 409 });
  await request('/auth/register', { method: 'POST', body: { ...registration, email: 'weak@test.local', password: '123', confirmPassword: '123' }, status: 400 });
  const renewed = await request('/auth/refresh-token', { method: 'POST', body: { refreshToken: registered.refreshToken } });
  await request('/auth/refresh-token', { method: 'POST', body: { refreshToken: registered.refreshToken }, status: 401 });
  await request('/auth/me', { token: registered.accessToken, status: 401 });
  await request('/auth/me', { token: renewed.accessToken });
  await request('/auth/logout', { method: 'POST', body: { refreshToken: renewed.refreshToken } });
  await request('/auth/me', { token: renewed.accessToken, status: 401 });
  section('registration validation, refresh rotation and logout revocation');

  const warehouseBody = { name: `Core warehouse ${runId}`, address: 'Test address', latitude: 16.05, longitude: 108.2, contactPhone: '0900000000' };
  await request('/warehouses', { method: 'POST', body: warehouseBody, token: requester.accessToken, status: 403 });
  await request('/warehouses', { method: 'POST', body: { ...warehouseBody, latitude: 200 }, token: admin.accessToken, status: 400 });
  const origin = await request('/warehouses', { method: 'POST', body: warehouseBody, token: coordinator.accessToken });
  const destination = await request('/warehouses', { method: 'POST', body: { ...warehouseBody, name: 'Core destination' }, token: admin.accessToken });
  await request(`/warehouses/${origin.id}`, { method: 'PUT', token: admin.accessToken, body: { ...warehouseBody, name: 'Updated origin', isActive: true } });
  equal((await request(`/warehouses/${origin.id}`, { token: requester.accessToken })).name, 'Updated origin', 'warehouse update persisted');
  const itemBody = { warehouseId: origin.id, itemName: `Rice ${runId}`, unit: 'kg', minimumQuantity: 4, category: 'Food' };
  const item = await request('/inventory-items', { method: 'POST', token: coordinator.accessToken, body: itemBody });
  const at = path => `/inventory-items/${item.id}${path}`;
  equal((await request(at(''), { token: requester.accessToken })).quantity, 0, 'new inventory starts empty');
  await request('/inventory-items', { method: 'POST', token: admin.accessToken, body: itemBody, status: 409 });
  await request('/inventory-items', { method: 'POST', token: admin.accessToken, body: { ...itemBody, category: 'Invalid' }, status: 400 });
  await request(at(''), { method: 'PUT', token: coordinator.accessToken, body: { itemName: itemBody.itemName, unit: 'kg', minimumQuantity: 5, category: 'Food' } });
  const move = { quantity: 10, referenceNo: 'CORE-001', note: 'test' };
  await request(at('/stock-in'), { method: 'POST', token: requester.accessToken, body: move, status: 403 });
  for (const quantity of [0, -1, 1.5]) await request(at('/stock-in'), { method: 'POST', token: admin.accessToken, body: { ...move, quantity }, status: 400 });
  equal((await request(at('/stock-in'), { method: 'POST', token: coordinator.accessToken, body: move })).quantity, 10, 'stock-in adds');
  await request(at('/stock-out'), { method: 'POST', token: coordinator.accessToken, body: { ...move, quantity: 11 }, status: 400 });
  equal((await request(at(''), { token: admin.accessToken })).quantity, 10, 'overdraw leaves stock unchanged');
  equal((await request(at('/transactions'), { token: admin.accessToken })).totalCount, 1, 'failed stock moves leave no ledger rows');
  await request(`/warehouses/${origin.id}`, { method: 'DELETE', token: admin.accessToken, status: 400 });
  await request(at(''), { method: 'PUT', token: coordinator.accessToken, body: { ...itemBody, unit: 'box' }, status: 400 });
  section('warehouse and inventory CRUD, validation, active status and ledger');

  const race = await Promise.all([1, 2].map(() => fetch(base + at('/stock-out'), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${coordinator.accessToken}` }, body: JSON.stringify({ ...move, quantity: 7 }) })));
  equal(race.map(r => r.status).sort(), [200, 400], 'concurrent exports cannot oversell');
  equal((await request(at(''), { token: admin.accessToken })).quantity, 3, 'atomic export quantity');
  const low = await request(`/inventory-items?warehouseId=${origin.id}&lowStockOnly=true&search=Rice`, { token: admin.accessToken });
  equal(low.totalCount, 1, 'search and low-stock filters combine');
  equal((await request(`/inventory-items/summary?warehouseId=${origin.id}`, { token: admin.accessToken })).lowStockItems, 1, 'summary counts low stock');
  await request(at('/transfer'), { method: 'POST', token: coordinator.accessToken, body: { destinationWarehouseId: origin.id, ...move, quantity: 1 }, status: 400 });
  await request(at('/transfer'), { method: 'POST', token: coordinator.accessToken, body: { destinationWarehouseId: destination.id, ...move, quantity: 4 }, status: 400 });
  equal((await request(`/inventory-items?warehouseId=${destination.id}`, { token: admin.accessToken })).totalCount, 0, 'failed transfer creates no destination row');
  const transferred = await request(at('/transfer'), { method: 'POST', token: coordinator.accessToken, body: { destinationWarehouseId: destination.id, ...move, quantity: 2 } });
  equal(transferred.quantity, 1, 'transfer debits source'); equal(transferred.destinationQuantity, 2, 'transfer credits target');
  const targetHistory = await request(`/inventory-items/${transferred.destinationInventoryItemId}/transactions`, { token: admin.accessToken });
  equal(targetHistory.items[0].transactionType, 'TransferIn', 'transfer ledger at destination');
  equal((await request(at('/transactions'), { token: admin.accessToken })).items[0].transactionType, 'TransferOut', 'transfer ledger at source');
  const raceItem = await request('/inventory-items', { method: 'POST', token: coordinator.accessToken,
    body: { ...itemBody, itemName: `Transfer race ${runId}`, category: 'Other' } });
  await request(`/inventory-items/${raceItem.id}/stock-in`, { method: 'POST', token: coordinator.accessToken, body: move });
  const transferRace = await Promise.all([1, 2].map(() => fetch(base + `/inventory-items/${raceItem.id}/transfer`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${coordinator.accessToken}` },
    body: JSON.stringify({ ...move, quantity: 7, destinationWarehouseId: destination.id }) })));
  equal(transferRace.map(r => r.status).sort(), [200, 400], 'concurrent transfers cannot oversell');
  const raceSource = await request(`/inventory-items/${raceItem.id}`, { token: admin.accessToken });
  const raceTargets = await request(`/inventory-items?warehouseId=${destination.id}&search=Transfer%20race`, { token: admin.accessToken });
  equal(raceTargets.totalCount, 1, 'concurrent transfers create only one target inventory');
  equal(raceSource.quantity + raceTargets.items[0].quantity, 10, 'transfer race conserves total stock');
  await request(`/inventory-items/${raceItem.id}/stock-out`, { method: 'POST', token: coordinator.accessToken, body: { ...move, quantity: 3 } });
  await request(at('/stock-out'), { method: 'POST', token: coordinator.accessToken, body: { ...move, quantity: 1 } });
  await request(at(''), { method: 'PUT', token: coordinator.accessToken, body: { ...itemBody, unit: 'box' }, status: 400 });
  await request(`/warehouses/${origin.id}`, { method: 'DELETE', token: admin.accessToken });
  await request(at('/stock-in'), { method: 'POST', token: coordinator.accessToken, body: move, status: 400 });
  await request(`/inventory-items/${transferred.destinationInventoryItemId}/transfer`, { method: 'POST', token: coordinator.accessToken, body: { ...move, quantity: 1, destinationWarehouseId: origin.id }, status: 400 });
  equal((await request(`/inventory-items/${transferred.destinationInventoryItemId}`, { token: admin.accessToken })).quantity, 2, 'failed inactive transfer preserves stock');
  section('concurrent oversell protection, filters and atomic transfers');

  const created = await request('/admin/users', { method: 'POST', token: admin.accessToken, body: { fullName: 'Managed user', email: `managed-${runId}@test.local`, password: 'Relief@123456', roleName: 'Requester' } });
  const managed = await login(created.email);
  await request(`/admin/users/${created.id}`, { method: 'PUT', token: admin.accessToken, body: { fullName: 'Updated user', phoneNumber: '0900000001' } });
  equal((await request('/auth/me', { token: managed.accessToken })).fullName, 'Updated user', 'profile changes visible');
  await request(`/admin/users/${created.id}/role`, { method: 'PUT', token: admin.accessToken, body: { roleName: 'Coordinator' } });
  await request('/auth/me', { token: managed.accessToken, status: 401 });
  const promoted = await login(created.email); equal(promoted.role, 'Coordinator', 'role change after login');
  await request(`/admin/users/${created.id}/deactivate`, { method: 'PUT', token: admin.accessToken });
  await request('/auth/me', { token: promoted.accessToken, status: 401 });
  await request('/auth/login', { method: 'POST', body: { email: created.email, password: 'Relief@123456' }, status: 401 });
  await request(`/admin/users/${created.id}/activate`, { method: 'PUT', token: admin.accessToken });
  await request(`/admin/users/${admin.userId}/deactivate`, { method: 'PUT', token: admin.accessToken, status: 400 });
  await request(`/admin/users/${admin.userId}/role`, { method: 'PUT', token: admin.accessToken, body: { roleName: 'Requester' }, status: 400 });
  section('user administration, immediate revocation and admin lockout protection');

  await request('/auth/forgot-password', { method: 'POST', body: { email: newEmail } });
  const mailDirectory = resolve(apiDirectory, '.local/mail');
  const mails = await readdir(mailDirectory);
  let code;
  for (const filename of mails) {
    const mail = await readFile(resolve(mailDirectory, filename), 'utf8');
    if (mail.includes(newEmail)) code = mail.match(/verification code: (\d{6})/)?.[1];
  }
  check(code, 'development email pickup contains reset code');
  await request('/auth/verify-reset-code', { method: 'POST', body: { email: newEmail, code: '000000' }, status: 400 });
  const reset = await request('/auth/verify-reset-code', { method: 'POST', body: { email: newEmail, code } });
  await request('/auth/reset-password', { method: 'POST', body: { resetSessionId: reset.resetSessionId, newPassword: 'NewPassword123', confirmPassword: 'NewPassword123' } });
  await request('/auth/reset-password', { method: 'POST', body: { resetSessionId: reset.resetSessionId, newPassword: 'NewPassword123', confirmPassword: 'NewPassword123' }, status: 400 });
  const afterReset = await request('/auth/login', { method: 'POST', body: { email: newEmail, password: 'NewPassword123' } });
  await request('/auth/change-password', { method: 'POST', token: afterReset.accessToken, body: { oldPassword: 'NewPassword123', newPassword: 'ChangedPassword123', confirmPassword: 'ChangedPassword123' } });
  await request('/auth/me', { token: afterReset.accessToken, status: 401 });
  section('password recovery email, one-time reset and password-change revocation');

  const model = await request('/ai/status', { token: requester.accessToken });
  equal(model.trainingExamples, 72, 'AI trains from 72 authored examples');
  const heldout = [
    ['Food', 'Chúng tôi đang đói, mong nhận gạo và bánh mì'], ['Food', 'Hết thực phẩm nấu bữa tối'],
    ['Water', 'Xin 20 bình nước uống sạch'], ['Water', 'Nước giếng bẩn không thể uống được'],
    ['Medicine', 'Cần băng gạc để sơ cứu vết thương'], ['Medicine', 'Trạm xá thiếu dụng cụ y tế'],
    ['Blanket', 'Cần chăn bông để giữ ấm ban đêm'], ['Blanket', 'Các em nhỏ thiếu áo khoác mùa rét'],
    ['Shelter', 'Mái nhà sập, xin lều và bạt che tạm'], ['Shelter', 'Cần tìm chỗ ở tạm cho cả nhà'],
    ['Other', 'Xin đèn pin và máy phát điện'], ['Other', 'Tìm bộ đàm để liên lạc']
  ];
  const results = [];
  for (const [expected, text] of heldout) {
    const result = await request('/ai/analyze', { method: 'POST', token: requester.accessToken, body: { text } });
    results.push({ expected, predicted: result.category, text, confidence: result.confidence });
    check(result.requiresHumanReview, 'AI always requires human review');
    check(Math.abs(result.probabilities.reduce((sum, p) => sum + p.probability, 0) - 1) < 0.001, 'AI probabilities normalized');
  }
  const correct = results.filter(r => r.expected === r.predicted).length;
  check(correct >= 10, `held-out examples >=10/12 correct, got ${correct}: ${JSON.stringify(results)}`);
  const unknown = await request('/ai/analyze', { method: 'POST', token: requester.accessToken, body: { text: 'xyzqwerty jklzxv' } });
  equal(unknown.category, 'Other', 'unknown input abstains to other'); equal(unknown.confidence, 0, 'unknown input has no evidence');
  equal(unknown.suggestedItems, [], 'no stock suggestions for unknown input');
  await request('/ai/analyze', { method: 'POST', token: requester.accessToken, body: { text: '' }, status: 400 });
  await request('/ai/analyze', { method: 'POST', token: requester.accessToken, body: { text: 'a'.repeat(4001) }, status: 400 });
  section(`AI trained model, held-out examples ${correct}/12 and unknown-input handling`);
  const report = { passed: true, checks, sections, aiHeldout: { correct, total: results.length, results },
    caveat: 'Authored smoke examples only, not a representative benchmark or production accuracy estimate.',
    database: `.local/core-test-${runId}.db`, completedAt: new Date().toISOString() };
  await writeFile(resolve(apiDirectory, '.local/core-test-result.json'), JSON.stringify(report, null, 2));
  console.log(`PASS ${checks} assertions across ${sections.length} sections`);
} finally {
  server.kill();
  await writeFile(resolve(apiDirectory, '.local/core-test-server.log'), serverLog);
}
