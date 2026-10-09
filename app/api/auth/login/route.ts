import {randomBytes} from 'node:crypto';
import {getPool} from '../../../../server/database.mjs';
import {verifyPassword,tokenHash,validOrigin,cookie} from '../../../../server/security.mjs';
import {dashboardPath} from '../../../../server/route-slugs.mjs';
import {getPlatformRole} from '../../../../server/platform-roles.mjs';
export const runtime='nodejs';
export async function POST(req:Request){
 if(!validOrigin(req))return Response.json({error:'Invalid request origin.'},{status:403});
 try{
  if(Number(req.headers.get('content-length'))>4096)return Response.json({error:'Request too large.'},{status:413});
  const {email,password}=await req.json();
  if(typeof email!=='string'||typeof password!=='string'||email.length>254||password.length<6||password.length>256)return Response.json({error:'Enter a valid email and password.'},{status:400});
  const key=tokenHash(email.trim().toLowerCase());const pool=getPool();
  const rate=await pool.query("INSERT INTO login_attempts(key,count,window_start) VALUES($1,1,now()) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN login_attempts.window_start<now()-interval '15 minutes' THEN 1 ELSE login_attempts.count+1 END, window_start=CASE WHEN login_attempts.window_start<now()-interval '15 minutes' THEN now() ELSE login_attempts.window_start END RETURNING count",[key]);
  if(rate.rows[0].count>10)return Response.json({error:'Too many attempts. Please wait 15 minutes.'},{status:429});
  const user=(await pool.query('SELECT id,password_hash FROM users WHERE email=$1',[email.trim().toLowerCase()])).rows[0];
  if(!user||!verifyPassword(password,user.password_hash))return Response.json({error:'Email or password is incorrect.'},{status:401});
  const token=randomBytes(32).toString('hex');
  await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '12 hours')",[tokenHash(token),user.id]);
  await pool.query('DELETE FROM login_attempts WHERE key=$1',[key]);
  const business=(await pool.query("SELECT slug,status FROM businesses WHERE owner_id=$1 LIMIT 1",[user.id])).rows[0];
  const target=business?(business.status==='active'?dashboardPath(business.slug):'/registration-status'):await getPlatformRole(pool,user.id)?'/admin/platform':'/';
  return Response.json({ok:true,dashboardUrl:target},{headers:{'Set-Cookie':cookie(token),'Cache-Control':'no-store'}});
 }catch(error){console.error('Login unavailable',error);return Response.json({error:'Sign-in is temporarily unavailable. Check the server database configuration.'},{status:503});}
}
