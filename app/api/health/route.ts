import {getPool} from '../../../server/database.mjs';
export const dynamic='force-dynamic';
export async function GET(){try{await getPool().query('SELECT 1');return Response.json({status:'ok',version:'1.3.9'});}catch{return Response.json({status:'unavailable'},{status:503});}}
