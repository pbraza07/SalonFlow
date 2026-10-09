import {randomUUID} from 'node:crypto';
import {getPool} from '../../../../server/database.mjs';
import {requireOwner} from '../../../../lib/auth';
import {validOrigin} from '../../../../server/security.mjs';
import {isTermUnit,normalizedDuration,endDateForTerm} from '../../../../lib/service-terms';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
async function context(req:Request){
 const owner=await requireOwner(req),pool=getPool();
 const b=(await pool.query("SELECT b.id,s.data FROM businesses b JOIN settings s ON s.owner=b.owner_id WHERE b.owner_id=$1 AND b.status='active'",[owner])).rows[0];
 if(!b)throw Error('FORBIDDEN');
 return {pool,b,owner};
}
function error(e:unknown){const msg=(e as Error).message;return Response.json({error:msg==='AUTH_REQUIRED'?'Please sign in.':msg==='FORBIDDEN'?'Business not yet approved.':msg},{status:msg==='AUTH_REQUIRED'?401:msg==='FORBIDDEN'?403:400,headers});}
export async function GET(req:Request){
 try{const {pool,b}=await context(req);
 const result=await pool.query("SELECT id,service_id,service_name,duration_value,duration_unit,client_name,client_email,starts_on::text AS starts_on,ends_on::text AS ends_on,status,created_at::text AS created_at FROM service_enrollments WHERE business_id=$1 ORDER BY created_at DESC LIMIT 300",[b.id]);
 const counts=(await pool.query("SELECT duration_unit,COUNT(*)::int AS total,COUNT(*) FILTER(WHERE status='active' AND ends_on>=CURRENT_DATE)::int AS active FROM service_enrollments WHERE business_id=$1 GROUP BY duration_unit",[b.id])).rows;
 return Response.json({enrollments:result.rows,counts},{headers});
 }catch(e){return error(e);}
}
export async function POST(req:Request){
 if(!validOrigin(req))return Response.json({error:'Invalid origin.'},{status:403,headers});
 try{const {pool,b}=await context(req);
 const raw=await req.text();if(raw.length>2500)return Response.json({error:'Request too large.'},{status:413,headers});
 const input=JSON.parse(raw);
 if(input.action==='enroll'){
  const settings=JSON.parse(b.data),service=(settings.services||[]).find((s:{id:string})=>s.id===input.serviceId);
  if(!service)throw Error('Choose a valid service.');
  const {unit,value}=normalizedDuration(service);
  if(!isTermUnit(unit)||!Number.isInteger(value)||value<1||value>365)throw Error('Choose a term service (day, week, month, year).');
  if(typeof input.clientName!=='string'||!input.clientName.trim()||input.clientName.length>100)throw Error('Enter a customer name.');
  if(typeof input.clientEmail!=='string'||input.clientEmail.length>200||(input.clientEmail&&!/^\S+@\S+\.\S+$/.test(input.clientEmail)))throw Error('Enter a valid customer email.');
  const start=String(input.startsOn||''),end=endDateForTerm(start,value,unit);
  const id=randomUUID();
  await pool.query("INSERT INTO service_enrollments(id,business_id,service_id,service_name,duration_value,duration_unit,client_name,client_email,starts_on,ends_on) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",[id,b.id,service.id,service.name,value,unit,input.clientName.trim(),input.clientEmail.trim(),start,end]);
  return Response.json({ok:true,id,startsOn:start,endsOn:end},{headers});
 }
 if(input.action==='status'){
  if(typeof input.id!=='string'||!/^[0-9a-f-]{36}$/.test(input.id)||!['cancelled','completed'].includes(input.status))throw Error('Invalid service enrollment update.');
  const updated=await pool.query("UPDATE service_enrollments SET status=$1,updated_at=now() WHERE id=$2 AND business_id=$3 AND status='active' RETURNING id",[input.status,input.id,b.id]);
  if(!updated.rowCount)return Response.json({error:'Active enrollment not found.'},{status:404,headers});
  return Response.json({ok:true},{headers});
 }
 return Response.json({error:'Invalid service enrollment action.'},{status:400,headers});
 }catch(e){return error(e);}
}
