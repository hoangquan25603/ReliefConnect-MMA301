const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const results=[];const pageErrors=[];
let browser,p;
const button=name=>p.getByRole('button',{name,exact:true});
const field=name=>p.getByLabel(name,{exact:true});
const back=()=>p.getByLabel('Quay lại, back',{exact:true}).click();
const show=text=>p.getByText(text,{exact:true}).filter({visible:true}).first().waitFor();
async function step(name,run){await run();results.push({name,passed:true});console.log('PASS',name);}
(async()=>{
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 p=await browser.newPage({viewport:{width:412,height:915}});p.setDefaultTimeout(12000);p.on('pageerror',e=>pageErrors.push(e.message));p.on('dialog',d=>d.accept());
 await p.goto('http://127.0.0.1:8081');await field('Địa chỉ server').fill('http://127.0.0.1:5092');await button('Kiểm tra & lưu kết nối').click();await button('Chưa có tài khoản? Đăng ký').click();
 for(const[k,v]of Object.entries({'Họ và tên':'Kiểm thử lỗi và hồ sơ','Số điện thoại':'0900000002','Email':`errors${Date.now()}@relief.local`,'Mật khẩu':'Relief@123456','Xác nhận mật khẩu':'Relief@123456'}))await field(k).fill(v);await button('Đăng ký').click();await button('Mở trợ lý AI').waitFor();
 await step('Request validation, offline failure, draft persists and restores',async()=>{
  await p.getByRole('tab',{name:/Yêu cầu/}).click();await button('+ Tạo yêu cầu hỗ trợ').click();await button('Gửi yêu cầu').click();await show('Điền tiêu đề, mô tả, địa chỉ, liên hệ, tọa độ hợp lệ và số người tối thiểu 1.');
  for(const[k,v]of Object.entries({'Tiêu đề':'Bản nháp khi mất mạng','Mô tả tình hình':'Đây là bài kiểm thử lỗi mạng của dự án MMA301.','Địa chỉ':'Đà Nẵng','Số điện thoại liên hệ':'0900000002','Vĩ độ':'16.05','Kinh độ':'108.2'}))await field(k).fill(v);
  await button('Lưu bản nháp trên máy').click();await show('Đã lưu bản nháp trên máy. Chưa gửi đến điều phối viên.');
  await p.route('**/api/relief-requests',r=>r.request().method()==='POST'?r.abort('failed'):r.continue());await button('Gửi yêu cầu').click();await show('Không kết nối được máy chủ. Kiểm tra Wi-Fi, địa chỉ server và server đang chạy.');assert.equal(await field('Tiêu đề').inputValue(),'Bản nháp khi mất mạng');await back();await button('+ Tạo yêu cầu hỗ trợ').click();await p.waitForFunction(()=>document.querySelector('[aria-label="Tiêu đề"]').value==='Bản nháp khi mất mạng');await back();await p.unroute('**/api/relief-requests');
 });
 await step('Volunteer profile creation, skill add/remove and pending state',async()=>{
  await p.getByRole('tab',{name:/Tiện ích/}).click();await button('Hồ sơ tình nguyện viên').click();for(const[k,v]of Object.entries({'Địa chỉ':'Đà Nẵng','Vĩ độ':'16.05','Kinh độ':'108.2','Giới thiệu':'Tình nguyện viên demo, hỗ trợ hậu cần.','Số năm kinh nghiệm':'1'}))await field(k).fill(v);await button('Lưu hồ sơ').click();await show('Đã lưu hồ sơ. Hồ sơ mới cần quản trị viên duyệt.');await show('Chờ duyệt');await p.getByRole('radio',{name:'Sơ cứu',exact:true}).click();await button('Thêm kỹ năng').click();await button('Gỡ Sơ cứu').click();await button('Gỡ Sơ cứu').waitFor({state:'hidden'});await back();
 });
 await step('Role request and password validation remain explicit',async()=>{
  await button('Tài khoản & mật khẩu').click();await field('Mật khẩu hiện tại').fill('wrong');await field('Mật khẩu mới').fill('Relief@987654');await field('Nhập lại mật khẩu mới').fill('mismatch');await button('Đổi mật khẩu').click();await show('Mật khẩu xác nhận không khớp.');await field('Lý do').fill('Tổ chức demo muốn gửi vật tư hỗ trợ trong môn MMA301.');await button('Gửi nguyện vọng').click();await show('Đã gửi nguyện vọng chờ duyệt.');await back();
 });
 await step('Notification transport error can be recovered by retry',async()=>{
  await p.route('**/api/notifications?*',r=>r.abort('failed'));await button('Thông báo').click();await show('Không kết nối được máy chủ. Kiểm tra Wi-Fi, địa chỉ server và server đang chạy.');await back();await p.unroute('**/api/notifications?*');await button('Thông báo').click();await button('Đánh dấu tất cả đã đọc').click();await back();
 });
 await step('Server validation and server-switch logout',async()=>{
  await button('Kết nối máy chủ').click();await field('Địa chỉ server').fill('not-a-url');await button('Kiểm tra & lưu kết nối').click();await show('Nhập URL đầy đủ, ví dụ http://192.168.1.5:5092');await field('Địa chỉ server').fill('http://localhost:5092');await button('Kiểm tra & lưu kết nối').click();await field('Email').waitFor();assert.equal(await p.evaluate(()=>sessionStorage.getItem('relief-session-v1')),null);
 });
 await step('No uncaught runtime errors',async()=>assert.deepEqual(pageErrors,[]));
})().catch(async e=>{console.error(e);if(p)console.error((await p.locator('body').innerText()).slice(0,6000));results.push({error:e.message});process.exitCode=1;}).finally(async()=>{const dir=path.resolve(__dirname,'../../qa/mobile');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'errors-result.json'),JSON.stringify({runAt:new Date().toISOString(),results,pageErrors},null,2));if(browser)await browser.close();});
