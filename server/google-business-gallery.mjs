import {googleListingUrl} from './membership-payments.mjs';
const letters=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function validGalleryMatch(requested,display){
 const a=letters(requested),b=letters(display);
 if(!a||!b)return false;
 return a===b || (a.length>=9&&b.length>=9&&(a.includes(b)||b.includes(a)));
}
export function validPhotoResource(value){
 return typeof value==='string'&&/^places\/[A-Za-z0-9_-]{8,}\/photos\/[A-Za-z0-9_-]{8,}$/.test(value);
}
export async function googleGalleryForBusiness(business){
 const link=googleListingUrl(business.google_listing_url||'');
 if(!link)return {link:'',photos:[],enabled:false};
 const key=process.env.GOOGLE_MAPS_API_KEY||process.env.GOOGLE_PLACES_API_KEY;
 if(!key)return {link,photos:[],enabled:false};
 const businessName=String(business.name||'').trim();
 if(!businessName)return {link,photos:[],enabled:true};
 const query=[businessName,business.city,business.region].filter(Boolean).join(', ').slice(0,230);
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
 try{
  // Search the business's exact display name and city; do not silently show
  // another business's photos when a Maps link has an ambiguous short URL.
  const r=await fetch('https://places.googleapis.com/v1/places:searchText',{
   method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,
    'X-Goog-FieldMask':'places.id,places.displayName,places.googleMapsUri,places.photos,places.formattedAddress'},
   body:JSON.stringify({textQuery:query,pageSize:4}),cache:'no-store',signal:controller.signal});
  if(!r.ok)throw Error('Google Places lookup unavailable');
  const data=await r.json();
  const match=(data.places||[]).find(p=>validGalleryMatch(businessName,p.displayName?.text));
  if(!match)return {link,photos:[],enabled:true};
  const photos=(match.photos||[]).filter(p=>validPhotoResource(p.name)).slice(0,10)
   .map((p,i)=>({index:i,attributions:(p.authorAttributions||[]).filter(a=>a?.displayName).map(a=>({
    name:String(a.displayName).slice(0,100),
    url:typeof a.uri==='string'&&/^https?:\/\/|^\/\//.test(a.uri)?(a.uri.startsWith('//')?'https:'+a.uri:a.uri):''
   }))}));
  return {link,photos,enabled:true,placeName:match.displayName?.text||businessName};
 }finally{clearTimeout(timeout);}
}
export function approvedGooglePhotoUri(value){
 try{const u=new URL(value);
  return u.protocol==='https:'&&(u.hostname==='googleusercontent.com'||u.hostname.endsWith('.googleusercontent.com'))?u.toString():null;
 }catch{return null;}
}
