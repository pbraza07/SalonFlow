import {getPool} from '../../../../server/database.mjs';
import {googleGalleryForBusiness} from '../../../../server/google-business-gallery.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export async function GET(req:Request){
 const slug=new URL(req.url).searchParams.get('slug')||'';
 if(!/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/.test(slug))return Response.json({photos:[],link:''},{headers});
 try{
  const row=(await getPool().query("SELECT name,slug,google_listing_url,city,region FROM businesses WHERE slug=$1 AND status='active'",[slug])).rows[0];
  if(!row)return Response.json({photos:[],link:''},{headers});
  const data=await googleGalleryForBusiness(row);
  return Response.json({...data,photos:data.photos.map(({index,attributions}:{index:number;attributions:{name:string;url:string}[]})=>({index,attributions}))},{headers});
 }catch{return Response.json({photos:[],link:''},{headers});}
}
