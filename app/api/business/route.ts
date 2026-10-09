import {getPool} from '../../../server/database.mjs';
import {requireOwner} from '../../../lib/auth';
import {validOrigin} from '../../../server/security.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const noStore={'Cache-Control':'no-store'};
export async function GET(req:Request){
 try{
  const owner=await requireOwner(req);
  const row=(await getPool().query('SELECT b.id,b.slug,b.name,b.industry,b.description,b.city,b.region,b.is_listed,b.listing_requested,s.plan_code,s.ai_addon FROM businesses b JOIN business_subscriptions s ON s.business_id=b.id WHERE b.owner_id=$1',[owner])).rows[0];
  return Response.json({business:row||null},{headers:noStore});
 }catch(e){return Response.json({error:(e as Error).message==='AUTH_REQUIRED'?'Please sign in.':'Unavailable.'},{status:(e as Error).message==='AUTH_REQUIRED'?401:503});}
}
export async function POST(req:Request){
 if(!validOrigin(req))return Response.json({error:'Invalid origin.'},{status:403});
 try{
  const owner=await requireOwner(req),b=await req.json();
  const name=String(b.name||'').trim(),description=String(b.description||'').trim(),city=String(b.city||'').trim(),region=String(b.region||'').trim();
  if(name.length<2||name.length>100||description.length>600||city.length>80||region.length>80||typeof b.requestListing!=='boolean')
   return Response.json({error:'Check business profile information.'},{status:400});
  const pool=getPool(),client=await pool.connect();
  try{
   await client.query('BEGIN');
   const record=(await client.query('SELECT id FROM businesses WHERE owner_id=$1 FOR UPDATE',[owner])).rows[0];
   if(!record){await client.query('ROLLBACK');return Response.json({error:'Business not found.'},{status:404});}
   const settingsRow=(await client.query('SELECT data FROM settings WHERE owner=$1 FOR UPDATE',[owner])).rows[0];
   const settings=settingsRow?JSON.parse(settingsRow.data):null;
   if(b.requestListing&&(!settings?.services?.length||!settings?.staff?.length))
    {await client.query('ROLLBACK');return Response.json({error:'Add at least one service and team member before requesting a listing.'},{status:400});}
   await client.query('UPDATE businesses SET name=$1,description=$2,city=$3,region=$4,listing_requested=CASE WHEN $5 THEN TRUE ELSE listing_requested END,updated_at=now() WHERE owner_id=$6',[name,description,city,region,b.requestListing,owner]);
   if(settings){settings.name=name;await client.query('UPDATE settings SET data=$1 WHERE owner=$2',[JSON.stringify(settings),owner]);}
   await client.query('COMMIT');
   return Response.json({ok:true,listingPending:!!b.requestListing},{headers:noStore});
  }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 }catch(e){return Response.json({error:(e as Error).message==='AUTH_REQUIRED'?'Please sign in.':'Unable to save the business profile.'},{status:(e as Error).message==='AUTH_REQUIRED'?401:503});}
}
