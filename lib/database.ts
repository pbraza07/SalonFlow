import {getPool,postgresSQL,executeBatch} from '../server/database.mjs';
class Statement {
 sql:string; values:unknown[]=[];
 constructor(sql:string){this.sql=postgresSQL(sql);}
 bind(...values:unknown[]){this.values=values;return this;}
 async first<T=Record<string,unknown>>():Promise<T|null>{return (await getPool().query(this.sql,this.values)).rows[0] as T||null;}
 async all<T=Record<string,unknown>>():Promise<{results:T[]}>{return {results:(await getPool().query(this.sql,this.values)).rows as T[]};}
}
export const db=()=>({prepare:(sql:string)=>new Statement(sql),batch:(statements:Statement[])=>executeBatch(getPool(),statements)});
