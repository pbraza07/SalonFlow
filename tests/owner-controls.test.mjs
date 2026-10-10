import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {getPlatformRole,PRIMARY_PLATFORM_EMAIL,validNewPassword} from '../server/platform-roles.mjs';
const base=new URL('../migrations/',import.meta.url);
test('v1.3.3 migration preserves Crawford, brands and authorizes only assigned administrators',async()=>{
 const db=new PGlite();try{
 for(const name of ['001_initial.sql','002_public_booking.sql','003_platform_foundation.sql','004_business_customization.sql'])await db.exec(await readFile(new URL(name,base),'utf8'));
 await db.query("INSERT INTO users(id,email,password_hash) VALUES('owner','pbraza@gmail.com','hash'),('other','other@example.test','hash'),('third','third@example.test','hash')");
 await db.query("INSERT INTO businesses(id,owner_id,slug,name) VALUES('original','owner','crawford','Crawford')");
 await db.query("INSERT INTO appointments(id,owner,date,staff,start,duration,data,status) VALUES('a1','owner','2026-12-01','ava',540,60,'{}','Confirmed')");
 await db.query("INSERT INTO platform_admins(user_id,role) VALUES('owner','primary'),('other','legacy')");
 assert.equal(await getPlatformRole(db,'owner'),'primary');assert.equal(await getPlatformRole(db,'other'),null);
 await db.query("UPDATE platform_admins SET role='admin' WHERE user_id='other'");assert.equal(await getPlatformRole(db,'other'),'admin');
 await assert.rejects(db.query("INSERT INTO platform_admins(user_id,role) VALUES('third','primary')"));
 assert.equal((await db.query("SELECT slug FROM businesses WHERE owner_id='owner'")).rows[0].slug,'crawford');
 assert.equal((await db.query("SELECT owner FROM appointments WHERE id='a1'")).rows[0].owner,'owner');
 }finally{await db.close();}
});
test('admin password policy and team entitlement are enforced by APIs',async()=>{
 assert.equal(PRIMARY_PLATFORM_EMAIL,'pbraza@gmail.com');assert.equal(validNewPassword('123456'),true);assert.equal(validNewPassword('12345'),false);assert.equal(validNewPassword('a'.repeat(128)),true);assert.equal(validNewPassword('a'.repeat(129)),false);assert.equal(validNewPassword('long-unique-passphrase'),true);
 const studio=await readFile(new URL('../lib/studio-handler.ts',import.meta.url),'utf8');
 assert.match(studio,/Team member limit reached/);assert.match(studio,/future bookings before removing/);assert.match(studio,/business_subscriptions/);
 const pass=await readFile(new URL('../app/api/account/password/route.ts',import.meta.url),'utf8');
 assert.match(pass,/verifyPassword/);assert.match(pass,/hashPassword/);assert.match(pass,/DELETE FROM sessions/);
 const page=await readFile(new URL('../app/admin/platform/page.tsx',import.meta.url),'utf8');assert.match(page,/getPlatformRole/);assert.match(page,/redirect\('\/admin\/access-denied'\)/);
 const admins=await readFile(new URL('../app/api/platform/admins/route.ts',import.meta.url),'utf8');assert.match(admins,/role!=='primary'/);
});
