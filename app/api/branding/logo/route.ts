import {getPool} from '../../../../server/database.mjs';
import {requireOwner} from '../../../../lib/auth';
import {validOrigin} from '../../../../server/security.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';
const max=300*1024;
function validContent(data:Buffer,mime:string){
 if(mime==='image/png')return data.length>=24&&data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 if(mime==='image/jpeg')return data.length>=4&&data[0]===255&&data[1]===216&&data.at(-2)===255&&data.at(-1)===217;
 if(mime==='image/webp')return data.length>=16&&data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WEBP';
 return false;
}
export async function GET(req:Request){
 const slug=new URL(req.url).searchParams.get('slug')||'';
 if(!/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/.test(slug))return new Response(null,{status:404});
 try{const r=await getPool().query("SELECT l.bytes,l.mime_type FROM business_logos l JOIN businesses b ON b.id=l.business_id WHERE b.slug=$1 AND b.status='active' LIMIT 1",[slug]);
 const item=r.rows[0];if(!item)return new Response(null,{status:404});
 return new Response(new Uint8Array(item.bytes),{headers:{'Content-Type':item.mime_type,'X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=300'}});
 }catch{return new Response(null,{status:503});}
}
export async function POST(req:Request){
 if(!validOrigin(req))return Response.json({error:'Invalid origin.'},{status:403});
 try{const owner=await requireOwner(req);
  if(Number(req.headers.get('content-length')||0)>360000)return Response.json({error:'Logo exceeds 300 KB maximum.'},{status:413});
  const form=await req.formData(),image=form.get('logo');
  if(!(image instanceof File)||image.size<32||image.size>max)return Response.json({error:'Choose a PNG, JPG or WebP under 300 KB.'},{status:400});
  const bytes=Buffer.from(await image.arrayBuffer());
  if(!validContent(bytes,image.type))return Response.json({error:'Invalid image data or type.'},{status:400});
  const r=await getPool().query("INSERT INTO business_logos(business_id,mime_type,bytes) SELECT id,$1,$2 FROM businesses WHERE owner_id=$3 ON CONFLICT(business_id) DO UPDATE SET mime_type=excluded.mime_type,bytes=excluded.bytes,updated_at=now() RETURNING business_id",[image.type,bytes,owner]);
  if(!r.rowCount)return Response.json({error:'Business not found.'},{status:404});
  return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return Response.json({error:(e as Error).message==='AUTH_REQUIRED'?'Please sign in.':'Upload failed.'},{status:(e as Error).message==='AUTH_REQUIRED'?401:503});}
}
export async function DELETE(req:Request){
 if(!validOrigin(req))return Response.json({error:'Invalid origin.'},{status:403});
 try{const owner=await requireOwner(req);await getPool().query('DELETE FROM business_logos WHERE business_id IN (SELECT id FROM businesses WHERE owner_id=$1)',[owner]);return Response.json({ok:true});}
 catch(e){return Response.json({error:(e as Error).message==='AUTH_REQUIRED'?'Please sign in.':'Unable to remove logo.'},{status:(e as Error).message==='AUTH_REQUIRED'?401:503});}
}
