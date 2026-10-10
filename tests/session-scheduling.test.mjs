import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {
 validateBookableSessions,validateExistingSessionReservations,bookedSessionCount,
 sessionRemaining,bookingDateRange,computeDayAvailability
} from '../server/session-scheduling.mjs';
import {confirmBooking,serviceCapacityOpen} from '../server/booking-approvals.mjs';

const date='2026-11-02';
const training={id:'training',name:'Group training',duration:60,price:35,maxSlots:1};
const coach={id:'coach',name:'Coach',services:['training']};
const session={id:'group-1',date,staff:'coach',service:'training',start:720,capacity:10};
const config={open:9,close:18,buffer:15,staff:[coach],services:[training],bookableSessions:[session]};
const customer=(id)=>({
 id,staff:'coach',start:720,duration:60,status:'Confirmed',
 data:JSON.stringify({sessionId:session.id,serviceIds:['training']})
});
const windowFor=(appointments=[])=>computeDayAvailability({
 config,date,staff:'coach',services:[training],appointments,reservedSlots:[],
 today:'2026-11-01',nowMinutes:700,capacityOpen:serviceCapacityOpen
});

test('session settings validate business hours, capacity and nonoverlapping coach schedules',()=>{
 assert.equal(validateBookableSessions(config).length,1);
 assert.throws(()=>validateBookableSessions({...config,bookableSessions:[session,{...session,id:'group-2',start:750}]}),/overlap/i);
 assert.throws(()=>validateBookableSessions({...config,bookableSessions:[{...session,capacity:101}]}),/capacity/i);
 assert.throws(()=>validateBookableSessions({...config,bookableSessions:[{...session,start:1065}]}),/hours/i);
 assert.throws(()=>validateBookableSessions({...config,bookableSessions:[{...session,date:'2026-02-30'}]}),/date/i);
});
test('remaining seat counts and normal capacity are independent',()=>{
 const appointments=Array.from({length:7},(_,i)=>customer('booking-'+i));
 assert.equal(bookedSessionCount(appointments,session.id),7);
 assert.equal(sessionRemaining(session,appointments),3);
 const day=windowFor(appointments);
 assert.equal(day.sessionAvailability[720].remaining,3);
 assert.equal(day.sessionAvailability[720].capacity,10);
 assert.equal(day.sessions[0].remaining,3);
 assert.ok(day.slots.includes(720));
 assert.ok(!day.slots.includes(735),'overlapping standard bookings must be blocked');
 assert.ok(serviceCapacityOpen(appointments,[training],600,60),'group members do not consume standard service limit');
 assert.ok(!windowFor([...appointments,...Array.from({length:3},(_,i)=>customer('more-'+i))]).slots.includes(720));
});
test('a confirmed seat prevents destructive session edits',()=>{
 const appointments=[customer('one'),customer('two')];
 assert.throws(()=>validateExistingSessionReservations([session],[],appointments),/confirmed/i);
 assert.throws(()=>validateExistingSessionReservations([session],[{...session,capacity:1}],appointments),/capacity/i);
 assert.throws(()=>validateExistingSessionReservations([session],[{...session,start:735}],appointments),/schedule/i);
 assert.doesNotThrow(()=>validateExistingSessionReservations([session],[{...session,capacity:3}],appointments));
});
test('customer calendar covers day, Sunday-start week and complete month',()=>{
 assert.deepEqual(bookingDateRange('2026-11-04','day'),['2026-11-04']);
 assert.equal(bookingDateRange('2026-11-04','week')[0],'2026-11-01');
 assert.equal(bookingDateRange('2026-11-04','week')[6],'2026-11-07');
 assert.equal(bookingDateRange('2026-11-04','month').length,30);
 assert.equal(bookingDateRange('2028-02-05','month').length,29);
});
test('atomic confirmation serializes concurrent customers and cannot oversell session',async()=>{
 const db=new PGlite();
 try{
  await db.exec(await readFile(new URL('../migrations/001_initial.sql',import.meta.url),'utf8'));
  await db.query("INSERT INTO users(id,email,password_hash) VALUES('owner','owner@example.com','hash')");
  await db.query('INSERT INTO settings(owner,data) VALUES($1,$2)',['owner',JSON.stringify(config)]);
  // PGlite uses one embedded database connection. This pool emulates the
  // transaction-wide advisory lock serialization provided by PostgreSQL.
  let queue=Promise.resolve();
  const pool={async connect(){
   const prior=queue;let release;
   queue=new Promise(resolve=>{release=resolve;});
   await prior;
   return {
    async query(sql,args){if(sql.includes('pg_advisory_xact_lock'))return {rows:[],rowCount:1};return db.query(sql,args);},
    release(){release();}
   };
  }};
  const options=id=>({pool,owner:'owner',services:[training],staff:'coach',
   date,start:720,duration:60,buffer:15,id,data:{sessionId:'group-1',serviceIds:['training'],services:['Group training']}});
  const results=await Promise.allSettled(Array.from({length:11},(_,i)=>confirmBooking(options('customer-'+i))));
  assert.equal(results.filter(x=>x.status==='fulfilled').length,10);
  assert.equal(results.filter(x=>x.status==='rejected'&&x.reason.status===409).length,1);
  assert.equal((await db.query('SELECT COUNT(*)::int AS count FROM appointments')).rows[0].count,10);
  assert.equal((await db.query('SELECT COUNT(*)::int AS count FROM slots')).rows[0].count,0,
   'shared session attendees must not create exclusive staff slot locks');
  await db.query("UPDATE appointments SET status='Cancelled' WHERE id='customer-0'");
  await confirmBooking(options('customer-12'));
  assert.equal((await db.query("SELECT COUNT(*)::int AS count FROM appointments WHERE status='Confirmed'")).rows[0].count,10);
 }finally{await db.close();}
});
