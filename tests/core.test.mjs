import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {hashPassword,verifyPassword,tokenHash,validOrigin,cookie,sessionToken} from '../server/security.mjs';
import {executeBatch,postgresSQL,statement} from '../server/database.mjs';

test('passwords use distinct salts and verify without plaintext storage',()=>{
 const password='a-long-test-password-123';const hash=hashPassword(password);
 assert.notEqual(hash,hashPassword(password));assert.ok(verifyPassword(password,hash));assert.ok(!verifyPassword('wrong',hash));assert.ok(!verifyPassword(password,'malformed'));assert.ok(!hash.includes(password));
});
test('session cookies and origin protection',()=>{
 const original=process.env.APP_URL;process.env.APP_URL='https://salon.example';
 try{assert.ok(validOrigin(new Request('http://internal/api',{headers:{origin:'https://salon.example'}})));assert.ok(!validOrigin(new Request('http://internal/api',{headers:{origin:'https://attacker.example'}})));assert.ok(!validOrigin(new Request('http://internal/api')));assert.match(cookie('abc'),/HttpOnly/);assert.match(cookie('abc'),/SameSite=Lax/);assert.equal(sessionToken(new Request('https://salon.example',{headers:{cookie:'other=1; salonflow_session=abc'}})),'abc');assert.notEqual(tokenHash('abc'),'abc');}finally{if(original===undefined)delete process.env.APP_URL;else process.env.APP_URL=original;}
});
test('PostgreSQL adapter uses parameters and conflict-safe audit inserts',()=>{
 assert.equal(postgresSQL('SELECT * FROM settings WHERE owner=?'),'SELECT * FROM settings WHERE owner=$1');
 assert.match(postgresSQL('INSERT OR IGNORE INTO events(id) VALUES(?)'),/^INSERT INTO events\(id\) VALUES\(\$1\) ON CONFLICT DO NOTHING$/);
});
test('PostgreSQL schema: contention, rollback, tenant scope, release and audit idempotency',async()=>{
 const pg=new PGlite();
 try{
 await pg.exec(await readFile(new URL('../migrations/001_initial.sql',import.meta.url),'utf8'));
 await pg.query("INSERT INTO users(id,email,password_hash) VALUES('owner-a','a@example.com','test'),('owner-b','b@example.com','test')");
 let queue=Promise.resolve();
 const pool={async connect(){const previous=queue;let unlock;queue=new Promise(resolve=>unlock=resolve);await previous;return {query:(sql,values)=>pg.query(sql,values),release:()=>unlock()};}};
 const booking=(owner,id,start=540)=>[
 statement('INSERT INTO appointments(id,owner,date,staff,start,duration,data,status) VALUES(?,?,?,?,?,?,?,?)',[id,owner,'2027-01-05','ava',start,60,'{}','Confirmed']),
 ...Array.from({length:4},(_,i)=>statement('INSERT INTO slots(owner,date,staff,minute,appointment) VALUES(?,?,?,?,?)',[owner,'2027-01-05','ava',start+i*15,id]))
 ];
 const attempts=await Promise.allSettled([executeBatch(pool,booking('owner-a','first')),executeBatch(pool,booking('owner-a','second'))]);
 assert.equal(attempts.filter(x=>x.status==='fulfilled').length,1);
 assert.equal((await pg.query('SELECT * FROM appointments')).rows.length,1,'losing transaction rolls back appointment');
 await assert.rejects(executeBatch(pool,booking('owner-a','overlap',570)));
 await executeBatch(pool,booking('owner-b','other-tenant'));
 assert.equal((await pg.query('SELECT * FROM appointments WHERE owner=$1',['owner-a'])).rows.length,1);
 await pg.query('DELETE FROM slots WHERE owner=$1',['owner-a']);
 await executeBatch(pool,booking('owner-a','after-cancel'));
 assert.equal((await pg.query('SELECT * FROM slots WHERE owner=$1',['owner-b'])).rows.length,4);
 const audit=statement('INSERT OR IGNORE INTO events(id,owner,created,kind,data) VALUES(?,?,?,?,?)',['payment-1','owner-a',new Date().toISOString(),'cash_sale','{}']);
 await executeBatch(pool,[audit]);await executeBatch(pool,[audit]);
 assert.equal((await pg.query('SELECT * FROM events')).rows.length,1);
 }finally{await pg.close();}
});
