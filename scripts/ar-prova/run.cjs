const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const fs=require('fs');
const [,, out, ...queries] = process.argv;
(async()=>{
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for (const q of queries) {
  const p=await b.newPage();
  p.on('pageerror',e=>console.log('pageerror',q,e.message.slice(0,200)));
  const t0=Date.now();
  await p.goto('http://localhost:8790/h/index.html?'+q);
  try { await p.waitForFunction(()=>window.__result,{timeout:900000, polling:1000}); }
  catch(e){ console.log('timeout',q); await p.close(); continue; }
  const r=await p.evaluate(()=>window.__result);
  fs.writeFileSync(out+'/'+q.replace(/[^a-z0-9.=-]+/gi,'_')+'.json', JSON.stringify(r));
  console.log('done', q, ((Date.now()-t0)/1000).toFixed(0)+'s', r.rows.filter(x=>x.seen).length+'/'+r.rows.length);
  await p.close();
 }
 await b.close();})();
