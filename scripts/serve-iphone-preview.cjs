// LAN preview of React Native Web. API requests go only to the local demo API.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../MOBILE/dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf','.woff':'font/woff','.woff2':'font/woff2'};
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/api'||url.pathname.startsWith('/api/')){
  const upstream=http.request({hostname:'127.0.0.1',port:5092,path:url.pathname+url.search,method:req.method,headers:{...req.headers,host:'127.0.0.1:5092'}},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res)});
  upstream.on('error',()=>{if(!res.headersSent)res.writeHead(502,{'Content-Type':'application/json'});res.end(JSON.stringify({message:'Server demo chưa chạy. Mở START-DEMO.cmd trên laptop.'}))});
  req.pipe(upstream);return;
 }
 let file;try{file=path.resolve(root,'.'+decodeURIComponent(url.pathname))}catch{res.writeHead(400).end();return}
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'index.html');
 if(!fs.existsSync(file)){res.writeHead(404).end('Run Expo web export first.');return}
 res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');
 if(path.basename(file)==='index.html'){
  const setup="<script>try{if(!localStorage.getItem('relief-server-v1'))localStorage.setItem('relief-server-v1',location.origin+'/api')}catch(e){}</script>";
  res.end(fs.readFileSync(file,'utf8').replace('<head>','<head>'+setup));return;
 }
 fs.createReadStream(file).pipe(res);
}).listen(8083,'0.0.0.0',()=>console.log('iPhone Safari preview: http://IP-LAPTOP:8083 (same Wi-Fi). API forwarded to local5092.'));
