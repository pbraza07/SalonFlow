import TeamBookingReview from '../../../components/team-booking-review';
import type {Metadata} from 'next';
import {getPool} from '../../../../server/database.mjs';
import {tokenHash} from '../../../../server/security.mjs';
import {businessDeviceName} from '../../../../server/business-device-name.mjs';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{token:string}>}):Promise<Metadata>{
 const {token}=await params;
 if(!/^[a-f0-9]{64}$/.test(token))return {};
 try{
  const b=(await getPool().query(
   "SELECT b.slug,b.name FROM booking_review_links l JOIN businesses b ON b.id=l.business_id WHERE l.token_hash=$1 AND l.expires_at>now() AND b.status='active'",
   [tokenHash(token)])).rows[0];
  if(!b)return {};
  const name=businessDeviceName(b.name);
  return {title:name,manifest:'/api/business/manifest?slug='+encodeURIComponent(b.slug),
   appleWebApp:{capable:true,statusBarStyle:'default',title:name}};
 }catch{return {};}
}

export default async function TeamReviewPage({params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 if(!/^[a-f0-9]{64}$/.test(token))return <main>Invalid review link.</main>;
 return <TeamBookingReview token={token}/>;
}
