
/** OSM Photon address suggestion normalization — only safe, minimal fields are passed to browsers. */
const text=value=>typeof value==='string'?value.trim().slice(0,120):'';
export function normalizePhotonFeature(feature){
 const p=feature?.properties;if(!p||typeof p!=='object')return null;
 const street=[text(p.housenumber),text(p.street)].filter(Boolean).join(' ')||text(p.name);
 const city=text(p.city)||text(p.town)||text(p.village)||text(p.locality)||text(p.county);
 const region=text(p.state);const postalCode=text(p.postcode);const country=text(p.country);
 const line2=[city,region].filter(Boolean).join(', ')+(postalCode?' '+postalCode:'');
 const label=[street,line2,country].filter(Boolean).join(', ');
 if(!label||label.length<5||!(city||region||country))return null;
 return {label:label.slice(0,350),street:street.slice(0,180),city,region,postalCode,country};
}
export function normalizePhotonResults(input){
 if(!Array.isArray(input?.features))return [];
 const seen=new Set(),results=[];
 for(const feature of input.features.slice(0,12)){
  const value=normalizePhotonFeature(feature);
  if(!value||seen.has(value.label.toLowerCase()))continue;
  seen.add(value.label.toLowerCase());results.push(value);
  if(results.length>=6)break;
 }
 return results;
}
export function addressQueryValid(query){return typeof query==='string'&&query.trim().length>=3&&query.trim().length<=120&&!/[\x00-\x1f<>]/.test(query);}
