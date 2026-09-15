const {chromium}=require('C:/Users/priya/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path=require('path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4176');await page.waitForTimeout(1600);
 await page.screenshot({path:path.resolve('output/glass-preview/chat.png')});
 await page.getByRole('button',{name:'Choose a model',exact:true}).click();await page.waitForTimeout(200);
 await page.screenshot({path:path.resolve('output/glass-preview/models.png')});
 await page.getByRole('tab',{name:'Cloud',exact:true}).click();await page.getByRole('button',{name:'Manage providers',exact:true}).click();
 await page.waitForTimeout(200);await page.screenshot({path:path.resolve('output/glass-preview/providers.png')});
 await page.getByRole('button',{name:'Custom provider',exact:false}).click();
 await page.screenshot({path:path.resolve('output/glass-preview/provider-form.png')});
 await page.evaluate(()=>localStorage.setItem('appearance_mode','glass-night'));await page.goto('http://127.0.0.1:4176');await page.waitForTimeout(1200);
 await page.screenshot({path:path.resolve('output/glass-preview/night.png')});
 await page.setViewportSize({width:375,height:667});await page.screenshot({path:path.resolve('output/glass-preview/small.png')});
 const composer=await page.getByRole('textbox',{name:'Message',exact:true}).boundingBox();if(!composer||composer.y+composer.height>667)throw new Error('Composer clipped on small phone');
 await page.setViewportSize({width:812,height:375});await page.screenshot({path:path.resolve('output/glass-preview/landscape.png')});
 console.log(JSON.stringify({errors,composer,verified:['chat','models','providers','custom form','night','375px composer','landscape']}));
 if(errors.length)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
