'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import OwnerThemeEditor from './owner-theme-editor';
type Profile={slug:string;name:string;description:string;city:string;region:string;brand_primary:string;brand_background:string;business_model:string;has_logo:boolean};
export default function OwnerBranding({slug}:{slug:string}){
 const [profile,setProfile]=useState<Profile|null>(null),[primary,setPrimary]=useState('#123F3A'),[background,setBackground]=useState('#F7F4EC'),[model,setModel]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[version,setVersion]=useState(0);
 async function load(){const r=await fetch('/api/business',{cache:'no-store'}),d=await r.json();if(!r.ok)throw Error(d.error);const b=d.business as Profile;if(!b)throw Error('Business not found.');setProfile(b);setPrimary(b.brand_primary);setBackground(b.brand_background);setModel(b.business_model);}
 useEffect(()=>{load().catch(e=>setMessage(e.message));},[]);
 async function save(e:React.FormEvent){e.preventDefault();if(!profile)return;setBusy(true);setMessage('');try{
 const r=await fetch('/api/business',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:profile.name,description:profile.description,city:profile.city,region:profile.region,requestListing:false,brandPrimary:primary,brandBackground:background,businessModel:model})}),d=await r.json();if(!r.ok)throw Error(d.error);await load();setMessage('Business colors and description saved.');}
 catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 async function upload(e:React.ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];if(!file)return;setBusy(true);setMessage('');try{if(file.size>300*1024)throw Error('Logo must be no larger than 300 KB.');
 const form=new FormData();form.set('logo',file);const r=await fetch('/api/branding/logo',{method:'POST',body:form}),d=await r.json();if(!r.ok)throw Error(d.error);await load();setVersion(Date.now());setMessage('Business logo uploaded.');}
 catch(e){setMessage((e as Error).message);}finally{setBusy(false);e.target.value='';}}
 async function remove(){setBusy(true);try{const r=await fetch('/api/branding/logo',{method:'DELETE'}),d=await r.json();if(!r.ok)throw Error(d.error);await load();setVersion(Date.now());setMessage('Logo removed.');}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 return <><section className="panel padded"><h2>Customize your business page</h2><p className="muted">Your colors, logo, and business description are unique to this business.</p>
 {message&&<p role="status" className="notice section-gap">{message}</p>}
 <div className="branding-preview" style={{background}}><div style={{borderLeft:'5px solid '+primary,padding:16,background:'#fff',borderRadius:8}}>{profile?.has_logo?<img src={'/api/branding/logo?slug='+encodeURIComponent(slug)+'&v='+version} alt="Business logo" style={{maxHeight:105,maxWidth:220,objectFit:'contain'}}/>:<h3 style={{color:primary}}>{profile?.name||slug}</h3>}<p style={{color:primary}}>{model||'Your business story appears here.'}</p></div></div>
 <div className="form-row"><label>Primary color<input type="color" value={primary} onChange={e=>setPrimary(e.target.value)}/><small>{primary}</small></label><label>Page background<input type="color" value={background} onChange={e=>setBackground(e.target.value)}/><small>{background}</small></label></div>
 <form onSubmit={save}><label>Business model / description<textarea maxLength={2000} rows={5} value={model} onChange={e=>setModel(e.target.value)} placeholder="Describe your services, specialties and business model."/></label><small>{model.length}/2000 characters</small><button className="primary" disabled={busy||!profile} type="submit">Save branding</button></form>
 <div className="section-gap"><h3>Business logo</h3><p className="muted">PNG, JPG or WebP, maximum 300 KB. Stored with your business in the database.</p><label>Upload / replace logo<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={upload}/></label>{profile?.has_logo&&<button className="outline" type="button" disabled={busy} onClick={remove}>Remove logo</button>}</div>
 <p className="section-gap"><Link className="outline" href={'/'+slug} target="_blank">Open public business page</Link></p></section><OwnerThemeEditor/></>;
}
