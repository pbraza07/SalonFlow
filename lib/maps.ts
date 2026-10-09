
/** Google Maps universal directions URL; no API key needed. */
export function googleMapsDirections(address:string){
 const value=address.trim().slice(0,350);
 if(!value)return '';
 return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(value);
}
export function displayBusinessAddress(street?:string|null,city?:string|null,region?:string|null){
 const s=(street||'').trim();if(s&&!/^Add your /i.test(s))return s;
 return [city,region].filter(Boolean).join(', ');
}
