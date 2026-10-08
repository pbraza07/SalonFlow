import {ownerGet,studioPost} from '../../../lib/studio-handler';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const GET=ownerGet;
export async function POST(req:Request){return studioPost(req);}
