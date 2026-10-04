export default {async fetch(request){
 const url=new URL(request.url);
 if(url.pathname==='/api/chat'&&request.method==='POST'){
  try{
   const {endpoint,key,model,messages,protocol}=await request.json();const target=new URL(endpoint);
   if(target.protocol!=='https:'||target.username||target.password||/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[)/i.test(target.hostname))return Response.json({error:'请使用公共 HTTPS 模型接口'},{status:400});
   if(!key||!model||!Array.isArray(messages))return Response.json({error:'模型配置不完整'},{status:400});
   const anthropic=protocol==='anthropic';
   const response=await fetch(endpoint.replace(/\/$/,'')+(anthropic?'/messages':'/chat/completions'),{method:'POST',redirect:'error',headers:anthropic?{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'}:{'Content-Type':'application/json','Authorization':'Bearer '+key},body:JSON.stringify(anthropic?{model,messages,max_tokens:8192}:{model,messages,stream:false}),signal:AbortSignal.timeout(120000)});
   const data=await response.json();if(!response.ok)return Response.json({error:data.error?.message||'服务商返回错误 '+response.status},{status:502});
   if(anthropic)return Response.json({choices:[{message:{role:'assistant',content:(data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('\n\n')}}]});
   return Response.json(data);
  }catch{return Response.json({error:'模型连接失败或请求超时，请检查接口地址和 Key'},{status:502})}
 }
 if(url.pathname!=='/')return new Response('Not found',{status:404});
 return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}};
