
import {getPool} from './database.mjs';
export function slotCapacity(service){const n=service?.maxSlots??1;return Number.isInteger(n)&&n>=1&&n<=20?n:1;}
export function validSlotCapacity(n){return Number.isInteger(n)&&n>=1&&n<=20;}
export function overlaps(start,duration,otherStart,otherDuration){return start<otherStart+otherDuration&&otherStart<start+duration;}
export function serviceCapacityOpen(existing,services,start,duration){
 return services.every(s=>{
  let busy=0;
  for(const appointment of existing){
   if(['Cancelled','No-show'].includes(appointment.status))continue;
   if(!overlaps(start,duration,Number(appointment.start),Number(appointment.duration)))continue;
   let data={};try{data=typeof appointment.data==='string'?JSON.parse(appointment.data):appointment.data||{};}catch{}
   const ids=Array.isArray(data.serviceIds)?data.serviceIds:[];
   const names=Array.isArray(data.services)?data.services:[];
   if(ids.includes(s.id)||names.includes(s.name))busy++;
  }
  return busy<slotCapacity(s);
 });
}
export async function checkCapacity(pool,owner,date,services,start,duration){
 const appointments=(await pool.query("SELECT start,duration,status,data FROM appointments WHERE owner=$1 AND date=$2 AND status NOT IN ('Cancelled','No-show')",[owner,date])).rows;
 return serviceCapacityOpen(appointments,services,start,duration);
}
/** Atomic staff slot + service capacity booking; advisory lock serializes bookings by business/date. */
/** @param {any} options Booking input validated by owner/team route handlers. */
export async function confirmBooking(options){
 const {owner,services,staff,date,start,duration,buffer,id,data,pendingId=null,expectedReviewer=null}=options;
 const pool=getPool(),client=await pool.connect();
 try{
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[owner+':'+date]);
  if(pendingId){
   const pending=await client.query("SELECT id,status,owner_id,reviewer FROM booking_requests WHERE id=$1 FOR UPDATE",[pendingId]);
   if(!pending.rows[0]||pending.rows[0].owner_id!==owner||pending.rows[0].status!=='pending'||(expectedReviewer&&expectedReviewer!=='owner'&&pending.rows[0].reviewer!==expectedReviewer)){
    const error=new Error('This request has already been reviewed or is unavailable.');error.status=409;throw error;
   }
  }
  const prior=await client.query('SELECT id FROM appointments WHERE id=$1 AND owner=$2',[id,owner]);
  if(prior.rowCount){await client.query('COMMIT');return {id,duplicate:true};}
  if(!await checkCapacity(client,owner,date,services,start,duration)){
   const error=new Error('Service capacity has been reached. Choose another time or team member.');error.status=409;throw error;
  }
  const taken=await client.query('SELECT minute FROM slots WHERE owner=$1 AND date=$2 AND staff=$3 AND minute >= $4 AND minute < $5 LIMIT 1',[owner,date,staff,start,start+duration+buffer]);
  if(taken.rowCount){const error=new Error('The selected staff member is no longer available. Choose another time.');error.status=409;throw error;}
  await client.query("INSERT INTO appointments(id,owner,date,staff,start,duration,data,status) VALUES($1,$2,$3,$4,$5,$6,$7,'Confirmed')",[id,owner,date,staff,start,duration,JSON.stringify(data)]);
  for(let minute=start;minute<start+duration+buffer;minute+=15){
   await client.query('INSERT INTO slots(owner,date,staff,minute,appointment) VALUES($1,$2,$3,$4,$5)',[owner,date,staff,minute,id]);
  }
  if(pendingId){
   await client.query("UPDATE booking_requests SET status='accepted',appointment_id=$1,reviewed_by=$2,reviewed_at=now() WHERE id=$3",[id,data.reviewedBy||'owner',pendingId]);
  }
  await client.query('COMMIT');return {id,duplicate:false};
 }catch(e){await client.query('ROLLBACK');if(e.code==='23505'){const conflict=new Error('That time was booked by another customer. Choose another time.');conflict.status=409;throw conflict;}throw e;}finally{client.release();}
}
