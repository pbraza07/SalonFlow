import BookingDecision from '../../../components/booking-decision';
export const dynamic='force-dynamic';
export default async function BookingDecisionPage({params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 if(!/^[a-f0-9]{64}$/.test(token))return <main>Invalid review link.</main>;
 return <BookingDecision token={token}/>;
}
