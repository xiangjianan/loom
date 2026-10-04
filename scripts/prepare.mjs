import fs from 'node:fs';
const library=fs.readFileSync('node_modules/marked/lib/marked.umd.js','utf8')+'\n'+fs.readFileSync('node_modules/dompurify/dist/purify.min.js','utf8');
const html=fs.readFileSync('shell.html','utf8').replace('<!--STYLE-->','<style>'+fs.readFileSync('style.css','utf8')+'</style>').replace('<!--LIBRARIES-->','<script>'+library.replace(/<\/script/gi,'<\\/script')+'</script>').replace('<!--CONFIG-->','').replace('<!--APP-->','<script>'+fs.readFileSync('app.js','utf8')+'</script>');
fs.writeFileSync('page.html',html);fs.writeFileSync('worker/index.js','const html='+JSON.stringify(html)+';\n'+fs.readFileSync('api.js','utf8'));

fs.mkdirSync('docs',{recursive:true});fs.writeFileSync('docs/index.html',html.replace('<script>let modelRequest=', '<script>window.LOOM_API_BASE="https://loom-model-workbench.xiang9872.chatgpt.site";</script><script>let modelRequest='));fs.writeFileSync('docs/.nojekyll','');
