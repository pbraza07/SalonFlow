import {getPool} from '../../../../../server/database.mjs';
import {requireOwner} from '../../../../../lib/auth';
import {getPlatformRole} from '../../../../../server/platform-roles.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
type StoredBooking={name?:unknown;email?:unknown;phone?:unknown;services?:unknown;price?:unknown;channel?:unknown};
const clean=(x:unknown,max=200)=>typeof x==='string'?x.slice(0,max):'';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const userId=await requireOwner(req);
  if(!await getPlatformRole(getPool(),userId))return Response.json({error:'Platform administrators only.'},{status:403,headers});
  const {id}=await params;
  if(!/^[a-f0-9-]{36}$/i.test(id))return Response.json({error:'Invalid business identifier.'},{status:400,headers});
  const pool=getPool();
  const result=await pool.query("SELECT b.id,b.owner_id,b.slug,b.name,b.industry,b.description,b.business_model,b.city,b.region,b.status,b.is_listed,b.created_at::text AS created_at,b.updated_at::text AS updated_at,u.email AS owner_email,s.plan_code,s.status AS subscription_status,st.data AS settings_data FROM businesses b JOIN users u ON u.id=b.owner_id LEFT JOIN business_subscriptions s ON s.business_id=b.id LEFT JOIN settings st ON st.owner=b.owner_id WHERE b.id=$1",[id]);
  const b=result.rows[0];if(!b)return Response.json({error:'Business not found.'},{status:404,headers});
  const settings=(()=>{try{return JSON.parse(b.settings_data||'{}')}catch{return {}}})();
  const [history,total,terms]=await Promise.all([
   pool.query("SELECT id,date,staff,start,duration,status,data FROM appointments WHERE owner=$1 ORDER BY date DESC,start DESC LIMIT 200",[b.owner_id]),
   pool.query("SELECT COUNT(*)::int AS appointment_count,COUNT(DISTINCT NULLIF(lower(data::jsonb->>'email'),''))::int AS unique_clients FROM appointments WHERE owner=$1",[b.owner_id]),
   pool.query("SELECT id,service_name,duration_value,duration_unit,client_name,client_email,starts_on::text AS starts_on,ends_on::text AS ends_on,status FROM service_enrollments WHERE business_id=$1 ORDER BY created_at DESC LIMIT 100",[b.id])
  ]);
  const appointments=history.rows.map(row=>{
   let a:StoredBooking={};try{a=JSON.parse(row.data||'{}')}catch{}
   return {id:row.id,date:row.date,staff:row.staff,start:row.start,duration:row.duration,status:row.status,
    customerName:clean(a.name,100),customerEmail:clean(a.email,200),customerPhone:clean(a.phone,40),
    services:Array.isArray(a.services)?a.services.filter((x:unknown)=>typeof x==='string').slice(0,12).map(x=>clean(x,100)):[],
    quotedPrice:typeof a.price==='number'&&Number.isFinite(a.price)?a.price:0,
    channel:clean(a.channel,50)};
  });
  const clientMap=new Map<string,{name:string;email:string;visits:number;lastDate:string}>();
  for(const ap of appointments){const key=(ap.customerEmail||ap.customerName).trim().toLowerCase();if(!key)continue;
   const old=clientMap.get(key);if(old){old.visits++;if(ap.date>old.lastDate)old.lastDate=ap.date;}
   else clientMap.set(key,{name:ap.customerName,email:ap.customerEmail,visits:1,lastDate:ap.date});
  }
  const services=Array.isArray(settings.services)?settings.services.slice(0,150).map((s:Record<string,unknown>)=>({
   id:clean(s.id,80),name:clean(s.name,100),type:clean(s.category,60),duration:s.duration,
   durationValue:s.durationValue,durationUnit:clean(s.durationUnit||'minutes',20),
   price:typeof s.price==='number'?s.price:null
  })):[];
  const team=Array.isArray(settings.staff)?settings.staff.slice(0,100).map((s:Record<string,unknown>)=>({name:clean(s.name,100),role:clean(s.role,100)})):[];
  return Response.json({business:{
   id:b.id,slug:b.slug,name:b.name,industry:b.industry,description:b.description,businessModel:b.business_model,
   city:b.city,region:b.region,ownerEmail:b.owner_email,status:b.status,isListed:b.is_listed,
   createdAt:b.created_at,updatedAt:b.updated_at,plan:b.plan_code||'free',subscriptionStatus:b.subscription_status||'',
   address:clean(settings.address,350),phone:clean(settings.phone,40),services,team},
   history:{totalAppointments:total.rows[0].appointment_count,uniqueClients:total.rows[0].unique_clients,
    appointments,clients:[...clientMap.values()].sort((a,b)=>b.lastDate.localeCompare(a.lastDate))},
   ...(terms.rows.length?{termEnrollments:terms.rows}:{}),
   historyLimit:200
  },{headers});
 }catch(e){if((e as Error).message==='AUTH_REQUIRED')return Response.json({error:'Please sign in.'},{status:401,headers});
  console.error('Protected business detail unavailable',e);return Response.json({error:'Business details are temporarily unavailable.'},{status:503,headers});}
}
