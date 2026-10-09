import {getPool} from '../../../../server/database.mjs';
import {requireOwner} from '../../../../lib/auth';
import {validOrigin} from '../../../../server/security.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function platformOwner(req:Request){
 const owner=await requireOwner(req);
 const admin=(await getPool().query('SELECT 1 FROM platform_admins WHERE user_id=$1',[owner])).rowCount;
 if(!admin)throw Error('FORBIDDEN');
 return owner;
}
const err=(e:unknown)=>Response.json({error:(e as Error).message==='AUTH_REQUIRED'?'Please sign in.':(e as Error).message==='FORBIDDEN'?'Platform administrators only.':'Operation unavailable.'},{status:(e as Error).message==='AUTH_REQUIRED'?401:(e as Error).message==='FORBIDDEN'?403:503});
export async function GET(req:Request){
 try{
  await platformOwner(req);
  const pool=getPool();
  const [businesses,subscriptions,bookings,pending,ai]=await Promise.all([
   pool.query('SELECT COUNT(*)::int AS count, COUNT(*) FILTER(WHERE is_listed)::int AS listed FROM businesses'),
   pool.query("SELECT plan_code,COUNT(*)::int AS count FROM business_subscriptions GROUP BY plan_code ORDER BY plan_code"),
   pool.query('SELECT COUNT(*)::int AS count FROM appointments'),
   pool.query("SELECT id,slug,name,industry,city,region FROM businesses WHERE listing_requested=TRUE AND is_listed=FALSE AND status='active' ORDER BY created_at LIMIT 50"),
   pool.query('SELECT COALESCE(SUM(estimated_cost_cents),0)::bigint::text AS estimated_cost_cents FROM ai_usage')
  ]);
  return Response.json({businesses:businesses.rows[0],subscriptions:subscriptions.rows,bookings:bookings.rows[0].count,pendingListings:pending.rows,estimatedAiCostCents:ai.rows[0].estimated_cost_cents,financialStatus:'Not configured: Stripe and marketplace charges are not live in v1.3.'},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return err(e);}
}
export async function POST(req:Request){
 if(!validOrigin(req))return Response.json({error:'Invalid origin.'},{status:403});
 try{
  await platformOwner(req);
  const raw=await req.text();if(raw.length>1500)return Response.json({error:'Request too large.'},{status:413});
  const b=JSON.parse(raw);
  if(typeof b.businessId!=='string'||!/^[-a-f0-9]{36}$/.test(b.businessId)||typeof b.approve!=='boolean')
   return Response.json({error:'Invalid listing request.'},{status:400});
  const result=await getPool().query('UPDATE businesses SET is_listed=$1,listing_requested=FALSE,updated_at=now() WHERE id=$2 AND status=$3 RETURNING slug',[b.approve,b.businessId,'active']);
  if(!result.rowCount)return Response.json({error:'Business not found.'},{status:404});
  return Response.json({ok:true,slug:result.rows[0].slug,listed:b.approve},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return err(e);}
}
