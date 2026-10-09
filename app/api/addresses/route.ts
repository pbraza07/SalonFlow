
import {requireOwner} from '../../../lib/auth';
import {addressQueryValid,normalizePhotonResults} from '../../../server/address-tools.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const noStore={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const cache=new Map<string,{expiry:number;results:unknown[]}>();
const usage=new Map<string,{count:number;since:number}>();
let lastUpstream=0;
export async function GET(req:Request){
 try{const owner=await requireOwner(req),url=new URL(req.url),q=(url.searchParams.get('q')||'').trim();
  if(!addressQueryValid(q))return Response.json({suggestions:[],attribution:'© OpenStreetMap contributors'},{headers:noStore});
  const now=Date.now(),key=q.toLowerCase().replace(/\s+/g,' '),saved=cache.get(key);
  if(saved&&saved.expiry>now)return Response.json({suggestions:saved.results,attribution:'© OpenStreetMap contributors'},{headers:noStore});
  const current=usage.get(owner),bucket=current&&now-current.since<900000?current:{count:0,since:now};
  if(++bucket.count>45)return Response.json({error:'Address search limit reached. Please enter manually.'},{status:429,headers:noStore});
  usage.set(owner,bucket);
  if(cache.size>350){for(const [k,v] of cache)if(v.expiry<now)cache.delete(k);if(cache.size>350)cache.clear();}
  // Respect the public Photon demo's reasonable-use requirement on this single Render instance.
  if(now-lastUpstream<1100)return Response.json({error:'Address search is busy. Try again shortly or enter manually.'},{status:429,headers:noStore});
  lastUpstream=now;
  const photon=new URL('https://photon.komoot.io/api/');
  photon.searchParams.set('q',q);photon.searchParams.set('limit','10');photon.searchParams.set('lang','en');
  const response=await fetch(photon,{headers:{'Accept':'application/json','User-Agent':'SelahFlow-Booking/1.3.6 (owner-address-autocomplete)'},signal:AbortSignal.timeout(4500),cache:'no-store'});
  if(!response.ok)throw Error('Provider unavailable');
  const payload=await response.json();
  const results=normalizePhotonResults(payload);
  cache.set(key,{results,expiry:Date.now()+600000});
  return Response.json({suggestions:results,attribution:'© OpenStreetMap contributors'},{headers:noStore});
 }catch(e){if((e as Error).message==='AUTH_REQUIRED')return Response.json({error:'Please sign in.'},{status:401,headers:noStore});return Response.json({error:'Address suggestions are unavailable. You can enter the address manually.'},{status:503,headers:noStore});}
}
