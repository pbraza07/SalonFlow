import {getPool} from '../server/database.mjs';
import {sessionToken,tokenHash} from '../server/security.mjs';
export async function requireOwner(req:Request):Promise<string>{
 const token=sessionToken(req);
 if(!token||!/^[a-f0-9]{64}$/.test(token))throw new Error('AUTH_REQUIRED');
 const result=await getPool().query('SELECT users.id FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token_hash=$1 AND sessions.expires_at>now()',[tokenHash(token)]);
 if(!result.rows[0])throw new Error('AUTH_REQUIRED');
 return result.rows[0].id;
}
