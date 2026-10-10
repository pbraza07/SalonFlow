import {getPool} from '../../../../server/database.mjs';
import {requireOwner} from '../../../../lib/auth';
import {buildClientDirectory,clientWorkbookSheets} from '../../../../server/client-history.mjs';
import {createClientXlsx} from '../../../../server/client-xlsx.mjs';
import {resolveTheme} from '../../../../server/themes.mjs';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const noStore={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};

export async function GET(req:Request) {
 try{
  const owner=await requireOwner(req);
  const pool=getPool();
  const business=(await pool.query(
   "SELECT b.slug,b.name,b.status,b.brand_primary,b.brand_background,s.data AS settings_data FROM businesses b JOIN settings s ON s.owner=b.owner_id WHERE b.owner_id=$1",
   [owner]
  )).rows[0];
  if(!business||business.status!=='active')return Response.json({error:'Business workspace unavailable.'},{status:403,headers:noStore});
  const settings=JSON.parse(business.settings_data||'{}');
  const rows=(await pool.query(
   'SELECT id,date,start,duration,staff,status,data FROM appointments WHERE owner=$1 ORDER BY date DESC,start DESC',
   [owner]
  )).rows;
  const clients=buildClientDirectory(rows,settings,owner);
  const url=new URL(req.url);
  if(url.searchParams.get('export')!=='xlsx')
   return Response.json({clients,total:clients.length},{headers:noStore});
  const id=url.searchParams.get('clientId');
  if(id && !/^[0-9a-f]{32}$/.test(id))
   return Response.json({error:'Invalid client.'},{status:400,headers:noStore});
  const selected=id?clients.filter(c=>c.id===id):clients;
  if(id&&!selected.length)return Response.json({error:'This client is not in the current business.'},{status:404,headers:noStore});
  const theme=resolveTheme(settings.theme,business.brand_primary,business.brand_background);
  const xlsx=createClientXlsx(clientWorkbookSheets(selected),theme.colors);
  const businessName=String(business.slug||'business').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,48);
  const suffix=id?'client-'+id.slice(0,10):'all-clients';
  const date=new Date().toISOString().slice(0,10);
  return new Response(new Uint8Array(xlsx),{headers:{
   ...noStore,
   'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
   'Content-Disposition':'attachment; filename="SelahFlow-'+businessName+'-'+suffix+'-'+date+'.xlsx"'
  }});
 }catch(error){
  const unauthorized=(error as Error).message==='AUTH_REQUIRED';
  return Response.json({error:unauthorized?'Sign in to export your clients.':'Unable to load the client directory.'},
   {status:unauthorized?401:503,headers:noStore});
 }
}
