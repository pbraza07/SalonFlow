import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import ts from 'typescript';import {PGlite} from '@electric-sql/pglite';import {postgresSQL,executeBatch} from '../server/database.mjs';import {validOrigin,tokenHash} from '../server/security.mjs';
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const moduleURL=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
test('public booking creates protected owner records; exposes catalog only; rejects conflicts and stale quotes',async()=>{
 const pg=new PGlite();const old=process.env.APP_URL;process.env.APP_URL='https://studio.example';
 try{
 for(const file of ['001_initial.sql','002_public_booking.sql','003_platform_foundation.sql','004_business_customization.sql'])await pg.exec(await readFile(new URL('../migrations/'+file,import.meta.url),'utf8'));
 await pg.query("INSERT INTO users(id,email,password_hash) VALUES('owner','private@example.com','secret-hash')");
 await pg.query("INSERT INTO businesses(id,owner_id,slug,name,industry) VALUES('crawford-biz','owner','crawford','Crawford','barber')");
 let queue=Promise.resolve();const pool={async connect(){const prev=queue;let release;queue=new Promise(r=>release=r);await prev;return {query:(s,v)=>pg.query(s,v),release};}};
 const db=()=>({prepare(sql){return {sql:postgresSQL(sql),values:[],bind(...values){this.values=values;return this;},async first(){return (await pg.query(this.sql,this.values)).rows[0]||null;},async all(){return {results:(await pg.query(this.sql,this.values)).rows};}};},batch:s=>executeBatch(pool,s)});
 const defaults=await import(moduleURL(compile(await readFile(new URL('../lib/defaults.ts',import.meta.url),'utf8'))));
 const terms=await import(moduleURL(compile(await readFile(new URL('../lib/service-terms.ts',import.meta.url),'utf8'))));
 globalThis.__bookingTest={db,requireOwner:async()=>{throw Error('AUTH_REQUIRED');},validOrigin,tokenHash,...defaults,validDuration:terms.validDuration,isCalendarUnit:terms.isCalendarUnit};
 let source=await readFile(new URL('../lib/studio-handler.ts',import.meta.url),'utf8');source=source.replace(/^import .*;$/gm,'');source='const {db,requireOwner,validOrigin,tokenHash,defaultSettings,today,validDuration,isCalendarUnit}=globalThis.__bookingTest;\n'+source;
 const handler=await import(moduleURL(compile(source)));
 const req=body=>new Request('https://studio.example/api/booking',{method:'POST',headers:{origin:'https://studio.example','content-type':'application/json','x-forwarded-for':'198.51.100.25'},body:JSON.stringify(body)});
 const catalog=await (await handler.publicGet(new Request('https://studio.example/api/booking'))).json();
 assert.ok(catalog.config.services.length);assert.equal(catalog.config.products,undefined);assert.equal(catalog.appointments,undefined);assert.doesNotMatch(JSON.stringify(catalog),/private@example|secret-hash/);
 assert.equal((await handler.ownerGet(new Request('https://studio.example/api/studio'))).status,401);
 assert.equal((await handler.studioPost(req({action:'settings',config:{}}),true)).status,403);
 const date=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
 const selection={services:['barber'],staff:'james',date};
 const slots=await (await handler.studioPost(req({action:'availability',...selection}),true)).json();assert.ok(slots.slots.length);
 const booking={action:'book',...selection,start:slots.slots[0],expectedPrice:35,expectedDuration:30,name:'Public Customer',email:'client@example.com',key:crypto.randomUUID(),policyAccepted:true};
 assert.equal((await handler.studioPost(req({...booking,policyAccepted:false}),true)).status,400);
 assert.equal((await handler.studioPost(req({...booking,expectedPrice:1}),true)).status,409);
 let response=await handler.studioPost(req(booking),true);assert.equal(response.status,200);const first=await response.json();assert.ok(first.id);
 response=await handler.studioPost(req(booking),true);assert.equal(response.status,200);assert.equal((await response.json()).id,first.id);
 response=await handler.studioPost(req({...booking,key:crypto.randomUUID(),email:'second@example.com'}),true);assert.equal(response.status,409);
 const rows=(await pg.query('SELECT * FROM appointments')).rows;assert.equal(rows.length,1);assert.equal(rows[0].owner,'owner');assert.equal(JSON.parse(rows[0].data).channel,'Online booking');
 const after=await (await handler.studioPost(req({action:'availability',...selection}),true)).json();assert.ok(!after.slots.includes(booking.start));
 assert.equal((await handler.studioPost(new Request('https://studio.example/api/booking',{method:'POST',headers:{origin:'https://evil.example'},body:JSON.stringify(booking)}),true)).status,403);
 }finally{delete globalThis.__bookingTest;if(old===undefined)delete process.env.APP_URL;else process.env.APP_URL=old;await pg.close();}
});
