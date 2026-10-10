import {randomBytes,randomUUID} from 'node:crypto';
import {getPool} from '../../../../server/database.mjs';
import {requireOwner} from '../../../../lib/auth';
import {hashPassword,validOrigin} from '../../../../server/security.mjs';
import {getPlatformRole} from '../../../../server/platform-roles.mjs';
import {isReservedBusinessSlug} from '../../../../server/route-slugs.mjs';
import {BUSINESS_INDUSTRIES,canonicalState} from '../../../../lib/business-options';
import {defaultSettings} from '../../../../lib/defaults';
import {validateManagedBusiness,canChangeManagedStatus,canArchiveBusiness} from '../../../../server/platform-business-management.mjs';

export const runtime='nodejs';export const dynamic='force-dynamic';
const h={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const industries=BUSINESS_INDUSTRIES.map(([id])=>id) as string[];
const idOk=(v:unknown)=>typeof v==='string'&&/^[0-9a-f-]{36}$/i.test(v);
const loggable=(row:any)=>row?{
 id:row.id,name:row.name,slug:row.slug,industry:row.industry,description:row.description,
 city:row.city,region:row.region,status:row.status,is_listed:row.is_listed,owner_id:row.owner_id
}:null;
function failure(e:unknown){
 const msg=(e as Error).message||'Unable to manage business.';
 const status=msg==='AUTH_REQUIRED'?401:msg==='FORBIDDEN'?403:
  /already|exists|reserved|active paid|payment|archiv|conflict|changed/i.test(msg)?409:
  /invalid|enter|choose|requires|cannot|only|confirm|valid|not found/i.test(msg)?400:503;
 return Response.json({error:msg==='AUTH_REQUIRED'?'Please sign in.':msg==='FORBIDDEN'?'Platform administrator access required.':status===503?'Business operation unavailable.':msg},{status,headers:h});
}
export async function POST(req:Request){
 if(!validOrigin(req))return Response.json({error:'Invalid origin.'},{status:403,headers:h});
 let client:any;
 try{
  const pool=getPool(),actor=await requireOwner(req),role=await getPlatformRole(pool,actor);
  if(!role)throw Error('FORBIDDEN');
  const raw=await req.text();if(raw.length>8000)throw Error('Invalid business request size.');
  const payload=JSON.parse(raw),action=payload.action;
  if(!['create','edit','archive','restore'].includes(action))throw Error('Invalid business operation.');
  client=await pool.connect();
  await client.query('BEGIN');
  if(action==='create'){
   const input=validateManagedBusiness(payload,industries,[]);
   if(isReservedBusinessSlug(input.slug))throw Error('This business booking URL is reserved.');
   const ownerEmail=String(payload.ownerEmail||'').trim().toLowerCase();
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)||ownerEmail.length>254)throw Error('Enter a valid owner email.');
   const collision=await client.query('SELECT id FROM users WHERE email=$1',[ownerEmail]);
   if(collision.rowCount)throw Error('This owner email already exists. Use a new business owner email or the existing business account.');
   const ownerId=randomUUID(),businessId=randomUUID(),tempPassword=randomBytes(18).toString('base64url');
   const pending=role!=='primary'||payload.activateImmediately!==true;
   const status=pending?'pending':'active';
   const config={...structuredClone(defaultSettings),name:input.name,tagline:input.industry,
    services:[],staff:[],products:[],phone:'',address:'',timezone:'America/New_York',
    greeting:'Welcome! How can we help?'};
   await client.query('INSERT INTO users(id,email,password_hash) VALUES($1,$2,$3)',
    [ownerId,ownerEmail,hashPassword(tempPassword)]);
   await client.query(
    'INSERT INTO businesses(id,owner_id,slug,name,industry,description,city,region,status,is_listed,listing_requested) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,FALSE)',
    [businessId,ownerId,input.slug,input.name,input.industry,input.description,input.city,input.region,status,!pending]);
   await client.query("INSERT INTO business_memberships(business_id,user_id,role) VALUES($1,$2,'owner')",[businessId,ownerId]);
   await client.query("INSERT INTO business_subscriptions(business_id,plan_code,status) VALUES($1,'free','active')",[businessId]);
   await client.query('INSERT INTO settings(owner,data) VALUES($1,$2)',[ownerId,JSON.stringify(config)]);
   const after={...input,id:businessId,owner_id:ownerId,status,is_listed:!pending};
   await client.query('INSERT INTO platform_business_audit(id,business_id,actor_id,action,before_record,after_record) VALUES($1,$2,$3,$4,NULL,$5::jsonb)',
    [randomUUID(),businessId,actor,'create',JSON.stringify(after)]);
   await client.query('COMMIT');client.release();client=null;
   return Response.json({ok:true,id:businessId,status,slug:input.slug,ownerEmail,temporaryPassword:tempPassword,
    message:pending?'Created pending business approval. Share the new owner credentials securely.':'Business is active. Share new owner credentials securely; the owner should change the password.'},{headers:h,status:201});
  }
  if(!idOk(payload.id))throw Error('Invalid business identifier.');
  const loaded=await client.query('SELECT * FROM businesses WHERE id=$1 FOR UPDATE',[payload.id]);
  const before=loaded.rows[0];if(!before)throw Error('Business not found.');
  let after:any={...before},kind=action;
  if(action==='edit'){
   const data=validateManagedBusiness(payload,industries,[]);
   if(isReservedBusinessSlug(data.slug)&&data.slug!==before.slug)throw Error('This business booking URL is reserved.');
   if(payload.status!==undefined&&typeof payload.status!=='string')throw Error('Invalid business status.');
   const status=payload.status===undefined?before.status:payload.status;
   if(!canChangeManagedStatus(role,before.status,status))throw Error('Only the primary administrator can approve unapproved businesses or alter pending registration status.');
   if(before.status==='archived'&&status!=='archived')throw Error('Restore an archived business before editing its status.');
   const listed=status==='active' && payload.listed!==false;
   const changed=await client.query(
    'UPDATE businesses SET name=$1,slug=$2,industry=$3,description=$4,city=$5,region=$6,status=$7,is_listed=$8,listing_requested=FALSE,updated_at=now() WHERE id=$9 RETURNING *',
    [data.name,data.slug,data.industry,data.description,data.city,data.region,status,listed,payload.id]);
   after=changed.rows[0];kind=before.status!==status?(status==='active'?'activate':'suspend'):'edit';
   // Business owner details and customized settings continue to be the same tenant.
   const settings=(await client.query('SELECT data FROM settings WHERE owner=$1 FOR UPDATE',[before.owner_id])).rows[0];
   if(settings){
    const cfg=JSON.parse(settings.data||'{}');cfg.name=data.name;cfg.tagline=data.industry;
    await client.query('UPDATE settings SET data=$1 WHERE owner=$2',[JSON.stringify(cfg),before.owner_id]);
   }
  }else if(action==='archive'){
   if(before.status==='archived')throw Error('Business is already archived.');
   if(payload.confirmName!==before.name)throw Error('Confirm the exact business name before removal.');
   // Stop the application access, but avoid leaving connected customer recurring
   // charges behind by requiring owner/admin to end paid contracts first.
   const pay=await client.query(
    "SELECT COUNT(*)::int AS count FROM customer_memberships WHERE business_id=$1 AND status IN ('active','past_due','pending_payment')",
    [before.id]);
   const platformSub=await client.query('SELECT stripe_subscription_id,status FROM business_subscriptions WHERE business_id=$1',[before.id]);
   const subscribed=!!platformSub.rows[0]?.stripe_subscription_id&&platformSub.rows[0]?.status==='active';
   if(!canArchiveBusiness({members:pay.rows[0]?.count||0,subscribed}))
    throw Error('Cannot remove a business with active or pending paid memberships/subscriptions. Resolve recurring billing first.');
   const changed=await client.query(
    "UPDATE businesses SET status='archived',is_listed=FALSE,listing_requested=FALSE,updated_at=now() WHERE id=$1 RETURNING *",
    [before.id]);after=changed.rows[0];
  }else if(action==='restore'){
   if(before.status!=='archived')throw Error('Only archived businesses can be restored.');
   // Restore privately as suspended, so no public booking is re-enabled
   // before the platform administrator reviews the old record.
   const changed=await client.query(
    "UPDATE businesses SET status='suspended',is_listed=FALSE,listing_requested=FALSE,updated_at=now() WHERE id=$1 RETURNING *",
    [before.id]);after=changed.rows[0];
  }
  await client.query(
   'INSERT INTO platform_business_audit(id,business_id,actor_id,action,before_record,after_record) VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb)',
   [randomUUID(),before.id,actor,kind,JSON.stringify(loggable(before)),JSON.stringify(loggable(after))]);
  await client.query('COMMIT');client.release();client=null;
  return Response.json({ok:true,business:loggable(after),
   message:action==='archive'?'Business removed from public access; records retained.':action==='restore'?'Business restored as suspended. Review and reactivate when ready.':'Business information saved.'},{headers:h});
 }catch(e){
  if(client){try{await client.query('ROLLBACK')}catch{}client.release();}
  if((e as {code?:string})?.code==='23505')return Response.json({error:'Business URL or owner email is already in use.'},{status:409,headers:h});
  return failure(e);
 }
}
