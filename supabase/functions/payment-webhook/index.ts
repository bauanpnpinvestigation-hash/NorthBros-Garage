import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabaseUrl=Deno.env.get("SUPABASE_URL")!; const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false}});
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json"}});
function hex(bytes:ArrayBuffer){return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,"0")).join("");}
function safeEqual(a:string,b:string){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
async function hmac(secret:string,message:string){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return hex(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(message)));}
async function verifyGeneric(body:string,signature:string|null,secret:string){if(!signature)return false;return safeEqual(await hmac(secret,body),signature);}
async function verifyStripe(body:string,signature:string|null,secret:string){if(!signature)return false;const parts=signature.split(",").map(x=>x.split("="));const timestamp=parts.find(x=>x[0]==="t")?.[1];const signatures=parts.filter(x=>x[0]==="v1").map(x=>x[1]);if(!timestamp||!signatures.length)return false;const age=Math.abs(Date.now()/1000-Number(timestamp));if(!Number.isFinite(age)||age>300)return false;const expected=await hmac(secret,timestamp+"."+body);return signatures.some(v=>safeEqual(expected,v));}
Deno.serve(async(req)=>{
 if(req.method!=="POST")return json({error:"Method not allowed."},405);
 const provider=(req.headers.get("x-payment-provider")??"generic").toLowerCase(); const rawBody=await req.text(); let verified=false;
 if(provider==="stripe"){const secret=Deno.env.get("STRIPE_WEBHOOK_SECRET");if(!secret)return json({error:"Stripe webhook secret is not configured."},503);verified=await verifyStripe(rawBody,req.headers.get("stripe-signature"),secret);}
 else {const secret=Deno.env.get("PAYMENT_WEBHOOK_SECRET");if(!secret)return json({error:"Generic webhook secret is not configured."},503);verified=await verifyGeneric(rawBody,req.headers.get("x-payment-signature"),secret);}
 if(!verified)return json({error:"Invalid webhook signature."},401);
 let incoming: any;
 try { incoming=JSON.parse(rawBody); } catch { return json({error:"Invalid JSON body."},400); }
 let normalized:Record<string,unknown>;
 if(provider==="stripe"){const eventType=String(incoming.type??"");const object=incoming?.data?.object??{};let normalizedType:string|null=null;
  if(eventType==="checkout.session.completed")normalizedType="payment.succeeded";else if(eventType==="payment_intent.succeeded")normalizedType="payment.succeeded";else if(eventType==="payment_intent.payment_failed")normalizedType="payment.failed";
  else if(eventType==="charge.refunded"){const amount=Number(object.amount??0)/100;const refunded=Number(object.amount_refunded??0)/100;normalizedType=refunded>=amount?"payment.refunded":"payment.partially_refunded";}
  if(!normalizedType)return json({ok:true,ignored:true});
  normalized={payment_id:object?.metadata?.payment_id??object?.payment_intent?.metadata?.payment_id,order_id:object?.metadata?.order_id??object?.payment_intent?.metadata?.order_id,provider_payment_id:object?.id??object?.payment_intent?.id??object?.payment_intent,provider_checkout_id:object?.id,provider_reference:object?.charge,paid_amount:object?.amount_total?Number(object.amount_total)/100:undefined,amount:object?.amount?Number(object.amount)/100:undefined,refunded_amount:object?.amount_refunded?Number(object.amount_refunded)/100:undefined,failure_code:object?.last_payment_error?.code,failure_message:object?.last_payment_error?.message,event_type:normalizedType,raw:incoming};
 } else normalized=incoming;
 const {data,error}=await supabase.rpc("process_payment_event",{p_provider:provider,p_provider_event_id:String(incoming.id??incoming.provider_event_id),p_event_type:String(normalized.event_type),p_payload:normalized,p_signature_verified:true});
 if(error)return json({error:error.message},500); return json(data??{ok:true});
});