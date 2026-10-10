import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const read=async p=>readFile(new URL('../'+p,import.meta.url),'utf8');
test('v1.3.8 marketplace migration activates all approved existing businesses and does not leak unapproved businesses',async()=>{
 const db=new PGlite();try{
  for(const f of ['001_initial.sql','002_public_booking.sql','003_platform_foundation.sql','004_business_customization.sql','005_business_approval_terms.sql']){
    await db.exec(await read('migrations/'+f));
  }
  await db.query("INSERT INTO users(id,email,password_hash) VALUES('a','a@a.com','x'),('b','b@b.com','x'),('c','c@c.com','x'),('d','d@d.com','x'),('e','e@e.com','x')");
  await db.query("INSERT INTO businesses(id,owner_id,slug,name,industry,status,is_listed) VALUES('ba','a','crawford','Crawford','barber','active',FALSE),('bb','b','legacy-studio','Legacy','hair','active',FALSE),('bc','c','pending-spa','Pending','spa','pending',FALSE),('bd','d','declined-spa','Declined','spa','rejected',FALSE),('be','e','closed-shop','Closed','barber','suspended',FALSE)");
  await db.query("INSERT INTO appointments(id,owner,date,staff,start,duration,data,status) VALUES('one','a','2026-12-01','ava',540,60,'{}','Confirmed')");
  await db.exec(await read('migrations/006_marketplace_active_businesses.sql'));
  const published=(await db.query("SELECT slug FROM businesses WHERE status='active' ORDER BY slug")).rows.map(x=>x.slug);
  assert.deepEqual(published,['crawford','legacy-studio']);
  const listed=(await db.query("SELECT slug FROM businesses WHERE is_listed=TRUE ORDER BY slug")).rows.map(x=>x.slug);
  assert.deepEqual(listed,['crawford','legacy-studio']);
  assert.equal((await db.query("SELECT COUNT(*)::int AS count FROM appointments")).rows[0].count,1);
  assert.equal((await db.query("SELECT status FROM businesses WHERE slug='pending-spa'")).rows[0].status,'pending');
  await db.exec(await read('migrations/006_marketplace_active_businesses.sql'));
  assert.equal((await db.query("SELECT COUNT(*)::int AS count FROM businesses WHERE is_listed=TRUE")).rows[0].count,2);
 }finally{await db.close();}
});
test('v1.3.8 admin details have explicit platform authorization and owner-scoped client history',async()=>{
 const route=await read('app/api/platform/businesses/[id]/route.ts');
 assert.match(route,/requireOwner\(req\)/);
 assert.match(route,/getPlatformRole\(getPool\(\),userId\)/);
 assert.match(route,/appointments WHERE owner=\$1/);
 assert.match(route,/service_enrollments WHERE business_id=\$1/);
 assert.match(route,/private, no-store/);
 const market=await read('app/api/marketplace/route.ts');
 assert.match(market,/b.status='active'/);
 assert.doesNotMatch(market,/b.is_listed=TRUE/);
 const overview=await read('app/api/platform/overview/route.ts');
 assert.match(overview,/directory:directory.rows/);
 const admin=await read('app/admin/platform/platform-dashboard.tsx');
 assert.match(admin,/PlatformBusinessDirectory/);
 const directory=await read('app/components/platform-business-directory.tsx');
 assert.match(directory,/Client history/);
 assert.match(directory,/Appointment history/);
 const tracker=await read('app/components/owner-term-tracker.tsx');
 assert.match(tracker,/if\(!hasTermTracking\)return null/);
 assert.match(admin,/termEnrollmentMetrics.length>0/);
});
