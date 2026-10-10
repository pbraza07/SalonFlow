'use client';
export type BookingRequest={id:string;date:string;staff_id:string;start_minute:number;duration:number;reviewer:string;status:string;created_at:string;
 details:{customerName:string;customerEmail:string;customerPhone:string;services:string[];staffId:string;date:string;start:number;quotedPrice:number;customAnswers?:Record<string,string|boolean>}};
export const approvalTime=(minute:number)=>((Math.floor(minute/60)%12)||12)+':'+String(minute%60).padStart(2,'0')+(minute<720?' AM':' PM');
export default function BookingRequestCards({items,busy,onReview,team,customFields=[]}:{items:BookingRequest[];busy:string;onReview:(id:string,accept:boolean)=>void;team?:{id:string;name:string}[];customFields?:{id:string;label:string}[]}){
 return <div className="sf-approval-list">{items.map(item=><article className="sf-approval-card" key={item.id}>
  <div className="sf-approval-title"><div><strong>{item.details.customerName}</strong><span>Requested {item.date} · {approvalTime(item.start_minute)} · {item.duration} minutes</span></div><span className="sf-request-badge">Awaiting review</span></div>
  <p><b>Services:</b> {(item.details.services||[]).join(', ')}</p>
  <p><b>Team:</b> {team?.find(s=>s.id===item.staff_id)?.name||item.staff_id}</p>
  <p><b>Customer:</b> {item.details.customerEmail}{item.details.customerPhone?' · '+item.details.customerPhone:''}</p>
  {customFields.map(f=>item.details.customAnswers?.[f.id]!==undefined?<p key={f.id}><b>{f.label}:</b> {typeof item.details.customAnswers[f.id]==='boolean'?(item.details.customAnswers[f.id]?'Yes':'No'):String(item.details.customAnswers[f.id])}</p>:null)}
  <p><b>Quote:</b> {new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(item.details.quotedPrice||0)} · No payment collected</p>
  <p><small>Received: {new Date(item.created_at).toLocaleString()}</small></p>
  <div className="sf-approval-buttons"><button type="button" className="primary" disabled={!!busy} onClick={()=>onReview(item.id,true)}>{busy===item.id?'Processing…':'Accept and add to calendar'}</button><button type="button" className="outline" disabled={!!busy} onClick={()=>onReview(item.id,false)}>Decline (no calendar change)</button></div>
 </article>)}</div>;
}
