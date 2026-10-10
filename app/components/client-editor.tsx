'use client';
import {useEffect,useState} from 'react';
import {Check,UserRoundPlus,X} from 'lucide-react';

export type ClientDetails={name:string;email:string;phone:string;notes:string};
export default function ClientEditor({client,onClose,onSave,busy,error}:{
 client:ClientDetails|null;
 onClose:()=>void;
 onSave:(details:ClientDetails)=>Promise<void>;
 busy:boolean;
 error:string;
}){
 const [values,setValues]=useState<ClientDetails>({name:'',email:'',phone:'',notes:''});
 useEffect(()=>{setValues(client?{name:client.name,email:client.email||'',phone:client.phone||'',notes:client.notes||''}:{name:'',email:'',phone:'',notes:''});},[client]);
 const set=(key:keyof ClientDetails)=>(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>setValues(v=>({...v,[key]:e.target.value}));
 return <div className="sf-client-editor-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)onClose();}}>
  <section role="dialog" aria-modal="true" aria-labelledby="sf-client-editor-title" className="sf-client-editor">
   <header><div className="sf-client-editor-heading"><UserRoundPlus size={20} aria-hidden="true"/><div>
    <small>{client?'EDIT CLIENT':'CLIENT DIRECTORY'}</small><h2 id="sf-client-editor-title">{client?'Edit client profile':'Add new client'}</h2></div></div>
    <button className="outline sf-client-editor-close" type="button" onClick={onClose} disabled={busy} aria-label="Close client editor"><X size={18}/></button>
   </header>
   <p className="sf-client-editor-note">Client contact details are private to this business. Editing a profile does not change past bookings or attendance records.</p>
   <form id="sf-client-edit-form" onSubmit={async e=>{e.preventDefault();await onSave(values);}}>
    <label>Full name <span aria-hidden="true">*</span><input autoFocus required maxLength={100} value={values.name} onChange={set('name')} placeholder="Customer's full name"/></label>
    <div className="sf-client-editor-row"><label>Email address<input type="email" maxLength={254} value={values.email} onChange={set('email')} placeholder="client@example.com"/></label>
     <label>Phone number<input type="tel" maxLength={40} value={values.phone} onChange={set('phone')} placeholder="(813) 555-0199"/></label></div>
    <label>Internal notes (optional)<textarea maxLength={1000} rows={3} value={values.notes} onChange={set('notes')} placeholder="Notes for the business owner only"/></label>
    <p className="sf-client-editor-notice">Clients with different names are kept separate, even when they share an email address or phone number.</p>
    {error&&<p className="sf-client-editor-error" role="alert">{error}</p>}
   </form>
   <footer><button type="button" className="outline" onClick={onClose} disabled={busy}>Cancel</button>
    <button type="submit" className="primary" form="sf-client-edit-form" disabled={busy||!values.name.trim()}><Check size={17}/>{busy?'Saving…':client?'Save changes':'Add client'}</button></footer>
  </section>
 </div>;
}
