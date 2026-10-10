import {randomBytes} from 'node:crypto';
import {getPool} from '../../../../server/database.mjs';
import {requireOwner} from '../../../../lib/auth';
import {validOrigin,tokenHash} from '../../../../server/security.mjs';
import {reviewPendingRequest} from '../../../../lib/booking-review-actions';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
async function context(req:Request){
 const owner=await requireOwner(req),pool=getPool();
 const business=(await pool.query("SELECT b.id,s.data FROM businesses b JOIN settings s ON s.owner=b.owner_id WHERE b.owner_id=$1 AND b.status='active'",[owner])).rows[0];
 if(!business)throw Error('FORBIDDEN');
 return {owner,pool,business,settings:JSON.parse(business.data||'{}')};
}
function err(e:unknown){const m=(e as Error).message;return Response.json({error:m==='AUTH_REQUIRED'?'Sign in to view booking requests.':m==='FORBIDDEN'?'Business not active.':m},{status:m==='AUTH_REQUIRED'?401:m==='FORBIDDEN'?403:/already|no longer|capacity|available|past|changed/i.test(m)?409:400,headers});}
export async function GET(req:Request){try{const {pool,owner,settings,business}=await context(req);
 const rows=(await pool.query("SELECT id,date,staff_id,start_minute,duration,details,reviewer,status,created_at::text AS created_at FROM booking_requests WHERE owner_id=$1 AND status='pending' ORDER BY created_at DESC LIMIT 100",[owner])).rows;
 return Response.json({enabled:settings.bookingApprovalEnabled===true,reviewer:settings.bookingApprovalReviewer||'owner',
 pending:rows.map((r:{details:string;[key:string]:unknown})=>{const {details,...rest}=r;return {...rest,details:JSON.parse(details)};}),
 pendingCount:rows.length,businessId:business.id},{headers});
 }catch(e){return err(e);}}
export async function POST(req:Request){if(!validOrigin(req))return Response.json({error:'Invalid origin'},{status:403,headers});
 try{
  const {owner,pool,business,settings}=await context(req),raw=await req.text();
  if(raw.length>2500)throw Error('Request too large.');
  const body=JSON.parse(raw);
  if(body.action==='review'&&typeof body.accept==='boolean'){
   return Response.json(await reviewPendingRequest(owner,String(body.id), 'owner',body.accept),{headers});
  }
  if(body.action==='createStaffLink'){
   const staffId=String(body.staffId||'');
   if(settings.bookingApprovalEnabled!==true||settings.bookingApprovalReviewer!==staffId||!settings.staff?.some((s:{id:string})=>s.id===staffId))throw Error('Enable review and choose this team member in Settings before creating an invite.');
   const token=randomBytes(32).toString('hex');
   await pool.query("INSERT INTO booking_review_links(business_id,staff_id,token_hash,expires_at) VALUES($1,$2,$3,now()+interval '30 days') ON CONFLICT(business_id,staff_id) DO UPDATE SET token_hash=excluded.token_hash,expires_at=excluded.expires_at,created_at=now()",[business.id,staffId,tokenHash(token)]);
   return Response.json({ok:true,url:new URL('/team/review/'+token,req.url).toString(),expiresInDays:30},{headers});
  }
  if(body.action==='revokeStaffLink'){
   const staffId=String(body.staffId||'');
   if(!settings.staff?.some((s:{id:string})=>s.id===staffId))throw Error('Invalid team member.');
   await pool.query('DELETE FROM booking_review_links WHERE business_id=$1 AND staff_id=$2',[business.id,staffId]);
   return Response.json({ok:true},{headers});
  }
  return Response.json({error:'Invalid action.'},{status:400,headers});
 }catch(e){return err(e);}
}
