'use client';
import {CalendarDays,ChevronLeft,ChevronRight} from 'lucide-react';
import {today,timeLabel} from '../../lib/defaults';

export type PublicCalendarDay={
 date:string;
 available:number;
 sessions:{id:string;start:number;capacity:number;remaining:number;service:string}[];
};
type Mode='day'|'week'|'month';
const dateObj=(date:string)=>new Date(date+'T12:00:00Z');
const iso=(d:Date)=>d.toISOString().slice(0,10);
const label=(date:string,options:Intl.DateTimeFormatOptions)=>
 dateObj(date).toLocaleDateString('en-US',{...options,timeZone:'UTC'});

export default function PublicAvailabilityCalendar({
 date,anchor,mode,onMode,onAnchor,onSelect,days,loading
}:{
 date:string;anchor:string;mode:Mode;onMode:(v:Mode)=>void;onAnchor:(v:string)=>void;
 onSelect:(v:string)=>void;days:PublicCalendarDay[];loading:boolean;
}){
 const byDay=new Map(days.map(day=>[day.date,day]));
 const start=dateObj(anchor);
 if(mode==='week')start.setUTCDate(start.getUTCDate()-start.getUTCDay());
 if(mode==='month')start.setUTCDate(1);
 const count=mode==='day'?1:mode==='week'?7:
   new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+1,0)).getUTCDate();
 const shown=Array.from({length:count},(_,i)=>{
  const d=new Date(start);d.setUTCDate(d.getUTCDate()+i);return iso(d);
 });
 const go=(direction:number)=>{
  const d=dateObj(anchor);
  if(mode==='month')d.setUTCMonth(d.getUTCMonth()+direction,1);
  else d.setUTCDate(d.getUTCDate()+direction*(mode==='week'?7:1));
  onAnchor(iso(d));
 };
 const title=mode==='day'?label(anchor,{weekday:'long',month:'long',day:'numeric',year:'numeric'}):
   mode==='week'?'Week of '+label(shown[0],{month:'short',day:'numeric',year:'numeric'}):
   label(anchor,{month:'long',year:'numeric'});
 const maxDate=new Date(Date.now()+366*86400000).toISOString().slice(0,10);
 return <section className="sf-public-calendar" aria-label="Customer availability calendar">
  <div className="sf-public-calendar-toolbar">
   <div className="sf-public-calendar-modes" role="group" aria-label="Calendar view">
    {(['day','week','month'] as const).map(option=><button type="button" key={option}
      className={mode===option?'primary':'outline'} aria-pressed={mode===option}
      onClick={()=>onMode(option)}>{option==='day'?'Daily':option==='week'?'Weekly':'Monthly'}</button>)}
   </div>
   <div className="sf-public-calendar-navigation">
    <button type="button" className="outline" aria-label="Previous calendar period" onClick={()=>go(-1)}><ChevronLeft size={17}/></button>
    <strong><CalendarDays size={16} aria-hidden="true"/> {title}</strong>
    <button type="button" className="outline" aria-label="Next calendar period" onClick={()=>go(1)}><ChevronRight size={17}/></button>
   </div>
  </div>
  {loading&&<p className="muted" role="status">Updating available times and session seats…</p>}
  <div className={'sf-public-calendar-grid sf-public-calendar-'+mode}>
   {mode==='month'&&Array.from({length:start.getUTCDay()},(_,i)=><span aria-hidden="true" className="sf-public-calendar-blank" key={'blank-'+i}/>)}
   {shown.map(key=>{
    const item=byDay.get(key);
    const disabled=key<today()||key>maxDate;
    return <button type="button" key={key} disabled={disabled}
      aria-label={label(key,{weekday:'long',month:'long',day:'numeric'})+
        ', '+(item?item.available+' available start times':'availability not loaded')}
      aria-pressed={key===date}
      className={'sf-public-calendar-date'+(key===date?' selected':'')}
      onClick={()=>onSelect(key)}>
      <strong>{label(key,{weekday:'short',month:'short',day:'numeric'})}</strong>
      <span>{disabled?'Unavailable':item?item.available+' available times':'Check availability'}</span>
      {item?.sessions.map(session=><small key={session.id} className={'sf-public-session-summary'+(session.remaining===0?' full':'')}>
       {timeLabel(session.start)} · {session.remaining}/{session.capacity} slots left
      </small>)}
    </button>;
   })}
  </div>
  <p className="muted"><small>Eastern Time · Choose a date to view exact available times. Session counts reflect confirmed bookings; requests requiring approval do not hold a seat.</small></p>
 </section>;
}
