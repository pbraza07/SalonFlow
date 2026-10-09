'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import styles from '../site.module.css';
export default function AccountLink(){
 const [business,setBusiness]=useState<{slug:string;name:string}|null>(null);
 useEffect(()=>{const controller=new AbortController();fetch('/api/business',{cache:'no-store',signal:controller.signal}).then(r=>r.ok?r.json():null).then(d=>{if(d?.business?.slug&&d.business.status==='active')setBusiness({slug:d.business.slug,name:d.business.name});}).catch(()=>{});return()=>controller.abort();},[]);
 if(!business)return <p className={styles.ownerHint}>Already a business owner? <Link href="/login">Sign in to your workspace</Link></p>;
 return <p className={styles.ownerHint}>Welcome back. <Link href={'/studio/'+encodeURIComponent(business.slug)}>Open {business.name} workspace <ArrowUpRight size={15}/></Link></p>;
}
