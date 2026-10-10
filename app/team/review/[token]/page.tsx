import TeamBookingReview from '../../../components/team-booking-review';
export const dynamic='force-dynamic';
export default async function TeamReviewPage({params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 if(!/^[a-f0-9]{64}$/.test(token))return <main>Invalid review link.</main>;
 return <TeamBookingReview token={token}/>;
}
