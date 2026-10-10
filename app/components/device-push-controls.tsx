'use client';
import {useEffect,useState} from 'react';
const decodeKey=(raw:string)=>{const padded=raw.padEnd(Math.ceil(raw.length/4)*4,'=').replace(/-/g,'+').replace(/_/g,'/');return Uint8Array.from(atob(padded),c=>c.charCodeAt(0));};
export default function DevicePushControls({teamToken}:{teamToken?:string}){
 const [supported,setSupported]=useState(false),[installed,setInstalled]=useState(false),[permission,setPermission]=useState('default'),[ready,setReady]=useState(false),[configured,setConfigured]=useState(false),[devices,setDevices]=useState(0),[enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
 const headers:Record<string,string>=teamToken?{Authorization:'Bearer '+teamToken}:{};
 const ios=typeof navigator!=='undefined'&&/iPad|iPhone|iPod/.test(navigator.userAgent);
 async function refresh(){
  const capable=typeof window!=='undefined'&&'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
  setSupported(capable);
  if(!capable)return;
  setPermission(Notification.permission);
  setInstalled(window.matchMedia('(display-mode: standalone)').matches||('standalone' in navigator&&(navigator as any).standalone===true));
  try{
   const r=await fetch('/api/push',{headers,cache:'no-store'}),d=await r.json();
   if(!r.ok)throw Error(d.error||'Unable to check push service.');
   setConfigured(d.configured===true);setDevices(d.subscribedDevices||0);
   if(!d.configured){setStatus('Push keys have not been configured on the SelahFlow server.');return;}
   const reg=await navigator.serviceWorker.getRegistration('/');
   const subscription=await reg?.pushManager.getSubscription();
   setEnabled(Boolean(subscription)&&Notification.permission==='granted');
   setReady(true);
  }catch(e){setStatus((e as Error).message);}
 }
 useEffect(()=>{refresh();},[teamToken]);
 async function enable(){
  setStatus('');setBusy(true);
  try{
   if(!('Notification' in window)||!('serviceWorker' in navigator)||!('PushManager' in window))throw Error('This browser does not support Web Push. Try Safari on an installed iPhone Home Screen app or a current Android/desktop browser.');
   if(ios&&!window.matchMedia('(display-mode: standalone)').matches&&!(navigator as any).standalone)throw Error('On iPhone, open SelahFlow in Safari, tap Share → Add to Home Screen, then launch it from the Home Screen to enable notifications.');
   // iOS requires the permission prompt to originate directly from this user tap.
   const decision=Notification.permission==='default'?await Notification.requestPermission():Notification.permission;
   setPermission(decision);
   if(decision!=='granted')throw Error('Notification permission was not granted. Change it in your device/browser notification settings.');
   const response=await fetch('/api/push',{headers,cache:'no-store'}),configuration=await response.json();
   if(!response.ok||!configuration.configured||!configuration.publicKey)throw Error(configuration.error||'The push provider needs to be configured by SelahFlow.');
   const registration=await navigator.serviceWorker.register('/sw.js',{scope:'/'});
   await navigator.serviceWorker.ready;
   const existing=await registration.pushManager.getSubscription();
   const subscription=existing||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodeKey(configuration.publicKey)});
   const save=await fetch('/api/push',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({action:'subscribe',subscription:subscription.toJSON()})});
   const result=await save.json();
   if(!save.ok)throw Error(result.error||'Device registration failed.');
   setEnabled(true);setConfigured(true);
   setStatus('Notifications enabled for this device and this business. New booking requests will generate alerts.');
   await refresh();
  }catch(e){setStatus((e as Error).message);}finally{setBusy(false);}
 }
 async function disable(){
  setBusy(true);setStatus('');
  try{
   const reg=await navigator.serviceWorker.getRegistration('/');
   const subscription=await reg?.pushManager.getSubscription();
   if(subscription){
    const r=await fetch('/api/push',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({action:'unsubscribe',endpoint:subscription.endpoint})});
    if(!r.ok)throw Error((await r.json()).error||'Unable to remove device.');
    await subscription.unsubscribe();
   }
   setEnabled(false);setStatus('Notifications disabled on this device.');await refresh();
  }catch(e){setStatus((e as Error).message);}finally{setBusy(false);}
 }
 return <section className="sf-push-settings" aria-label="Device push notifications">
 <div className="sf-push-settings-head"><div><strong>Device push notifications</strong><p>Get booking alerts on this phone or computer even when SelahFlow is closed. Each device must opt in separately.</p></div><span className={enabled?'sf-push-on':'sf-push-off'}>{enabled?'Enabled':'Not enabled'}</span></div>
 <p className="muted"><small>Device permission: {permission} · Registered reviewer devices: {devices} · {configured?'Push server configured':'Push server setup required'}</small></p>
 {ios&&!installed&&<p className="sf-push-instructions">iPhone: In Safari, tap <b>Share → Add to Home Screen</b>. Launch SelahFlow from the Home Screen, sign in/open your team link, then select Enable notifications.</p>}
 {!supported&&<p className="sf-push-instructions">Web Push is not available in this browser. Use a supported current browser; iOS requires an installed Home Screen web app (iOS 16.4+).</p>}
 <div className="sf-push-buttons"><button type="button" className="primary" onClick={enable} disabled={busy||!supported||!configured}>{busy?'Working…':enabled?'Re-enable for this reviewer':'Enable notifications on this device'}</button>{enabled&&<button type="button" className="outline" disabled={busy} onClick={disable}>Disable on this device</button>}</div>
 {status&&<p role="status" className="sf-push-status">{status}</p>}
 <small>No SMS fees or app-store installation are required for Web Push. Notifications require HTTPS, device permission, and an active internet connection. Email/SMS remain independent.</small>
 </section>;
}
