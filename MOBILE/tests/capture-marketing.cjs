const {chromium}=require('playwright');
const path=require('node:path');
const fs=require('node:fs');
const api='http://127.0.0.1:5097/api';
const out=path.resolve(__dirname,'../../marketing/screenshots');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 async function login(email){const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2});const p=await context.newPage();await p.goto('http://127.0.0.1:8081');await p.getByLabel('Địa chỉ server',{exact:true}).fill(api);await p.getByRole('button',{name:'Kiểm tra & lưu kết nối',exact:true}).click();await p.getByLabel('Email',{exact:true}).fill(email);await p.getByLabel('Mật khẩu',{exact:true}).fill('Relief@123456');await p.getByRole('button',{name:'Đăng nhập',exact:true}).click();await p.getByRole('button',{name:'Mở trợ lý AI',exact:true}).waitFor();return p;}
 try{
  const admin=await login('admin@relief.local');await admin.getByText('Bộ sơ cứu',{exact:true}).waitFor();await admin.screenshot({path:path.join(out,'home-admin.png')});
  await admin.getByRole('tab',{name:/Kho hàng/}).click();await admin.getByRole('radio',{name:'Kho cứu trợ Đà Nẵng',exact:true}).click();await admin.getByRole('button',{name:'Nhập kho',exact:true}).first().waitFor();await admin.screenshot({path:path.join(out,'inventory.png')});
  await admin.getByRole('tab',{name:/Trợ lý AI/}).click();await admin.getByRole('button',{name:'Thiếu nước sạch',exact:true}).click();await admin.getByRole('button',{name:'Phân tích bằng AI',exact:true}).click();await admin.getByText('Kết quả phân tích',{exact:true}).waitFor();await admin.getByText('NHÓM NHU CẦU CHÍNH',{exact:true}).scrollIntoViewIfNeeded();await admin.screenshot({path:path.join(out,'ai-result.png')});
  const r=await fetch(api+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'requester@relief.local',password:'Relief@123456'})});const user=await r.json();
  const created=await fetch(api+'/relief-requests',{method:'POST',headers:{Authorization:'Bearer '+user.accessToken,'Content-Type':'application/json'},body:JSON.stringify({title:'Nước sạch cho 20 hộ dân',description:'Sau mưa lớn, khu dân cư cần bổ sung nước uống và lương thực. Dữ liệu minh họa phục vụ môn MMA301.',address:'Hải Châu, Đà Nẵng',region:'Đà Nẵng',latitude:16.0544,longitude:108.2022,affectedPeople:80,emergencyLevel:2,contactPhone:'0900000000',needWater:true,waterQuantity:100,needFood:true,foodQuantity:50})});if(!created.ok)throw Error('Marketing request failed '+created.status);
  const requester=await login('requester@relief.local');await requester.getByRole('tab',{name:/Yêu cầu/}).click();await requester.getByText('Nước sạch cho 20 hộ dân',{exact:true}).first().waitFor();await requester.screenshot({path:path.join(out,'request-created.png')});
  console.log('Saved4 actual React Native Web screenshots on demonstration data.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

