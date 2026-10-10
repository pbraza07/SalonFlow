'use client';
import {useEffect,useState} from 'react';
import {ArrowUpRight,ChevronLeft,ChevronRight,Images} from 'lucide-react';
type Credit={name:string;url:string};
type Photo={index:number;attributions:Credit[]};
export default function GoogleBusinessGallery({slug,compact=false}:{slug:string;compact?:boolean}){
 const [photos,setPhotos]=useState<Photo[]>([]),[index,setIndex]=useState(0),[link,setLink]=useState('');
 const [loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false);
 useEffect(()=>{
  let cancelled=false;
  setPhotos([]);setIndex(0);setLoaded(false);setFailed(false);
  if(!slug)return;
  fetch('/api/public/google-gallery?slug='+encodeURIComponent(slug),{cache:'no-store'}).then(r=>r.json()).then(data=>{
   if(cancelled)return;
   setPhotos(Array.isArray(data.photos)?data.photos:[]);
   setLink(typeof data.link==='string'?data.link:'');
  }).catch(()=>{}).finally(()=>{if(!cancelled)setLoaded(true);});
  return ()=>{cancelled=true;};
 },[slug]);
 if(!loaded||!link)return null;
 if(!photos.length)return <aside className="sf-google-gallery-empty"><Images size={17}/><span>Explore this business on <a href={link} target="_blank" rel="noopener noreferrer">Google Maps <ArrowUpRight size={13}/></a></span></aside>;
 const photo=photos[index]||photos[0];
 const next=()=>{setFailed(false);setIndex(n=>(n+1)%photos.length);};
 const previous=()=>{setFailed(false);setIndex(n=>(n-1+photos.length)%photos.length);};
 const src='/api/public/google-gallery/photo?slug='+encodeURIComponent(slug)+'&index='+photo.index;
 return <section className={'sf-google-gallery'+(compact?' compact':'')} aria-label="Photos from this business on Google Maps">
  <div className="sf-google-gallery-head"><div><span className="sf-google-gallery-kicker">FROM GOOGLE MAPS</span><h3>Explore the business</h3></div>
   <a href={link} target="_blank" rel="noopener noreferrer">View on Google <ArrowUpRight size={15}/></a></div>
  <div className="sf-google-gallery-stage">
   {failed?<div className="sf-google-gallery-error"><Images size={24}/><span>Photo is temporarily unavailable. Try the next photo or view it on Google.</span></div>:
    <img key={src} src={src} loading="lazy" alt={'Business gallery photo '+(index+1)+' of '+photos.length} onError={()=>setFailed(true)}/>}
   {photos.length>1&&<><button type="button" className="sf-google-gallery-prev" onClick={previous} aria-label="Previous photo"><ChevronLeft size={23}/></button>
    <button type="button" className="sf-google-gallery-next" onClick={next} aria-label="Next photo"><ChevronRight size={23}/></button></>}
   <span className="sf-google-gallery-count">{index+1} / {photos.length}</span>
  </div>
  <div className="sf-google-gallery-footer">
   <span>Photos supplied by Google Maps</span>
   <div className="sf-google-gallery-credits">{photo.attributions?.map((a,i)=><span key={i}>Photo: {a.url?<a href={a.url} target="_blank" rel="noopener noreferrer">{a.name}</a>:a.name}</span>)}</div>
  </div>
 </section>;
}
