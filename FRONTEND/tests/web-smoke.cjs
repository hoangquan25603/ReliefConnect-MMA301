// Local-only browser integration smoke. Requires the demo API and a production web server.
const {chromium} = require('playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const base = process.env.WEB_URL || 'http://127.0.0.1:5173'
const apiBase = process.env.API_URL || 'http://localhost:5092/api'
for (const url of [base,apiBase]) assert.ok(['localhost','127.0.0.1'].includes(new URL(url).hostname), 'Run this smoke only against local development services')
const output = path.resolve(__dirname,'../../qa/web')
fs.mkdirSync(output,{recursive:true})
const stamp = Date.now()
const warehouseA = `UI smoke A ${stamp}`
const warehouseB = `UI smoke B ${stamp}`
const itemName = `Nước sạch UI ${stamp}`
const results = []
const errors = []
let browser, adminContext, requesterContext, adminToken
const warehouseIds = []
let requestId
async function callApi(url,options={}) {
  const response = await fetch(apiBase+url,{...options,headers:{'Content-Type':'application/json',...(options.token?{Authorization:`Bearer ${options.token}`}:{})},body:options.body===undefined?undefined:JSON.stringify(options.body)})
  const raw = await response.json()
  if(!response.ok || raw.isSuccess===false)throw new Error(`${response.status}: ${raw.errorMessages||raw.message||response.statusText}`)
  return raw && 'result' in raw?raw.result:raw
}
async function check(name,task){await task();results.push({name,status:'passed'});console.log(`PASS ${name}`)}
async function context(){
  const ctx = await browser.newContext({viewport:{width:1280,height:900},locale:'vi-VN'})
  await ctx.route('**/*',route=>{
    const host=new URL(route.request().url()).hostname
    return ['localhost','127.0.0.1'].includes(host)?route.continue():route.abort()
  })
  const page=await ctx.newPage()
  page.on('pageerror',err=>errors.push(err.message))
  page.setDefaultTimeout(15000)
  return {ctx,page}
}
async function login(page,email,password='Relief@123456'){
  await page.goto(base+'/login')
  await page.locator('#username').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button',{name:'Đăng nhập',exact:true}).click()
  await page.waitForURL(url=>url.pathname!=='/login')
}
async function addWarehouse(page,name){
  await page.goto(base+'/warehouses')
  await page.locator('.page-header .btn-primary').click()
  const modal=page.locator('.modal-box')
  await modal.locator('input[type=text]').nth(0).fill(name)
  await modal.locator('input[type=text]').nth(1).fill('Địa chỉ kiểm thử UI, Đà Nẵng')
  await modal.locator('input[type=number]').nth(0).fill('16.05')
  await modal.locator('input[type=number]').nth(1).fill('108.2')
  await modal.locator('input[type=tel]').fill('0912345678')
  const saved=page.waitForResponse(r=>r.url().endsWith('/api/warehouses')&&r.request().method()==='POST')
  await modal.locator('button[type=submit]').click()
  const result=await (await saved).json()
  warehouseIds.push((result.result??result).id)
  await modal.waitFor({state:'hidden'})
}

;(async()=>{
  try{
    browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH})
    const admin=await context();adminContext=admin.ctx;const page=admin.page
    await check('connection health and malformed server validation',async()=>{
      await page.goto(base+'/connection')
      await page.locator('#server-url').fill(apiBase)
      await page.getByRole('button',{name:'Kiểm tra kết nối',exact:true}).click()
      await page.locator('.success').waitFor()
      await page.locator('#server-url').fill('ftp://localhost')
      await page.getByRole('button',{name:'Kiểm tra kết nối',exact:true}).click()
      await page.locator('.error').waitFor()
    })
    await check('wrong password shows error without redirect loop',async()=>{
      await page.goto(base+'/login');await page.locator('#username').fill('admin@relief.local');await page.locator('#password').fill('incorrect-password')
      await page.getByRole('button',{name:'Đăng nhập',exact:true}).click()
      await page.locator('.error-banner').waitFor();assert.equal(new URL(page.url()).pathname,'/login')
    })
    await check('admin can log in and create warehouses',async()=>{
      await login(page,'admin@relief.local')
      adminToken=await page.evaluate(()=>localStorage.getItem('auth_access_token'))
      await addWarehouse(page,warehouseA);await addWarehouse(page,warehouseB)
      assert.equal(warehouseIds.length,2)
    })
    await check('create stock and show low-stock warning',async()=>{
      await page.goto(base+`/inventory?warehouseId=${warehouseIds[0]}`)
      await page.locator('.page-header .btn-primary').click()
      const modal=page.getByRole('dialog',{name:'Thông tin vật tư'})
      await modal.locator('input[type=text]').nth(0).fill(itemName);await modal.locator('select').selectOption('Water')
      await modal.locator('input[type=text]').nth(1).fill('chai');await modal.locator('input[type=number]').fill('10')
      await modal.locator('button[type=submit]').click();await modal.waitFor({state:'hidden'})
      await page.locator('.inv-table tr').filter({hasText:itemName}).locator('.badge--low').waitFor()
    })
    await check('stock import, export and transfer update both warehouses',async()=>{
      const row=page.locator('.inv-table tr').filter({hasText:itemName})
      await row.getByRole('button',{name:'+ Nhập',exact:true}).click()
      let modal=page.getByRole('dialog',{name:'Giao dịch kho'})
      await modal.locator('input[type=number]').fill('20');await modal.locator('button[type=submit]').click();await modal.waitFor({state:'hidden'})
      await page.waitForFunction(()=>document.querySelector('.cell-qty')?.textContent==='20')
      await row.getByRole('button',{name:'− Xuất',exact:true}).click()
      modal=page.getByRole('dialog',{name:'Giao dịch kho'})
      await modal.locator('input[type=number]').fill('21')
      assert.equal(await modal.locator('input[type=number]').evaluate(e=>e.checkValidity()),false)
      await modal.locator('input[type=number]').fill('4');await modal.locator('button[type=submit]').click();await modal.waitFor({state:'hidden'})
      await page.waitForFunction(()=>document.querySelector('.cell-qty')?.textContent==='16')
      await row.getByRole('button',{name:'Chuyển kho',exact:true}).click();modal=page.getByRole('dialog',{name:'Giao dịch kho'})
      await modal.locator('select').selectOption(String(warehouseIds[1]));await modal.locator('input[type=number]').fill('5')
      await modal.locator('button[type=submit]').click();await modal.waitFor({state:'hidden'})
      await page.waitForFunction(()=>document.querySelector('.cell-qty')?.textContent==='11')
      await page.locator('.wh-select').selectOption(String(warehouseIds[1]));await page.waitForFunction(()=>document.querySelector('.cell-qty')?.textContent==='5')
      await page.screenshot({path:path.join(output,'inventory-desktop.png'),fullPage:true})
    })
    await check('transfer history and low-stock filter are visible',async()=>{
      await page.locator('.inv-table tr').filter({hasText:itemName}).getByRole('button',{name:'Lịch sử',exact:true}).click()
      await page.getByText('Nhận chuyển kho',{exact:false}).waitFor()
      await page.getByRole('dialog',{name:'Lịch sử giao dịch'}).locator('.modal-close').click()
      await page.getByLabel('Chỉ vật tư sắp hết').check()
      await page.locator('.inv-table tr').filter({hasText:itemName}).waitFor()
    })
    await check('AI analyzes Vietnamese text and renders stock context',async()=>{
      await page.goto(base+'/ai');await page.getByRole('button',{name:'Thiếu nước sạch',exact:true}).click()
      await page.getByRole('button',{name:'✦ Phân tích bằng AI',exact:true}).click()
      await page.locator('.prediction').waitFor()
      assert.match(await page.locator('.prediction').innerText(),/Nước/)
      await page.screenshot({path:path.join(output,'ai-desktop.png'),fullPage:true})
    })
    await check('mobile sidebar starts closed and opens from menu button',async()=>{
      await page.setViewportSize({width:390,height:844});await page.goto(base+'/inventory')
      assert.equal(await page.locator('.wh-sidebar').evaluate(e=>e.classList.contains('collapsed')),true)
      await page.locator('.mobile-menu-btn').click();assert.equal(await page.locator('.wh-sidebar').evaluate(e=>e.classList.contains('collapsed')),false)
      await page.locator('.wh-sidebar').getByRole('link',{name:'Trợ lý AI cứu trợ',exact:true}).click()
      await page.locator('.ai-heading').waitFor();await page.screenshot({path:path.join(output,'ai-mobile.png'),fullPage:true})
    })
    await check('notification load failure remains visible with retry',async()=>{
      await page.route(url=>url.pathname==='/api/notifications',route=>route.abort())
      await page.goto(base+'/admin/notifications');await page.locator('.notification-error').waitFor()
      assert.ok(await page.getByRole('button',{name:'Thử lại',exact:true}).isVisible())
      await page.unrouteAll({behavior:'wait'})
    })
    const requester=await context();requesterContext=requester.ctx;const rpage=requester.page
    const email=`ui-smoke-${stamp}@relief.local`
    await callApi('/auth/register',{method:'POST',body:{email,password:'Relief@123456',confirmPassword:'Relief@123456',fullName:`UI smoke ${stamp}`,phoneNumber:'0912345678'}})
    await check('requester cannot see inventory write controls',async()=>{
      await login(rpage,email);await rpage.goto(base+`/inventory?warehouseId=${warehouseIds[0]}`)
      await rpage.locator('.inv-table').waitFor()
      assert.equal(await rpage.locator('.page-header .btn-primary').count(),0)
      assert.equal(await rpage.getByRole('button',{name:'+ Nhập',exact:true}).count(),0)
    })
    await check('requester failed submission stays open and retry actually persists',async()=>{
      await rpage.goto(base+'/requester/my-requests?create=true')
      const modal=rpage.locator('.create-modal-box')
      await modal.waitFor()
      await modal.locator('.wizard-step-pane').nth(0).locator('input[type=text]').fill(`UI request ${stamp}`)
      await modal.locator('input[type=tel]').fill('0912345678');await modal.locator('textarea').fill('Khu dân cư thiếu nước sạch sau mưa lớn, cần hỗ trợ.')
      await modal.getByRole('button',{name:'Tiếp tục →',exact:true}).click()
      await modal.locator('.wizard-step-pane').nth(1).locator('input[type=text]').fill('Địa chỉ kiểm thử UI')
      await modal.getByRole('button',{name:'Tiếp tục →',exact:true}).click()
      await rpage.route('**/api/relief-requests',route=>route.request().method()==='POST'?route.abort():route.continue())
      await modal.locator('button[type=submit]').click();await modal.locator('.error-text').waitFor()
      assert.equal(await modal.isVisible(),true)
      await rpage.unroute('**/api/relief-requests')
      const saved=rpage.waitForResponse(r=>r.url().endsWith('/api/relief-requests')&&r.request().method()==='POST')
      await modal.locator('button[type=submit]').click()
      const body=await(await saved).json();requestId=(body.result??body).id
      await modal.waitFor({state:'hidden'});await rpage.getByText(`UI request ${stamp}`,{exact:true}).waitFor()
    })
    await check('server switch verifies health then clears existing session',async()=>{
      await rpage.goto(base+'/connection');await rpage.locator('#server-url').fill('http://127.0.0.1:5092')
      await rpage.getByRole('button',{name:'Lưu máy chủ',exact:true}).click();await rpage.waitForURL('**/login')
      assert.equal(await rpage.evaluate(()=>localStorage.getItem('auth_access_token')),null)
      assert.equal(await rpage.evaluate(()=>localStorage.getItem('relief_api_url')),'http://127.0.0.1:5092/api')
    })
    await check('no uncaught JavaScript errors',async()=>assert.deepEqual(errors,[]))
  }catch(error){results.push({name:'browser smoke failure',status:'failed',error:error.stack});console.error(error.stack);process.exitCode=1;for(const [name,ctx] of [['admin',adminContext],['requester',requesterContext]]){const p=ctx?.pages()?.[0];if(p){await p.screenshot({path:path.join(output,`failure-${name}.png`),fullPage:true}).catch(()=>{});console.error(name,p.url(),(await p.locator('body').innerText()).slice(0,2500))}}}
  finally{
    // Restore quantities and deactivate only the uniquely named test warehouses.
    if(adminToken){
      for(const id of warehouseIds){try{const stock=await callApi(`/inventory-items?WarehouseId=${id}&PageSize=100`,{token:adminToken});for(const item of stock.items??[])if(item.quantity>0)await callApi(`/inventory-items/${item.id}/stock-out`,{token:adminToken,method:'POST',body:{quantity:item.quantity,referenceNo:'UI-SMOKE-CLEANUP',note:'Dọn dữ liệu kiểm thử giao diện'}});await callApi(`/warehouses/${id}`,{token:adminToken,method:'DELETE'})}catch(error){console.warn('Cleanup:',error.message)}}
      if(requestId)try{await callApi(`/relief-requests/${requestId}/status`,{token:adminToken,method:'PUT',body:{status:'Cancelled'}})}catch(error){console.warn('Cleanup request:',error.message)}
    }
    await browser?.close()
    fs.writeFileSync(path.join(output,'smoke-results.json'),JSON.stringify({executedAt:new Date().toISOString(),base,results,pageErrors:errors},null,2))
  }
})()
