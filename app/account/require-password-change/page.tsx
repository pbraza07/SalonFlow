import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {getPool} from '../../../server/database.mjs';
import {tokenHash} from '../../../server/security.mjs';
import RequiredPasswordChange from '../../components/required-password-change';
export const dynamic='force-dynamic';
export default async function PasswordRecoveryRequired(){
 const token=(await cookies()).get('salonflow_session')?.value;
 if(!token||!/^[a-f0-9]{64}$/.test(token))redirect('/login');
 const result=await getPool().query(
  'SELECT u.must_change_password FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() LIMIT 1',
  [tokenHash(token)]);
 if(!result.rows[0])redirect('/login');
 if(result.rows[0].must_change_password!==true)redirect('/business');
 return <RequiredPasswordChange/>;
}
