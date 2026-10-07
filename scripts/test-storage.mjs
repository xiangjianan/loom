import fs from 'node:fs';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const html=fs.readFileSync('page.html','utf8'),key='loom.workspace.v1';
function boot(saved,{broken=false}={}){return new JSDOM(html,{runScripts:'dangerously',url:'https://loom.test/',beforeParse(w){w.localStorage.setItem('loom.language','zh');w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.scrollTo=function(o){this.scrollTop=o.top};if(saved)w.localStorage.setItem(key,saved);if(broken)w.Storage.prototype.setItem=function(){throw Error('quota')};}})}
let dom=boot(),w=dom.window,d=w.document;const $=id=>d.getElementById(id);
for(let i=0;i<3;i++){w.openConfig(i);$('key').value='test-key-'+i;$('save').click()}
const mock=async()=>({ok:true,json:async()=>({choices:[{message:{content:'## 结果\n\n第一轮 **重要回答**'}}]})});w.fetch=mock;
$('prompt').value='第一段对话';await w.send();const p=d.querySelector('.answer p'),range=d.createRange();range.selectNodeContents(p);w.getSelection().addRange(range);p.dispatchEvent(new w.MouseEvent('mouseup',{bubbles:true}));$('prompt').value='未发送草稿';$('prompt').dispatchEvent(new w.Event('input'));
const originalIDs=JSON.parse(w.localStorage.getItem(key)).sessions[0].cols.map(c=>c.id);
d.querySelector('.move-model[data-i="0"][data-offset="1"]').click();
assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).sessions[0].cols.map(c=>c.id),[originalIDs[1],originalIDs[0],originalIDs[2]]);
let copiedText;Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async text=>{copiedText=text}}});
const copyButton=d.querySelector('[data-copy-col]');copyButton.click();await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(copiedText,'第一段对话');assert.equal(copyButton.textContent,'已复制');
// Move back so existing model-index checks continue to verify their original configuration.
d.querySelector('.move-model[data-i="1"][data-offset="-1"]').click();
let saved=w.localStorage.getItem(key),firstId=JSON.parse(saved).currentId;dom.window.close();dom=boot(saved);w=dom.window;d=w.document;
assert.match($('settings').textContent,/模型配置成功/);w.openConfig(1);assert.equal($('key').value,'test-key-1');$('close').click();assert.equal(d.querySelectorAll('.answer').length,3);assert(d.querySelector('mark'));assert.equal(d.querySelectorAll('.chip').length,1);assert.equal($('prompt').value,'未发送草稿');
$('new').click();assert.equal(d.querySelectorAll('.answer').length,0);assert.equal($('prompt').value,'');w.openConfig(1);assert.equal($('key').value,'test-key-1');$('close').click();w.fetch=mock;$('prompt').value='第二段对话';await w.send();$('history-open').click();assert.equal(d.querySelectorAll('.history-item').length,2);$('history-search').value='第一段';$('history-search').dispatchEvent(new w.Event('input'));assert.equal(d.querySelectorAll('.history-item').length,1);d.querySelector('.history-item').click();assert.equal($('chat-title').textContent,'第一段对话');assert.equal($('prompt').value,'未发送草稿');assert(d.querySelector('mark'));assert.equal(d.querySelectorAll('.round-link').length,3);
saved=w.localStorage.getItem(key);dom.window.close();dom=boot(saved);w=dom.window;d=w.document;assert.equal(JSON.parse(w.localStorage.getItem(key)).currentId,firstId);assert.equal($('chat-title').textContent,'第一段对话');
// Closing while a request is pending preserves the user's message and recovers cleanly.
w.fetch=()=>new Promise(()=>{});$('prompt').value='处理中问题';void w.send();assert.equal($('history-open').disabled,true);saved=w.localStorage.getItem(key);dom.window.close();dom=boot(saved);w=dom.window;d=w.document;assert.equal($('send').disabled,false);assert.equal(d.querySelectorAll('.error').length,3);assert.match(d.querySelector('.error').textContent,/中断/);dom.window.close();
dom=boot(undefined,{broken:true});assert.equal(dom.window.document.getElementById('storage-warning').hidden,false);dom.window.close();
dom=boot('{bad json');assert.equal(dom.window.localStorage.getItem(key),'{bad json');assert.equal(dom.window.document.getElementById('storage-warning').hidden,false);dom.window.close();console.log('PASS: 配置及密钥刷新恢复、历史切换和搜索、草稿及高亮恢复、新对话保留配置、请求中断恢复、存储失败提示');
