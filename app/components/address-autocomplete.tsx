
'use client';
import {useEffect,useId,useRef,useState} from 'react';
export type AddressSuggestion={label:string;street:string;city:string;region:string;postalCode:string;country:string};
type Props={label:string;value:string;onChange:(value:string)=>void;onSelect?:(location:AddressSuggestion)=>void;placeholder?:string;required?:boolean;disabled?:boolean};
export default function AddressAutocomplete({label,value,onChange,onSelect,placeholder='Start typing a street address…',required=false,disabled=false}:Props){
 const id=useId(),[focused,setFocused]=useState(false),[items,setItems]=useState<AddressSuggestion[]>([]),[active,setActive]=useState(-1),[loading,setLoading]=useState(false),[message,setMessage]=useState(''),[confirmed,setConfirmed]=useState('');
 const sequence=useRef(0);
 useEffect(()=>{
  const query=value.trim(),seq=++sequence.current;
  if(!focused||query.length<3||query===confirmed){setItems([]);setMessage('');setLoading(false);return;}
  const controller=new AbortController();
  const timer=setTimeout(async()=>{
   setLoading(true);
   try{const r=await fetch('/api/addresses?q='+encodeURIComponent(query),{signal:controller.signal,cache:'no-store'});
    const data=await r.json();
    if(seq!==sequence.current)return;
    if(!r.ok)throw Error(data.error||'Suggestions unavailable');
    setItems(Array.isArray(data.suggestions)?data.suggestions:[]);setActive(-1);setMessage('');
   }catch(e){if(!controller.signal.aborted&&seq===sequence.current){setItems([]);setMessage('Suggestions unavailable. You can type the address manually.');}}
   finally{if(seq===sequence.current)setLoading(false);}
  },650);
  return()=>{clearTimeout(timer);controller.abort();};
 },[value,focused,confirmed]);
 function pick(item:AddressSuggestion){setConfirmed(item.label);onChange(item.label);onSelect?.(item);setItems([]);setFocused(false);setMessage('');}
 return <div className="sf-address-field">
  <label htmlFor={id}>{label}</label>
  <input id={id} name="business-address" type="search" autoComplete="street-address" role="combobox" aria-autocomplete="list" aria-expanded={focused&&items.length>0} aria-controls={id+'-results'} aria-activedescendant={active>=0?id+'-option-'+active:undefined} value={value} required={required} disabled={disabled} placeholder={placeholder}
   onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
   onChange={e=>{setConfirmed('');onChange(e.target.value);setItems([]);}}
   onKeyDown={e=>{if(e.key==='Escape'){setItems([]);setFocused(false);e.currentTarget.blur();}if(e.key==='ArrowDown'&&items.length){e.preventDefault();setActive(i=>(i+1)%items.length);}if(e.key==='ArrowUp'&&items.length){e.preventDefault();setActive(i=>i<=0?items.length-1:i-1);}if(e.key==='Enter'&&active>=0&&items[active]){e.preventDefault();pick(items[active]);}}}/>
  {focused&&items.length>0&&<div className="sf-address-list" id={id+'-results'} role="listbox" aria-label="Address suggestions">
   {items.map((item,i)=><button type="button" role="option" id={id+'-option-'+i} aria-selected={i===active} className={i===active?'sf-address-option active':'sf-address-option'} key={item.label} onMouseDown={e=>e.preventDefault()} onClick={()=>pick(item)}>{item.label}</button>)}
   <div className="sf-address-attribution">Address suggestions: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a></div>
  </div>}
  {focused&&loading&&<small role="status">Finding addresses…</small>}
  {focused&&message&&<small role="status">{message}</small>}
 </div>;
}
