import http from 'node:http';
import worker from './api.mjs';
import {safeFetch} from './safe-fetch.mjs';
globalThis.fetch=safeFetch;
const port=Number(process.env.PORT||8791);let inFlight=0;
const server=http.createServer(async(req,res)=>{try{
 if(req.url==='/health'&&req.method==='GET'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({status:'ok',service:'loom-relay'}));return}
 if(!['/api/chat','/api/models'].includes(req.url)){res.writeHead(404);res.end('Not found');return}
 if(!['POST','OPTIONS'].includes(req.method)){res.writeHead(405);res.end('Method not allowed');return}
 if(inFlight>=40){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'转发服务繁忙，请稍后重试'}));return}
 inFlight++;try{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>2*1024*1024){res.writeHead(413,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'请求内容超过 2 MB'}));return}chunks.push(chunk)}const body=Buffer.concat(chunks).toString();const request=new Request('https://relay.minidesk.online:8443'+req.url,{method:req.method,headers:req.headers,...(body?{body}:{})});const response=await worker.fetch(request);res.writeHead(response.status,{...Object.fromEntries(response.headers),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(Buffer.from(await response.arrayBuffer()));}finally{inFlight--}
 }catch{if(!res.headersSent)res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'转发服务异常，请稍后重试'}));}});
server.requestTimeout=140000;server.headersTimeout=20000;server.listen(port,'127.0.0.1',()=>console.log('loom-relay listening on loopback:'+port));
process.on('SIGTERM',()=>{server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),5000).unref()});
