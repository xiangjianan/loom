export default {async fetch(request){
 const url=new URL(request.url);
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
}};
