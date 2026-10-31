// Serve exported app locally for browser verification. Never proxies production data.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(process.argv[2] || 'MOBILE/dist');
const port = Number(process.argv[3] || 8081);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf','.woff':'font/woff','.woff2':'font/woff2'};
http.createServer((req,res)=>{
  let target;
  try {target=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}
  catch {res.writeHead(400).end();return;}
  if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  if(!fs.existsSync(target)||fs.statSync(target).isDirectory())target=path.join(root,'index.html');
  if(!fs.existsSync(target)){res.writeHead(404).end('Export the app first.');return;}
  res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');
  res.setHeader('Cache-Control','no-store');
  fs.createReadStream(target).pipe(res);
}).listen(port,'127.0.0.1',()=>console.log(`Serving ${root} on http://127.0.0.1:${port}`));
