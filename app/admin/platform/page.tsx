import {cookies} from 'next/headers';
import {redirect,notFound} from 'next/navigation';
import {getPool} from '../../../server/database.mjs';
import {tokenHash} from '../../../server/security.mjs';
import {getPlatformRole} from '../../../server/platform-roles.mjs';
import PlatformDashboard from './platform-dashboard';
export const dynamic='force-dynamic';
export default async function PlatformPage(){
 const token=(await cookies()).get('salonflow_session')?.value;
 if(!token||!/^[a-f0-9]{64}$/.test(token))redirect('/login');
 const pool=getPool(),r=await pool.query('SELECT user_id FROM sessions WHERE token_hash=$1 AND expires_at>now() LIMIT 1',[tokenHash(token)]);
 const id=r.rows[0]?.user_id;
 if(!id)redirect('/login');
 if(!await getPlatformRole(pool,id))notFound();
 return <PlatformDashboard/>;
}
