import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {getPool} from '../server/database.mjs';
import {hashPassword} from '../server/security.mjs';
import {PRIMARY_PLATFORM_EMAIL} from '../server/platform-roles.mjs';
const email=process.env.ADMIN_EMAIL?.trim().toLowerCase();const password=process.env.ADMIN_PASSWORD;
if(!email||!/^\S+@\S+\.\S+$/.test(email)||!password||password.length<6)throw Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 6 characters) before startup.');
const pool=getPool();const client=await pool.connect();
try{
 await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(81371001)');
 await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
 for(const file of (await readdir(new URL('../migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort()){
  if((await client.query('SELECT 1 FROM schema_migrations WHERE version=$1',[file])).rowCount)continue;
  await client.query(await readFile(new URL('../migrations/'+file,import.meta.url),'utf8'));
  await client.query('INSERT INTO schema_migrations(version) VALUES($1)',[file]);
 }
 // Preserve the original platform admin account after public owner registration begins.
 const existing=(await client.query('SELECT users.id,users.email,users.password_hash FROM platform_admins JOIN users ON users.id=platform_admins.user_id LIMIT 1')).rows[0]||(await client.query('SELECT id,email,password_hash FROM users ORDER BY created_at LIMIT 1')).rows[0];
 if(!existing){await client.query('INSERT INTO users(id,email,password_hash) VALUES($1,$2,$3)',[randomUUID(),email,hashPassword(password)]);}
 else if(existing.email!==email){console.warn('ADMIN_EMAIL differs from original owner. Preserving original credentials and owner identity.');}
 // Backfill the original studio. New owners receive these rows atomically at signup.
 const admin=existing?{id:existing.id}:(await client.query('SELECT id FROM users WHERE email=$1',[email])).rows[0];
 if(!admin)throw Error('Platform admin could not be identified.');
 if(email===PRIMARY_PLATFORM_EMAIL&&(!existing||existing.email===PRIMARY_PLATFORM_EMAIL))await client.query("INSERT INTO platform_admins(user_id,role) VALUES($1,'primary') ON CONFLICT(user_id) DO UPDATE SET role='primary'",[admin.id]);
 const priorSettings=(await client.query('SELECT data FROM settings WHERE owner=$1',[admin.id])).rows[0];
 let studioName='SalonFlow Studio';
 try{studioName=JSON.parse(priorSettings?.data||'{}').name||studioName;}catch{}
 const slug='crawford';
 const conflicting=(await client.query('SELECT owner_id FROM businesses WHERE slug=$1 AND owner_id<>$2',[slug,admin.id])).rows[0];
 if(conflicting)throw Error('Crawford slug conflict; migration stopped without modifying business data.');
 await client.query('UPDATE businesses SET slug=$1,updated_at=now() WHERE owner_id=$2 AND slug<>$1',[slug,admin.id]);
 await client.query("INSERT INTO businesses(id,owner_id,slug,name,industry,created_at) SELECT $1,$2,$3,$4,$5,users.created_at FROM users WHERE users.id=$2 ON CONFLICT(owner_id) DO NOTHING",[randomUUID(),admin.id,slug,studioName,"barber"]);
 const business=(await client.query('SELECT id FROM businesses WHERE owner_id=$1',[admin.id])).rows[0];
 await client.query("INSERT INTO business_memberships(business_id,user_id,role) VALUES($1,$2,'owner') ON CONFLICT DO NOTHING",[business.id,admin.id]);
 await client.query("INSERT INTO business_subscriptions(business_id,plan_code,status) VALUES($1,'free','active') ON CONFLICT DO NOTHING",[business.id]);
 await client.query('DELETE FROM sessions WHERE expires_at<=now()');
 await client.query("DELETE FROM login_attempts WHERE window_start<now()-interval '1 day'");
 await client.query("DELETE FROM public_limits WHERE window_start<now()-interval '1 day'");
 await client.query('COMMIT');console.log('Database migrations and owner account are ready.');
}catch(e){await client.query('ROLLBACK');console.error('Database initialization failed. Check database and administrator environment settings.');throw e;}finally{client.release();await pool.end();}
