import {getPool} from './database.mjs';
import {tokenHash} from './security.mjs';
import {requireOwner} from '../lib/auth.js';
/** Every subscription belongs to one approved business and one selected reviewer. */
export async function pushContext(req){
 const pool=getPool();
 const bearer=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'')||'';
 if(bearer){
  if(!/^[0-9a-f]{64}$/.test(bearer))throw Error('ACCESS_DENIED');
  const found=(await pool.query("SELECT b.id AS business_id,b.owner_id,l.staff_id AS reviewer,s.data FROM booking_review_links l JOIN businesses b ON b.id=l.business_id JOIN settings s ON s.owner=b.owner_id WHERE l.token_hash=$1 AND l.expires_at>now() AND b.status='active'",[tokenHash(bearer)])).rows[0];
  if(!found)throw Error('ACCESS_DENIED');
  const cfg=JSON.parse(found.data||'{}');
  if(cfg.bookingApprovalEnabled!==true||cfg.bookingApprovalReviewer!==found.reviewer||!cfg.staff?.some(x=>x.id===found.reviewer))throw Error('ACCESS_DENIED');
  return {pool,businessId:found.business_id,ownerId:found.owner_id,reviewer:found.reviewer,settings:cfg};
 }
 let ownerId;
 try{ownerId=await requireOwner(req);}catch{throw Error('ACCESS_DENIED');}
 const found=(await pool.query("SELECT b.id AS business_id,b.owner_id,s.data FROM businesses b JOIN settings s ON s.owner=b.owner_id WHERE b.owner_id=$1 AND b.status='active'",[ownerId])).rows[0];
 if(!found)throw Error('ACCESS_DENIED');
 return {pool,businessId:found.business_id,ownerId,reviewer:'owner',settings:JSON.parse(found.data||'{}')};
}
