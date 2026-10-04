import fs from 'node:fs';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';import worker from '../worker/index.js';
const dom=new JSDOM(fs.readFileSync('page.html','utf8'),{runScripts:'dangerously',url:'https://loom.test/',beforeParse(w){w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.scrollTo=function(options){this.scrollTop=options.top};}});
const w=dom.window,d=w.document,$=id=>d.getElementById(id),click=id=>$(id).click();
assert.equal(d.querySelectorAll('.column').length,3);
for(let i=0;i<3;i++){w.openConfig(i);$('provider').value='DeepSeek';$('provider').dispatchEvent(new w.Event('change'));assert.equal($('endpoint').value,'https://api.deepseek.com/v1');$('key').value='test';click('save')}
assert.match($('settings').textContent,/模型配置成功/);assert.equal(d.querySelectorAll('.empty .config').length,0);
click('add');click('close');click('add');click('close');click('add');assert.equal(d.querySelectorAll('.column').length,5);assert.equal($('add').disabled,true);
while(d.querySelectorAll('.column').length>1){w.openConfig(d.querySelectorAll('.column').length-1);click('remove')}
w.openConfig(0);assert.equal($('remove').disabled,true);click('remove');assert.equal(d.querySelectorAll('.column').length,1);click('close');
let requests=[];w.fetch=async(url,options)=>{requests.push(JSON.parse(options.body));return {ok:true,json:async()=>({choices:[{message:{content:'# 方案\n\n这是 **重点** 内容。\n\n- 第一项\n- 第二项\n\n| 列 | 值 |\n| --- | --- |\n| A | B |\n\n```js\nconst a = 1;\n```\n\n<img src=x onerror=alert(1)> [坏链接](javascript:alert(1))'}}]})}};
$('prompt').value='第一轮问题';await w.send();assert.equal(requests.length,1);assert(d.querySelector('.answer h1'));assert(d.querySelector('.answer table'));assert(d.querySelector('.answer pre code'));assert(!d.querySelector('.answer img'));assert(!d.querySelector('.answer a[href^="javascript"]'));assert.equal(d.querySelectorAll('.round-link').length,1);
const p=d.querySelector('.answer p'),r=d.createRange();r.selectNodeContents(p);w.getSelection().addRange(r);p.dispatchEvent(new w.MouseEvent('mouseup',{bubbles:true}));assert(d.querySelector('mark'));assert.equal(d.querySelectorAll('.chip').length,1);
$('prompt').value='继续解释';await w.send();assert.equal(requests[1].messages.length,3);assert.match(requests[1].messages[2].content,/这是 重点 内容/);assert.equal(d.querySelectorAll('.round-link').length,2);assert(d.querySelector('mark'));assert.equal(d.querySelectorAll('.chip').length,0);
d.querySelector('.round-link').click();
let sent;const original=globalThis.fetch;globalThis.fetch=async(url,options)=>{sent={url,...options};return Response.json({content:[{type:'text',text:'Claude 回答'}]})};
const response=await worker.fetch(new Request('https://loom.test/api/chat',{method:'POST',body:JSON.stringify({endpoint:'https://api.anthropic.com/v1',protocol:'anthropic',key:'test',model:'claude-sonnet-4-5',messages:[{role:'user',content:'你好'}]})}));assert.equal((await response.json()).choices[0].message.content,'Claude 回答');assert.equal(sent.url,'https://api.anthropic.com/v1/messages');assert.equal(sent.headers['x-api-key'],'test');globalThis.fetch=original;
console.log('PASS: 配置成功状态、自由换厂商、1–5 列限制、Markdown 和内容清理、富文本高亮、多轮引用、章节导航、Claude 协议适配');dom.window.close();
