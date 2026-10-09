export const PRIMARY_PLATFORM_EMAIL='pbraza@gmail.com';
export async function getPlatformRole(pool,userId){
 const {rows}=await pool.query("SELECT p.role,u.email FROM platform_admins p JOIN users u ON u.id=p.user_id WHERE p.user_id=$1 AND p.role IN ('primary','admin')",[userId]);
 const item=rows[0];return !item||item.role==='primary'&&item.email!==PRIMARY_PLATFORM_EMAIL?null:item.role;
}
export function validNewPassword(p){return typeof p==='string'&&p.length>=6&&p.length<=128;}
