const http=require('http'),fs=require('fs'),path=require('path');
const PUB=process.argv[2], H=process.argv[3];
const T={'.js':'text/javascript','.html':'text/html','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.mind':'application/octet-stream','.wasm':'application/wasm'};
http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]); let f=u.startsWith('/h/')?path.join(H,u.slice(3)):path.join(PUB,u);
 fs.readFile(f,(e,b)=>{ if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'}); r.end(b);});}).listen(8790);
