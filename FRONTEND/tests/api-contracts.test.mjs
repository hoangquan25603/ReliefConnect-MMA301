import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

// Exercise the actual TypeScript API modules with a transport stub, including failed server writes.
function loadApi(relativePath, http) {
  const filename = new URL(relativePath, import.meta.url)
  const source = fs.readFileSync(filename, 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports = {}
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === '@/lib/api/http') return { http }
      if (name === '@/lib/api/paging') return { unwrapItems: value => Array.isArray(value) ? value : value?.items ?? [] }
      throw new Error(`Unexpected import: ${name}`)
    },
  }, { filename: filename.pathname })
  return exports
}

test('failed relief submission propagates network errors and never reports a local draft as submitted', async () => {
  const networkFailure = new Error('Network unavailable')
  const api = loadApi('../src/features/requests/requests.api.ts', { post: async () => { throw networkFailure } })
  await assert.rejects(api.createReliefRequest({ title: 'Cần nước', address: 'Đà Nẵng' }), error => error === networkFailure)
})

test('request reads propagate authorization and network failures instead of showing local cached requests', async () => {
  for (const status of [0, 401, 403, 500]) {
    const failure = Object.assign(new Error(`HTTP ${status}`), { status })
    const api = loadApi('../src/features/requests/requests.api.ts', { get: async () => { throw failure } })
    await assert.rejects(api.getReliefRequests(), error => error === failure)
    await assert.rejects(api.getReliefRequestById('123'), error => error === failure)
  }
})

test('request totals include every server page even when server caps the requested page size', async () => {
  const calls = []
  const api = loadApi('../src/features/requests/requests.api.ts', {
    get: async (_path, { params }) => {
      calls.push(params.pageNumber)
      return { data: { items: [{ id: String(params.pageNumber) }], totalPages: 3, pageSize: 1, totalCount: 3 } }
    },
  })
  assert.deepEqual((await api.getReliefRequests(1, 200)).map(row => row.id), ['1', '2', '3'])
  assert.deepEqual(calls, [1, 2, 3])
})

test('notification read and mark-read errors remain visible to callers', async () => {
  const failure = new Error('Server unavailable')
  const reject = async () => { throw failure }
  const api = loadApi('../src/features/notifications/notifications.api.ts', { get: reject, put: reject })
  for (const operation of [api.getNotifications, api.getUnreadCount, api.markAllNotificationsRead, () => api.markNotificationRead('42')]) {
    await assert.rejects(operation(), error => error === failure)
  }
})

test('notification list loads older unread records on subsequent pages', async () => {
  const api = loadApi('../src/features/notifications/notifications.api.ts', {
    get: async (_path, { params }) => ({ data: { items: [{ id: String(params.pageNumber), isRead: params.pageNumber === 1 }], totalPages: 2 } }),
  })
  const result = await api.getNotifications()
  assert.equal(result.length, 2)
  assert.equal(result[1].isRead, false)
})
