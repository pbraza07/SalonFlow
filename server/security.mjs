import {scryptSync,randomBytes,timingSafeEqual,createHash} from 'node:crypto';
export function hashPassword(password){const salt=randomBytes(16).toString('hex');return `scrypt:${salt}:${scryptSync(password,salt,64).toString('hex')}`;}
export function verifyPassword(password,encoded){try{const [scheme,salt,key]=encoded.split(':');if(scheme!=='scrypt')return false;const expected=Buffer.from(key,'hex');const actual=scryptSync(password,salt,64);return expected.length===actual.length&&timingSafeEqual(expected,actual);}catch{return false;}}
export function tokenHash(token){return createHash('sha256').update(token).digest('hex');}
export function trustedOrigin(req){const configured=process.env.APP_URL||process.env.RENDER_EXTERNAL_URL;return configured?new URL(configured).origin:new URL(req.url).origin;}
export function validOrigin(req){const origin=req.headers.get('origin');return !!origin&&origin===trustedOrigin(req);}
export function sessionToken(req){const match=(req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('salonflow_session='));return match?match.slice('salonflow_session='.length):null;}
export function cookie(token,maxAge=43200){return `salonflow_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV==='production'?'; Secure':''}`;}
