import {randomUUID} from 'node:crypto';
import {getPool} from '../../../../server/database.mjs';
import {requireOwner} from '../../../../lib/auth';
import {hashPassword,validOrigin} from '../../../../server/security.mjs';
import {getPlatformRole,validNewPassword,PRIMARY_PLATFORM_EMAIL} from '../../../../server/platform-roles.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';
const deny=(status:number,message:string)=>Response.json({error:message},{status,headers:{'Cache-Control':'no-store'}});
async function auth(req:Request){const userId=await requireOwner(req);const role=await getPlatformRole(getPool(),userId);return {userId,role};}
export async function GET(req:Request){
 try{const {role}=await auth(req);if(!role)return deny(403,'Platform administrators only.');
 const {rows}=await getPool().query("SELECT u.id,u.email,p.role,u.created_at FROM platform_admins p JOIN users u ON u.id=p.user_id WHERE p.role IN ('primary','admin') ORDER BY CASE WHEN p.role='primary' THEN 0 ELSE 1 END,u.created_at");
 return Response.json({admins:rows,canManageAdmins:role==='primary'},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return deny((e as Error).message==='AUTH_REQUIRED'?401:503,'Unable to load platform administrators.');}
}
export async function POST(req:Request){
 if(!validOrigin(req))return deny(403,'Invalid request origin.');
 try{
 const {userId,role}=await auth(req);if(role!=='primary')return deny(403,'Primary administrator only.');
 const raw=await req.text();if(raw.length>1600)return deny(413,'Request too large.');
 const b=JSON.parse(raw),email=String(b.email||'').trim().toLowerCase(),password=b.password;
 if(!/^\S+@\S+\.\S+$/.test(email)||email.length>254||!validNewPassword(password)||email===PRIMARY_PLATFORM_EMAIL)return deny(400,'Use another administrator email and a 12+ character password.');
 const pool=getPool(),client=await pool.connect();try{
 await client.query('BEGIN');
 if((await client.query('SELECT 1 FROM users WHERE email=$1',[email])).rowCount){await client.query('ROLLBACK');return deny(409,'Email is already registered.');}
 const id=randomUUID();await client.query('INSERT INTO users(id,email,password_hash) VALUES($1,$2,$3)',[id,email,hashPassword(password)]);
 await client.query("INSERT INTO platform_admins(user_id,role,granted_by) VALUES($1,'admin',$2)",[id,userId]);
 await client.query('COMMIT');return Response.json({ok:true,email},{status:201});
 }catch(e){await client.query('ROLLBACK');if((e as {code?:string}).code==='23505')return deny(409,'Administrator exists.');throw e;}finally{client.release();}
 }catch(e){return deny((e as Error).message==='AUTH_REQUIRED'?401:503,'Unable to create administrator.');}
}
export async function DELETE(req:Request){
 if(!validOrigin(req))return deny(403,'Invalid request origin.');
 try{const {role}=await auth(req);if(role!=='primary')return deny(403,'Primary administrator only.');
 const raw=await req.text();if(raw.length>500)return deny(413,'Request too large.');
 const id=JSON.parse(raw).userId;if(typeof id!=='string'||id.length>100)return deny(400,'Invalid administrator.');
 const pool=getPool(),client=await pool.connect();try{await client.query('BEGIN');
 const r=await client.query("DELETE FROM platform_admins WHERE user_id=$1 AND role='admin' RETURNING user_id",[id]);
 if(!r.rowCount){await client.query('ROLLBACK');return deny(404,'Administrator not found or protected.');}
 await client.query('DELETE FROM sessions WHERE user_id=$1',[id]);await client.query('COMMIT');
 return Response.json({ok:true});
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 }catch(e){return deny((e as Error).message==='AUTH_REQUIRED'?401:503,'Unable to revoke administrator.');}
}
