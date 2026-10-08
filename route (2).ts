import {getPool} from '../../../../server/database.mjs';
import {sessionToken,tokenHash,validOrigin,cookie} from '../../../../server/security.mjs';
export async function POST(req:Request){
 if(!validOrigin(req))return Response.json({error:'Invalid request origin.'},{status:403});
 const token=sessionToken(req);try{if(token)await getPool().query('DELETE FROM sessions WHERE token_hash=$1',[tokenHash(token)]);}catch{return Response.json({error:'Could not sign out. Retry.'},{status:503});}
 return Response.json({ok:true},{headers:{'Set-Cookie':cookie('',0)}});
}
