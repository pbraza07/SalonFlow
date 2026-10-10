'use client';
import {useMemo,useState} from 'react';
import {Building2,Check,Copy,Eye,EyeOff,KeyRound,Pencil,Plus,RotateCcw,Search,ShieldAlert,Trash2,X} from 'lucide-react';
import {BUSINESS_INDUSTRIES,US_STATES} from '../../lib/business-options';
import type {BusinessSummary} from './platform-business-directory';

type Profile={name:string;slug:string;industry:string;description:string;city:string;region:string;ownerEmail:string;status:string;listed:boolean;activateImmediately:boolean};
const empty=():Profile=>({name:'',slug:'',industry:'other',description:'',city:'',region:'Florida',
 ownerEmail:'',status:'pending',listed:false,activateImmediately:false});
const linkFriendly=(v:string)=>v.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60);
export default function PlatformBusinessManager({businesses,primary,onChanged}:{
 businesses:BusinessSummary[];primary:boolean;onChanged:()=>Promise<void>;
}){
 const [expanded,setExpanded]=useState(true),[mode,setMode]=useState<'create'|'edit'|null>(null);
 const [editingId,setEditingId]=useState(''),[values,setValues]=useState<Profile>(empty());
 const [search,setSearch]=useState(''),[working,setWorking]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [credentials,setCredentials]=useState<{email:string;temporaryPassword:string;business:string;status:string;kind:'create'|'reset'}|null>(null);
 const [revealCredential,setRevealCredential]=useState(false),[resetting,setResetting]=useState<BusinessSummary|null>(null),[resetConfirmation,setResetConfirmation]=useState('');
 const [removing,setRemoving]=useState<BusinessSummary|null>(null),[confirmation,setConfirmation]=useState('');
 const items=useMemo(()=>businesses.filter(b=>
  !search.trim()||[b.name,b.slug,b.owner_email,b.industry,b.city,b.status].join(' ').toLowerCase().includes(search.toLowerCase().trim())
 ).sort((a,b)=>a.name.localeCompare(b.name)),[businesses,search]);
 const set=(key:keyof Profile)=>(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>)=>{
  const value=e.target.type==='checkbox'?(e.target as HTMLInputElement).checked:e.target.value;
  setValues(p=>({...p,[key]:value,...(key==='name'&&mode==='create'&&!p.slug?{slug:linkFriendly(String(value))}: {})}));
 };
 function add(){
  setMode('create');setEditingId('');setValues(empty());setError('');setNotice('');setCredentials(null);
  setTimeout(()=>document.getElementById('sf-admin-business-form')?.scrollIntoView({behavior:'smooth',block:'start'}),0);
 }
 function edit(b:BusinessSummary){
  setMode('edit');setEditingId(b.id);
  setValues({name:b.name,slug:b.slug,industry:b.industry,description:b.description||'',
   city:b.city,region:b.region,ownerEmail:b.owner_email,status:b.status,
   listed:b.is_listed,activateImmediately:false});
  setError('');setNotice('');setCredentials(null);setRemoving(null);
  setTimeout(()=>document.getElementById('sf-admin-business-form')?.scrollIntoView({behavior:'smooth',block:'start'}),0);
 }
 async function post(data:Record<string,unknown>){
  const r=await fetch('/api/platform/businesses/manage',{method:'POST',
   headers:{'Content-Type':'application/json'},body:JSON.stringify(data),cache:'no-store'});
  const result=await r.json();if(!r.ok)throw Error(result.error||'Unable to manage this business.');
  return result;
 }
 async function save(e:React.FormEvent){
  e.preventDefault();setWorking(true);setError('');setNotice('');setCredentials(null);
  try{
   const body={action:mode==='create'?'create':'edit',...(mode==='edit'?{id:editingId}:{}),
    name:values.name,slug:values.slug,industry:values.industry,description:values.description,
    city:values.city,region:values.region,
    ...(mode==='create'?{ownerEmail:values.ownerEmail,activateImmediately:primary&&values.activateImmediately}:
     {status:values.status,listed:values.listed})};
   if(mode==='edit'&&businesses.some(b=>b.id===editingId&&b.slug!==values.slug)&&
    !window.confirm('Changing the booking URL may break existing customer links. Continue with the new URL?'))return;
   const result=await post(body);
   if(mode==='create')setCredentials({email:result.ownerEmail,temporaryPassword:result.temporaryPassword,
    business:values.name,status:result.status,kind:'create'});setRevealCredential(false);
   setNotice(result.message||'Business saved.');
   setMode(null);setEditingId('');await onChanged();
  }catch(e){setError((e as Error).message);}finally{setWorking(false);}
 }
 async function archive(){
  if(!removing)return;
  setWorking(true);setError('');setNotice('');
  try{
   const result=await post({action:'archive',id:removing.id,confirmName:confirmation});
   setNotice(result.message||'Business archived.');setRemoving(null);setConfirmation('');
   if(removing.id===editingId){setMode(null);setEditingId('');}
   await onChanged();
  }catch(e){setError((e as Error).message);}finally{setWorking(false);}
 }
 async function resetOwnerPassword(){
  if(!resetting||!primary)return;
  setWorking(true);setError('');setNotice('');
  try{
   const result=await post({action:'resetPassword',id:resetting.id,confirmName:resetConfirmation});
   setCredentials({email:result.ownerEmail,temporaryPassword:result.temporaryPassword,
    business:resetting.name,status:resetting.status,kind:'reset'});
   setRevealCredential(false);setResetting(null);setResetConfirmation('');
   setNotice(result.message||'Temporary password generated. Existing sessions have been revoked.');
   await onChanged();
  }catch(e){setError((e as Error).message);}finally{setWorking(false);}
 }
 async function restore(b:BusinessSummary){
  if(!window.confirm('Restore '+b.name+' to suspended status? This will NOT automatically publish or allow bookings.'))return;
  setWorking(true);setError('');setNotice('');
  try{
   const result=await post({action:'restore',id:b.id});setNotice(result.message);await onChanged();
  }catch(e){setError((e as Error).message);}finally{setWorking(false);}
 }
 return <section className="sf-platform-manage" id="manage-businesses" aria-label="Platform business administration">
  <header className="sf-platform-manage-head">
   <div><span className="sf-platform-eyebrow"><Building2 size={14}/> PLATFORM ADMINISTRATORS</span>
    <h2>Manage businesses</h2><p>Create businesses, edit profiles, or remove them from public access. Removal is reversible and preserves bookings, clients, and financial records.</p></div>
   <button className="primary" type="button" onClick={add}><Plus size={17}/> Add business</button>
  </header>
  {error&&<p className="sf-platform-error" role="alert">{error}</p>}
  {notice&&<p className="sf-platform-success" role="status">{notice}</p>}
  {credentials&&<section className="sf-platform-temporary-credentials" role="status">
   <h3><ShieldAlert size={19}/> {credentials.kind==='reset'?'Owner password reset — one-time credentials':'New business owner credentials — copy now'}</h3>
   <p>{credentials.kind==='reset'?'A replacement password was generated for':'An owner account was created for'} <b>{credentials.business}</b>. The original password cannot be viewed. This temporary password is displayed only until you dismiss it. Share it securely; the owner must choose a new password at next sign-in.</p>
   <label>Owner email<input value={credentials.email} readOnly/></label>
   <label>One-time temporary password
    <span className="sf-admin-password-display"><input type={revealCredential?'text':'password'} autoComplete="off" value={credentials.temporaryPassword} readOnly/>
     <button className="outline" type="button" aria-label={revealCredential?'Hide temporary password':'Show temporary password'} onClick={()=>setRevealCredential(v=>!v)}>{revealCredential?<EyeOff size={16}/>:<Eye size={16}/>}</button>
    </span></label>
   <button className="outline" type="button" onClick={()=>{void navigator.clipboard?.writeText('SelahFlow\nOwner: '+credentials.email+'\nTemporary password: '+credentials.temporaryPassword+'\nSign in: '+window.location.origin+'/login')}}><Copy size={16}/> Copy sign-in details</button>
   <button type="button" className="outline" onClick={()=>{setCredentials(null);setRevealCredential(false)}}>Dismiss credentials</button>
  </section>}
  {mode&&<section id="sf-admin-business-form" className="sf-platform-business-editor">
   <header><h3>{mode==='create'?'Add a new business':'Edit business profile'}</h3><button className="outline" type="button" onClick={()=>{setMode(null);setError('')}} disabled={working}><X size={17}/> Close</button></header>
   <p>{mode==='create'?'Create a separate owner account and business workspace. Existing business accounts and data will remain untouched.':
     'Business profile edits update the existing workspace; services, members, appointments and client data are preserved.'}</p>
   <form onSubmit={save}>
    <div className="sf-platform-form-row"><label>Business name<input required maxLength={100} minLength={2} value={values.name} onChange={set('name')}/></label>
     <label>Business booking URL slug<input required maxLength={60} pattern="[a-z0-9][a-z0-9-]{1,58}[a-z0-9]" value={values.slug} onChange={set('slug')}/></label></div>
    {mode==='create'?<label>New owner email<input type="email" required maxLength={254} value={values.ownerEmail} onChange={set('ownerEmail')} placeholder="business.owner@example.com"/></label>:
     <label>Business owner (unchanged)<input readOnly value={values.ownerEmail}/></label>}
    <div className="sf-platform-form-row"><label>Business category<select value={values.industry} onChange={set('industry')}>{BUSINESS_INDUSTRIES.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
     <label>State / region<select value={values.region} onChange={set('region')}><option value="">Not specified</option>{US_STATES.map(([abbr,name])=><option key={abbr} value={name}>{name}</option>)}</select></label></div>
    <label>City<input maxLength={80} value={values.city} onChange={set('city')}/></label>
    <label>Description<textarea rows={3} maxLength={600} value={values.description} onChange={set('description')} /></label>
    {mode==='create'?<label className="sf-platform-inline-check"><input type="checkbox" checked={primary&&values.activateImmediately} disabled={!primary} onChange={set('activateImmediately')}/>
      <span>Activate and publish immediately {primary?'(primary administrator only)':'(primary administrator approval required)'}</span></label>:
     <div className="sf-platform-form-row">
      <label>Business status<select value={values.status} disabled={values.status==='archived'} onChange={set('status')}>
       {['active','pending','suspended','rejected'].filter(s=>primary||!['pending','rejected'].includes(s)).map(s=><option key={s} value={s}>{s==='active'?'Active / Booking enabled':s==='pending'?'Awaiting approval':s==='suspended'?'Suspended': 'Declined'}</option>)}
       {values.status==='archived'&&<option value="archived">Archived</option>}
      </select></label>
      <label className="sf-platform-inline-check"><input type="checkbox" checked={values.listed} disabled={values.status!=='active'} onChange={set('listed')}/><span>Show in marketplace</span></label>
     </div>}
    <div className="sf-platform-form-actions"><button className="primary" type="submit" disabled={working}><Check size={16}/>{working?'Saving…':mode==='create'?'Create business account':'Save business changes'}</button>
     <button type="button" className="outline" onClick={()=>setMode(null)} disabled={working}>Cancel</button></div>
   </form>
  </section>}
  <div className="sf-platform-manage-search"><Search size={18}/><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find business to edit, remove or restore" aria-label="Search businesses to manage"/>
   <span>{items.length} businesses</span></div>
  <div className="sf-platform-business-rows">{items.map(b=><article key={b.id} className="sf-platform-business-row">
   <div><strong>{b.name}</strong><small><b>Owner email:</b> {b.owner_email}</small><small>/{b.slug} · {b.industry}</small><small>Password: protected · existing password cannot be displayed</small></div>
   <span className={'sf-platform-business-status status-'+b.status}>{b.status}</span>
   <div className="sf-platform-business-actions">
    {primary&&<button type="button" className="outline" disabled={working}
     onClick={()=>{setResetting(b);setResetConfirmation('');setCredentials(null);setRevealCredential(false);setError('');}}>
      <KeyRound size={15}/> Reset password</button>}
    {b.status==='archived'?<button type="button" className="outline" disabled={working} onClick={()=>void restore(b)}><RotateCcw size={15}/> Restore</button>:
     <><button type="button" className="outline" onClick={()=>edit(b)} disabled={working}><Pencil size={15}/> Edit</button>
      <button type="button" className="outline sf-platform-remove-btn" disabled={working} onClick={()=>{setRemoving(b);setConfirmation('');setError('')}}><Trash2 size={15}/> Remove</button></>}
   </div>
  </article>)}</div>
  {!items.length&&<p>No businesses match the search.</p>}
  {resetting&&<div className="sf-platform-confirm-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!working)setResetting(null)}}>
   <section role="dialog" aria-modal="true" aria-labelledby="sf-platform-reset-title" className="sf-platform-confirm">
    <h3 id="sf-platform-reset-title"><KeyRound size={20}/> Reset owner password?</h3>
    <p><b>Business:</b> {resetting.name}</p><p><b>Owner:</b> {resetting.owner_email}</p>
    <p>The owner's current password is not readable. A random temporary password will replace it, every active session will be signed out, and the owner must choose a new private password at next sign-in. This action will be audited.</p>
    <label>Type the exact business name to confirm<input autoFocus value={resetConfirmation} onChange={e=>setResetConfirmation(e.target.value)}/></label>
    <div><button type="button" className="outline" onClick={()=>setResetting(null)} disabled={working}>Cancel</button>
     <button type="button" className="primary" disabled={working||resetConfirmation!==resetting.name} onClick={()=>void resetOwnerPassword()}>
      <KeyRound size={16}/>{working?'Resetting…':'Reset owner password'}</button></div>
   </section>
  </div>}
  {removing&&<div className="sf-platform-confirm-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!working)setRemoving(null)}}>
   <section role="dialog" aria-modal="true" aria-labelledby="sf-platform-archive-title" className="sf-platform-confirm">
    <h3 id="sf-platform-archive-title"><ShieldAlert size={20}/> Remove {removing.name}?</h3>
    <p>This business will be hidden from public discovery and booking. Customer appointments, history, business settings, and payment records will not be deleted. Active or pending recurring payments must be resolved before removal.</p>
    <label>Type the exact business name to confirm<input autoFocus value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label>
    <div><button type="button" className="outline" onClick={()=>setRemoving(null)} disabled={working}>Cancel</button>
     <button type="button" className="primary" disabled={working||confirmation!==removing.name} onClick={()=>void archive()}><Trash2 size={16}/> {working?'Removing…':'Remove business'}</button></div>
   </section>
  </div>}
 </section>;
}
