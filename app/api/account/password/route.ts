import {getPool} from '../../../../server/database.mjs';
import {requireOwner} from '../../../../lib/auth';
import {verifyPassword,hashPassword,validOrigin,sessionToken,tokenHash} from '../../../../server/security.mjs';
import {validNewPassword} from '../../../../server/platform-roles.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 if(!validOrigin(req))return Response.json({error:'Invalid request origin.'},{status:403});
 try{
  const id=await requireOwner(req),raw=await req.text();
  if(raw.length>2000)return Response.json({error:'Request too large.'},{status:413});
  const {currentPassword,newPassword}=JSON.parse(raw);
  if(typeof currentPassword!=='string'||currentPassword.length>256||!validNewPassword(newPassword)||currentPassword===newPassword)return Response.json({error:'Use your current password and a different new password of at least 12 characters.'},{status:400});
  const pool=getPool();
  const attempts=await pool.query("INSERT INTO login_attempts(key,count,window_start) VALUES($1,1,now()) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN login_attempts.window_start<now()-interval '15 minutes' THEN 1 ELSE login_attempts.count+1 END,window_start=CASE WHEN login_attempts.window_start<now()-interval '15 minutes' THEN now() ELSE login_attempts.count+1 END RETURNING count",['password-change:'+id]);
  if(attempts.rows[0].count>5)return Response.json({error:'Too many attempts. Try again later.'},{status:429});
  const client=await pool.connect();try{
   await client.query('BEGIN');
   const user=(await client.query('SELECT password_hash FROM users WHERE id=$1 FOR UPDATE',[id])).rows[0];
   if(!user||!verifyPassword(currentPassword,user.password_hash)){await client.query('ROLLBACK');return Response.json({error:'Current password is incorrect.'},{status:403});}
   await client.query('UPDATE users SET password_hash=$1 WHERE id=$2',[hashPassword(newPassword),id]);
   const token=sessionToken(req);
   if(token)await client.query('DELETE FROM sessions WHERE user_id=$1 AND token_hash<>$2',[id,tokenHash(token)]);
   await client.query('COMMIT');
   await pool.query('DELETE FROM login_attempts WHERE key=$1',['password-change:'+id]);
   return Response.json({ok:true,message:'Password changed. Other sessions were signed out.'},{headers:{'Cache-Control':'no-store'}});
  }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 }catch(e){return Response.json({error:(e as Error).message==='AUTH_REQUIRED'?'Please sign in.':'Password change is temporarily unavailable.'},{status:(e as Error).message==='AUTH_REQUIRED'?401:503});}
}
