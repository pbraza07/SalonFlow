import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {getPlatformRole,PRIMARY_PLATFORM_EMAIL} from '../server/platform-roles.mjs';
const read=async file=>readFile(new URL('../'+file,import.meta.url),'utf8');
test('v1.3.12 routes invalid/non-admin sessions to helpful pages instead of a misleading 404',async()=>{
 const route=await read('app/admin/platform/page.tsx');
 assert.doesNotMatch(route,/notFound/);
 assert.match(route,/redirect\('\/admin\/access-denied'\)/);
 assert.match(route,/redirect\('\/login\?next=/);
 assert.match(route,/getPlatformRole\(pool,id\)/);
 const page=await read('app/admin/access-denied/page.tsx');
 assert.match(page,/Switch to administrator account/);assert.match(page,/api\/auth\/logout/);
 const login=await read('app/api/auth/login/route.ts');
 assert.match(login,/const role=await getPlatformRole\(pool,user.id\)/);
 assert.match(login,/const target=role\?'\/admin\/platform'/);
 const dashboard=await read('app/studio/owner-dashboard.tsx');
 assert.match(dashboard,/isPlatformAdmin&&<a className="outline small" href="\/admin\/platform"/);
});
test('v1.3.12 legitimate primary remains admin; ordinary business owner cannot enter',async()=>{
 const pg=new PGlite();
 try{
  for(const migration of ['001_initial.sql','002_public_booking.sql','003_platform_foundation.sql'])await pg.exec(await read('migrations/'+migration));
  await pg.query("INSERT INTO users(id,email,password_hash) VALUES('primary','pbraza@gmail.com','x'),('other','other@example.com','x'),('secondary','secondary@example.com','x')");
  await pg.query("INSERT INTO businesses(id,owner_id,slug,name,industry) VALUES('biz1','primary','crawford','Crawford','barber'),('biz2','other','other-business','Other','barber')");
  await pg.query("INSERT INTO platform_admins(user_id,role) VALUES('primary','primary'),('secondary','admin')");
  assert.equal(PRIMARY_PLATFORM_EMAIL,'pbraza@gmail.com');
  assert.equal(await getPlatformRole(pg,'primary'),'primary');
  assert.equal(await getPlatformRole(pg,'secondary'),'admin');
  assert.equal(await getPlatformRole(pg,'other'),null);
  await pg.query("UPDATE users SET email='changed@example.com' WHERE id='primary'");
  assert.equal(await getPlatformRole(pg,'primary'),null);
 }finally{await pg.close();}
});
test('v1.3.12 protected administrator data API remains gated by role',async()=>{
 const overview=await read('app/api/platform/overview/route.ts');
 assert.match(overview,/getPlatformRole\(getPool\(\),owner\)/);
 assert.match(overview,/if\(!role\)throw Error\('FORBIDDEN'\)/);
 const details=await read('app/api/platform/businesses/[id]/route.ts');
 assert.match(details,/getPlatformRole\(getPool\(\),userId\)/);
});
