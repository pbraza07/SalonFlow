import {publicGet,studioPost} from '../../../lib/studio-handler';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const GET=publicGet;
export async function POST(req:Request){return studioPost(req,true);}
