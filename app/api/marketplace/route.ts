import {getPool} from '../../../server/database.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 try{
  const url=new URL(req.url),q=(url.searchParams.get('q')||'').trim().slice(0,80);
  const industry=(url.searchParams.get('industry')||'').trim().slice(0,32);
  const city=(url.searchParams.get('city')||'').trim().slice(0,80);
  const pool=getPool();
  const result=await pool.query(
    "SELECT slug,name,industry,description,city,region FROM businesses WHERE status='active' AND is_listed=TRUE AND ($1='' OR name ILIKE '%'||$1||'%' OR description ILIKE '%'||$1||'%') AND ($2='' OR industry=$2) AND ($3='' OR city ILIKE '%'||$3||'%') ORDER BY updated_at DESC LIMIT 50",
    [q.replace(/[%_]/g,'\\$&'),industry,city.replace(/[%_]/g,'\\$&')]
  );
  return Response.json({businesses:result.rows},{headers:{'Cache-Control':'public, max-age=30'}});
 }catch(e){console.error('Marketplace unavailable',e);return Response.json({error:'Marketplace is temporarily unavailable.'},{status:503});}
}
