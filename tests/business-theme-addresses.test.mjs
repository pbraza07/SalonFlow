import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {addressQueryValid,normalizePhotonFeature,normalizePhotonResults} from '../server/address-tools.mjs';
import {themeStyles,DEFAULT_THEME,contrast,PALETTES,COLOR_ROLES} from '../server/themes.mjs';
const src=async p=>readFile(new URL('../'+p,import.meta.url),'utf8');
test('Photon address results are normalized, deduplicated and safe',()=>{
 const feature={properties:{housenumber:'742',street:'Evergreen Terrace',city:'Springfield',state:'Florida',postcode:'33544',country:'United States'}};
 const n=normalizePhotonFeature(feature);assert.equal(n.label,'742 Evergreen Terrace, Springfield, Florida 33544, United States');
 assert.equal(n.city,'Springfield');assert.equal(n.region,'Florida');
 assert.equal(normalizePhotonFeature(null),null);
 const data={features:Array(15).fill(feature).concat([{properties:{name:'Tampa',state:'Florida',country:'United States'}}])};
 assert.equal(normalizePhotonResults(data).length,2);
 assert.deepEqual(normalizePhotonResults({}),[]);
 assert.equal(addressQueryValid('742 Evergreen'),true);
 for(const invalid of ['a','  ','x'.repeat(121),'<script>','a\u0000abc'])assert.equal(addressQueryValid(invalid),false);
});
test('business theme exposes readable colors for all 20 palettes',()=>{
 assert.equal(PALETTES.length,20);assert.equal(COLOR_ROLES.length,19);
 for(const p of PALETTES){
 const vars=themeStyles({...DEFAULT_THEME,palette:p.id,colors:{...p.colors}});
 for(const role of ['page','header','hero','surface','card','policy','footer','button','buttonHover','secondaryButton','selected','step','input']){
 const css='--sf-on-'+role.replace(/[A-Z]/g,x=>'-'+x.toLowerCase());
 assert.ok(contrast(p.colors[role],vars[css])>=4.5,p.name+' '+role);
 }
 for(const v of ['--sf-heading-on-page','--sf-heading-on-hero','--sf-heading-on-surface','--sf-link-on-surface'])assert.match(vars[v],/^#[0-9a-fA-F]{6}$/);
 }
});
test('existing owner and public routes consistently consume owner theme and maps links',async()=>{
 const owner=await src('app/studio/owner-dashboard.tsx');
 const booking=await src('app/book/page.tsx');
 const business=await src('app/[slug]/page.tsx');
 const profile=await src('app/business/page.tsx');
 const market=await src('app/discover/page.tsx');
 const api=await src('app/api/business/route.ts');
 const settings=await src('lib/studio-handler.ts');
 for(const file of [owner,booking,business,profile])assert.match(file,/themeStyles\(/);
 for(const file of [owner,booking,business,profile,market])assert.match(file,/googleMapsDirections\(/);
 assert.match(owner,/AddressAutocomplete/);assert.match(profile,/AddressAutocomplete/);
 assert.match(api,/settings.address=address/);assert.match(settings,/settings/);assert.match(settings,/city=COALESCE/);
 assert.match(booking,/encodeURIComponent\(config.slug\)/);
 const addressRoute=await src('app/api/addresses/route.ts');
 assert.match(addressRoute,/requireOwner\(req\)/);assert.match(addressRoute,/lastUpstream/);
 assert.match(addressRoute,/photon.komoot.io/);
 const style=await src('app/platform-pages.module.css');assert.match(style,/\.businessTheme/);
});
