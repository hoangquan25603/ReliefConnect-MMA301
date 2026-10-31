import {test, afterEach} from 'node:test'
import assert from 'node:assert/strict'
import {ApiError,normalizeServer,items,request} from '../src/lib/api.ts'
const originalFetch=globalThis.fetch
afterEach(()=>{globalThis.fetch=originalFetch})
test('server URL normalized without silently changing host or API path',()=>{
 assert.equal(normalizeServer(' http://192.168.1.2:5092/ '),'http://192.168.1.2:5092/api')
 assert.equal(normalizeServer('https://relief.example/api/'),'https://relief.example/api')
 for(const url of ['ftp://a','javascript:alert(1)','http://user:pass@host','https://host?key=secret','https://host#x','https://host/wrong','host'])assert.throws(()=>normalizeServer(url))
})
test('pagination handles direct arrays and paged results',()=>{assert.deepEqual(items([{id:1}]),[{id:1}]);assert.deepEqual(items({items:[2],totalPages:3}),[2]);assert.deepEqual(items(null),[])})
test('authenticated writes carry bearer token and JSON once',async()=>{
 globalThis.fetch=async(url,options)=>{assert.equal(url,'http://local/api/inventory');assert.equal(options.headers.Authorization,'Bearer test-token');assert.equal(options.method,'POST');assert.deepEqual(JSON.parse(options.body),{quantity:7});return new Response(JSON.stringify({isSuccess:true,result:{id:'1'}}))}
 assert.deepEqual(await request('http://local/api','/inventory',{method:'POST',body:{quantity:7},token:'test-token'}),{id:'1'})
})
test('false success envelope is rejected',async()=>{globalThis.fetch=async()=>new Response(JSON.stringify({isSuccess:false,errorMessages:['Tồn kho không đủ'],result:null}));await assert.rejects(request('http://local/api','/stock'),e=>e instanceof ApiError&&e.message==='Tồn kho không đủ')})
test('403 without JSON body gives permission error',async()=>{globalThis.fetch=async()=>new Response('',{status:403});await assert.rejects(request('http://local/api','/admin'),e=>e.status===403&&e.message.includes('quyền'))})
test('invalid server response does not look like successful login',async()=>{globalThis.fetch=async()=>new Response('<html>wrong host</html>');await assert.rejects(request('http://local/api','/auth/login'),e=>e instanceof ApiError&&e.message.includes('định dạng'))})
test('transport failure remains explicit and never creates fake server data',async()=>{globalThis.fetch=async()=>{throw new TypeError('Failed to fetch')};await assert.rejects(request('http://local/api','/relief-requests',{method:'POST',body:{title:'Help'}}),e=>e.status===0&&e.message.includes('Wi-Fi'))})
test('server validation messages surface to the form',async()=>{globalThis.fetch=async()=>new Response(JSON.stringify({errorMessages:['Số lượng không hợp lệ']}),{status:400});await assert.rejects(request('http://local/api','/stock'),e=>e.status===400&&e.message==='Số lượng không hợp lệ')})
