import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {getPool} from '../server/database.mjs';
import {hashPassword,verifyPassword} from '../server/security.mjs';
const email=process.env.ADMIN_EMAIL?.trim().toLowerCase();const password=process.env.ADMIN_PASSWORD;
if(!email||!/^\S+@\S+\.\S+$/.test(email)||!password||password.length<16)throw Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 16 characters) before startup.');
const pool=getPool();const client=await pool.connect();
try{
 await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(81371001)');
 await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
 for(const file of (await readdir(new URL('../migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort()){
  if((await client.query('SELECT 1 FROM schema_migrations WHERE version=$1',[file])).rowCount)continue;
  await client.query(await readFile(new URL('../migrations/'+file,import.meta.url),'utf8'));
  await client.query('INSERT INTO schema_migrations(version) VALUES($1)',[file]);
 }
 const existing=(await client.query('SELECT id,email,password_hash FROM users ORDER BY created_at LIMIT 1')).rows[0];
 if(!existing){await client.query('INSERT INTO users(id,email,password_hash) VALUES($1,$2,$3)',[randomUUID(),email,hashPassword(password)]);}
 else if(existing.email!==email||!verifyPassword(password,existing.password_hash)){
  await client.query('UPDATE users SET email=$1,password_hash=$2 WHERE id=$3',[email,hashPassword(password),existing.id]);
  await client.query('DELETE FROM sessions WHERE user_id=$1',[existing.id]);
 }
 await client.query('DELETE FROM sessions WHERE expires_at<=now()');
 await client.query("DELETE FROM login_attempts WHERE window_start<now()-interval '1 day'");
 await client.query('COMMIT');console.log('Database migrations and owner account are ready.');
}catch(e){await client.query('ROLLBACK');console.error('Database initialization failed. Check database and administrator environment settings.');throw e;}finally{client.release();await pool.end();}
