const {chromium}=require('C:/Users/priya/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path=require('path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const shot=async name=>page.screenshot({path:path.resolve(`output/glass-preview/${name}.png`),fullPage:true});
  await page.goto('http://127.0.0.1:4176/#Settings');await page.waitForTimeout(300);await shot('settings-new');
  await page.getByRole('button',{name:/^Appearance/}).click();await shot('appearance-new');
  await page.getByRole('switch',{name:'Reduce motion',exact:true}).click();
  if(await page.evaluate(()=>localStorage.getItem('reduce_motion'))!=='true')throw new Error('Reduce motion was not saved');
  await page.goto('http://127.0.0.1:4176/#LMStudio');await page.reload();await shot('lmstudio-new');
  await page.getByRole('textbox',{name:'Server address',exact:true}).fill('http://8.8.8.8:1234');
  await page.getByRole('switch',{name:'Allow private-network HTTP',exact:true}).click();
  await page.getByRole('button',{name:'Save & show models',exact:true}).click();
  await page.getByText('Use HTTPS, or allow HTTP for a private IPv4 address on your trusted network.',{exact:true}).waitFor();
  const statusBox=await page.getByText('Use HTTPS, or allow HTTP for a private IPv4 address on your trusted network.',{exact:true}).boundingBox();
  if(!statusBox||statusBox.y<0||statusBox.y+statusBox.height>844)throw new Error('Connection status is outside the viewport');
  await shot('lmstudio-status');
  await page.getByRole('tab',{name:'From anywhere',exact:true}).click();
  await page.getByRole('button',{name:'How to connect · step by step',exact:true}).click();
  await page.getByText('tailscale serve --bg http://127.0.0.1:1234',{exact:true}).scrollIntoViewIfNeeded();
  await shot('lmstudio-remote-guide');
  for(const mode of ['glass','glass-night','paper','mono','midnight']){
    await page.evaluate(mode=>localStorage.setItem('appearance_mode',mode),mode);
    await page.goto('http://127.0.0.1:4176/#Settings');await page.reload();
    await page.getByRole('button',{name:/^Responses/}).click();
    await page.getByRole('textbox',{name:'Personal instructions',exact:true}).fill('Keep answers clear and practical.');
    await page.getByRole('button',{name:'Save instructions',exact:true}).click();
    await page.getByText('Instructions saved.',{exact:true}).waitFor();
    await shot(`responses-${mode}`);
  }
  await page.setViewportSize({width:375,height:667});await page.goto('http://127.0.0.1:4176/#Models');await page.reload();await shot('lfm-models-new');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
  if(overflow||errors.length)throw new Error(JSON.stringify({errors,overflow}));
  console.log(JSON.stringify({errors,overflow,verified:['settings','appearance','persisted reduce motion','LM Studio invalid endpoint','responses saved in five themes','small model screen']}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

