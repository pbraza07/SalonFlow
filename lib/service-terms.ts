
export const DURATION_UNITS=['minutes','hours','days','weeks','months','years'] as const;
export type DurationUnit=typeof DURATION_UNITS[number];
export function isTermUnit(unit:string){return ['days','weeks','months','years'].includes(unit);}
export function isCalendarUnit(unit:string){return unit==='minutes'||unit==='hours';}
export function normalizedDuration(service:{duration:number;durationUnit?:string;durationValue?:number}){
 const unit=(service.durationUnit||'minutes') as DurationUnit;
 const value=service.durationValue===undefined?(unit==='hours'?service.duration/60:service.duration):service.durationValue;
 return {unit,value};
}
export function validDuration(service:{duration:number;durationUnit?:string;durationValue?:number}){
 const {unit,value}=normalizedDuration(service);
 if(!DURATION_UNITS.includes(unit)||!Number.isInteger(value)||value<1||value>365)return false;
 if(unit==='minutes')return value>=15&&value<=480&&value%15===0&&service.duration===value;
 if(unit==='hours')return value>=1&&value<=8&&service.duration===value*60;
 return isTermUnit(unit)&&service.duration===0;
}
export function durationLabel(service:{duration:number;durationUnit?:string;durationValue?:number}){
 const {unit,value}=normalizedDuration(service);return value+' '+(value===1?unit.replace(/s$/,''):unit);
}
export function endDateForTerm(start:string,value:number,unit:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!Number.isInteger(value)||value<1||value>365||!isTermUnit(unit))throw Error('Invalid term date or duration.');
 const parts=start.split('-').map(Number),startDate=new Date(Date.UTC(parts[0],parts[1]-1,parts[2]));
 if(startDate.toISOString().slice(0,10)!==start)throw Error('Invalid start date.');
 const end=new Date(startDate);
 if(unit==='days')end.setUTCDate(end.getUTCDate()+value);
 if(unit==='weeks')end.setUTCDate(end.getUTCDate()+7*value);
 if(unit==='months'||unit==='years'){
  const months=value*(unit==='years'?12:1),target=parts[1]-1+months;
  const y=parts[0]+Math.floor(target/12),m=((target%12)+12)%12;
  const finalDay=new Date(Date.UTC(y,m+1,0)).getUTCDate();
  end.setTime(Date.UTC(y,m,Math.min(parts[2],finalDay)));
 }
 return end.toISOString().slice(0,10);
}
