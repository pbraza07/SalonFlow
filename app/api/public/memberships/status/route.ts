import {getPool} from '../../../../../server/database.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(req:Request){
 const url=new URL(req.url),slug=url.searchParams.get('slug')||'',session=url.searchParams.get('session_id')||'';
 if(!/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/.test(slug)||!/^cs_(test_|live_)[A-Za-z0-9_]+$/.test(session))
  return Response.json({status:'unavailable'},{status:400,headers:{'Cache-Control':'no-store'}});
 try{
  const result=await getPool().query("SELECT m.status,m.paid_through,p.name AS plan_name FROM customer_memberships m JOIN businesses b ON b.id=m.business_id JOIN membership_plans p ON p.id=m.plan_id WHERE b.slug=$1 AND b.status='active' AND m.stripe_checkout_session_id=$2 LIMIT 1",[slug,session]);
  if(!result.rows.length)return Response.json({status:'pending_payment'},{headers:{'Cache-Control':'no-store'}});
  const row=result.rows[0];
  return Response.json({status:row.status,plan:row.plan_name,paidThrough:row.paid_through},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({status:'unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
