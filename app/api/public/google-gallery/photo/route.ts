import {getPool} from '../../../../../server/database.mjs';
import {googleGalleryForBusiness,approvedGooglePhotoUri} from '../../../../../server/google-business-gallery.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(req:Request){
 const params=new URL(req.url).searchParams,slug=params.get('slug')||'',idx=Number(params.get('index'));
 if(!/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/.test(slug)||!Number.isInteger(idx)||idx<0||idx>=10)return new Response(null,{status:404});
 const key=process.env.GOOGLE_MAPS_API_KEY||process.env.GOOGLE_PLACES_API_KEY;
 if(!key)return new Response(null,{status:404});
 try{
  const row=(await getPool().query("SELECT name,google_listing_url,city,region FROM businesses WHERE slug=$1 AND status='active'",[slug])).rows[0];
  if(!row)return new Response(null,{status:404});
  const gallery=await googleGalleryForBusiness(row),photo=gallery.photos.find(p=>p.index===idx);
  if(!photo?.resource)return new Response(null,{status:404});
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
  try{
   const url='https://places.googleapis.com/v1/'+photo.resource+'/media?maxWidthPx=1400&maxHeightPx=900&skipHttpRedirect=true';
   const r=await fetch(url,{headers:{'X-Goog-Api-Key':key},cache:'no-store',signal:controller.signal});
   if(!r.ok)return new Response(null,{status:502});
   const json=await r.json(),location=approvedGooglePhotoUri(json.photoUri);
   if(!location)return new Response(null,{status:502});
   return new Response(null,{status:302,headers:{Location:location,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }finally{clearTimeout(timeout);}
 }catch{return new Response(null,{status:503});}
}
