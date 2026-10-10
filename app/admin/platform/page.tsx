import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {getPool} from '../../../server/database.mjs';
import {tokenHash} from '../../../server/security.mjs';
import {getPlatformRole} from '../../../server/platform-roles.mjs';
import PlatformDashboard from './platform-dashboard';
export const dynamic='force-dynamic';
export default async function PlatformPage(){
 const token=(await cookies()).get('salonflow_session')?.value;
 if(!token||!/^[a-f0-9]{64}$/.test(token))redirect('/login?next=%2Fadmin%2Fplatform');
 const pool=getPool(),r=await pool.query('SELECT s.user_id,u.must_change_password FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND expires_at>now() LIMIT 1',[tokenHash(token)]);
 const id=r.rows[0]?.user_id;
 if(!id)redirect('/login?next=%2Fadmin%2Fplatform');
 if(r.rows[0]?.must_change_password===true)redirect('/account/require-password-change');
 if(!await getPlatformRole(pool,id))redirect('/admin/access-denied');
 return <PlatformDashboard/>;
}
