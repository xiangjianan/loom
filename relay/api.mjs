async function handleRequest(request){
 const url=new URL(request.url);

 if(url.pathname==='/api/models'&&request.method==='POST'){
  let apiKey='';try{const {endpoint,key,protocol}=await request.json();apiKey=key||'';const target=new URL(endpoint);if(target.protocol!=='https:'||target.username||target.password||target.search||target.hash||/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[)/i.test(target.hostname))return Response.json({error:'请使用公共 HTTPS 模型接口'},{status:400});if(!key)return Response.json({error:'请先填写 API Key'},{status:400});
   const anthropic=protocol==='anthropic',base=endpoint.replace(/\/$/,'');let models=[],after='';
   for(let page=0;page<20;page++){const path=base+'/models'+(anthropic?'?limit=100'+(after?'&after_id='+encodeURIComponent(after):''):'');const response=await fetch(path,{method:'GET',redirect:'manual',headers:anthropic?{'x-api-key':key,'anthropic-version':'2023-06-01'}:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(20000)});const raw=await response.text();let data;try{data=JSON.parse(raw)}catch{return Response.json({error:'该服务商未返回可用模型列表（HTTP '+response.status+'），请手动输入型号。'},{status:502})}if(!response.ok){let detail=data.error?.message||'模型列表接口返回 HTTP '+response.status;detail=String(detail).split(apiKey).join('[REDACTED]');return Response.json({error:detail},{status:response.status>=400?response.status:502})}
   const list=data.data||data.models;if(!Array.isArray(list))return Response.json({error:'该服务商未提供兼容的模型列表接口，请手动输入型号。'},{status:502});models.push(...list.filter(m=>typeof m.id==='string').map(m=>({id:m.id,name:m.display_name||m.name||m.id,created:m.created||0})));if(!anthropic||!data.has_more||!data.last_id)break;after=data.last_id;}
   const unique=[...new Map(models.map(m=>[m.id,m])).values()];if(!anthropic)unique.sort((a,b)=>b.created-a.created||a.id.localeCompare(b.id));return Response.json({models:unique});
  }catch{return Response.json({error:'获取在线模型列表失败，请检查接入地址、API Key 或网络。'},{status:502})}
 }
 if(url.pathname==='/api/chat'&&request.method==='POST'){
  let stage='request',apiKey='';
  try{
   const {endpoint,key,model,messages,protocol}=await request.json();apiKey=key||'';const target=new URL(endpoint);
   if(target.protocol!=='https:'||target.username||target.password||/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[)/i.test(target.hostname))return Response.json({error:'请使用公共 HTTPS 模型接口'},{status:400});
   if(!key||!model||!Array.isArray(messages))return Response.json({error:'模型配置不完整'},{status:400});
   const anthropic=protocol==='anthropic';
   stage='forward';const response=await fetch(endpoint.replace(/\/$/,'')+(anthropic?'/messages':'/chat/completions'),{method:'POST',redirect:'manual',headers:anthropic?{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'}:{'Content-Type':'application/json','Authorization':'Bearer '+key},body:JSON.stringify(anthropic?{model,messages,max_tokens:8192}:{model,messages,stream:false}),signal:AbortSignal.timeout(120000)});
   stage='response';if(response.status>=300&&response.status<400)return Response.json({error:'模型接口返回重定向，请使用服务商的最终 API 接入地址。',code:'UPSTREAM_REDIRECT',upstream_status:response.status},{status:502});
   const raw=await response.text();let data;try{data=JSON.parse(raw)}catch{return Response.json({error:'模型服务商返回非 JSON 响应（HTTP '+response.status+'），请检查 API 接入地址或服务商状态。',code:'UPSTREAM_FORMAT',upstream_status:response.status},{status:502})}
   if(!response.ok){const hints={401:'API Key 无效或已过期',403:'服务商拒绝访问，请检查 Key 权限或地区限制',404:'接口地址或模型型号不存在',429:'请求频率或账户额度达到限制'};let detail=typeof data.error?.message==='string'?data.error.message:(hints[response.status]||'服务商返回错误');if(apiKey)detail=detail.split(apiKey).join('[REDACTED]');return Response.json({error:detail,code:'UPSTREAM_ERROR',upstream_status:response.status},{status:response.status>=400&&response.status<=599?response.status:502});}
   if(anthropic)return Response.json({choices:[{message:{role:'assistant',content:(data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('\n\n')}}]});
   return Response.json(data);
  }catch(e){let detail=String(e?.message||'unknown').slice(0,500);if(apiKey)detail=detail.split(apiKey).join('[REDACTED]');console.error(JSON.stringify({event:'chat_failed',stage,name:e?.name,detail}));return Response.json({error:'模型转发失败：'+detail,stage,code:e?.name||'UNKNOWN'},{status:502})}
 }
 if(url.pathname!=='/')return new Response('Not found',{status:404});
 return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
export default {async fetch(request){const origin=request.headers.get('Origin');const allowed=['https://xiangjianan.github.io','https://loom-model-workbench.xiang9872.chatgpt.site',new URL(request.url).origin];if(origin&&!allowed.includes(origin))return Response.json({error:'来源不受支持'},{status:403});if(request.method==='OPTIONS'){return new Response(null,{status:204,headers:origin?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600','Vary':'Origin'}:{}})}const response=await handleRequest(request);if(origin){response.headers.set('Access-Control-Allow-Origin',origin);response.headers.set('Vary','Origin')}return response}};
