// Rasterize the existing crescent vector; geometry stays identical to the approved logo.
const fs=require('fs');const path=require('path');
const {chromium}=require('C:/Users/priya/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage();const svg=fs.readFileSync('src/assets/branding/moon-logo.svg','utf8');
 const render=async(size,file,launcher=false,art=svg)=>{await page.setViewportSize({width:size,height:size});await page.setContent(`<html><body style="margin:0;width:100vw;height:100vh;display:grid;place-items:center;${launcher?'background:linear-gradient(135deg,#F4FAFF,#BDDFFF);border-radius:24%;overflow:hidden;':''}"><div style="width:${launcher?74:100}%;height:${launcher?74:100}%">${art.replace('<svg ','<svg width="100%" height="100%" ')}</div></body></html>`);await page.screenshot({path:path.resolve(file),omitBackground:true});};
 await render(512,'src/assets/branding/moon-brand-dark.png');
 await render(512,'src/assets/branding/moon-brand-light.png',false,svg.replace('#0a0b0e','#f4f8ff'));
 fs.writeFileSync('src/assets/branding/BrandAssets.ts',['Light','Dark'].map(name=>`export const MoonBrand${name}Base64 = 'data:image/png;base64,${fs.readFileSync('src/assets/branding/moon-brand-'+name.toLowerCase()+'.png').toString('base64')}';`).join('\n')+'\n');
 for(const [density,size] of Object.entries({mdpi:48,hdpi:72,xhdpi:96,xxhdpi:144,xxxhdpi:192}))for(const name of ['ic_launcher','ic_launcher_round'])await render(size,`android/app/src/main/res/mipmap-${density}/${name}.png`,true);
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
