const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8'));
const entries=[];
for(const [relative,item] of Object.entries(lock.packages||{})){
  if(!relative||item.dev)continue;
  const dir=path.join(root,relative);
  if(!fs.existsSync(path.join(dir,'package.json'))){if(item.optional)continue;throw new Error(`Missing installed package: ${relative}`);}
  const pkg=JSON.parse(fs.readFileSync(path.join(dir,'package.json'),'utf8'));
  const texts=fs.readdirSync(dir).filter(f=>/^(licen[sc]e|copying|notice)([.-]|$)/i.test(f)&&fs.statSync(path.join(dir,f)).isFile()).map(f=>`${f}\n${fs.readFileSync(path.join(dir,f),'utf8')}`);
  entries.push({name:pkg.name,version:pkg.version,license:typeof pkg.license==='string'?pkg.license:Array.isArray(pkg.licenses)?pkg.licenses.map(l=>l.type).join(' OR '):'UNREVIEWED',text:texts.join('\n\n'),path:relative});
}
entries.sort((a,b)=>a.name.localeCompare(b.name)||a.version.localeCompare(b.version));
fs.mkdirSync(path.join(root,'src/assets/legal'),{recursive:true});
fs.writeFileSync(path.join(root,'src/assets/legal/software-notices.json'),JSON.stringify(entries));
fs.writeFileSync(path.join(root,'docs/SOFTWARE_LICENSE_INVENTORY.json'),JSON.stringify(entries.map(({text,...item})=>({...item,hasNotice:!!text})),null,2));
console.log(JSON.stringify({packages:entries.length,licenses:[...new Set(entries.map(e=>e.license))],missingNotices:entries.filter(e=>!e.text).map(e=>e.name)}));
