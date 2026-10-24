import{validateBook,type PrivateBook}from'./books';
import{emptyData,legacyData,mergeData}from'./model';
import{selectQuote}from'./quote';
import{createClient}from'@supabase/supabase-js';
export const SUPABASE_URL='https://icpirkkojrzoaoyibpiz.supabase.co';
export const PUBLISHABLE_KEY='sb_publishable_sLuzWthdq8Xpz7TAvQdLzg_nhTF_dwn';
export const OWNER_EMAIL='adisaputra.dicky.21@gmail.com';
export const supabase=createClient(SUPABASE_URL,PUBLISHABLE_KEY);
export const isPreview=import.meta.env.DEV&&new URLSearchParams(location.search).get('qa')==='preview';
let previewData=emptyData();const previewBooks=new Map<string,PrivateBook>();
const nativeFetch=globalThis.fetch.bind(globalThis);
export async function apiFetch(input:RequestInfo|URL,init?:RequestInit):Promise<Response>{
 const path=String(input),base='/ruang-tumbuh/api/';if(!path.startsWith(base))return nativeFetch(input,init);
 if(isPreview){const docs=await nativeFetch('/ruang-tumbuh/curated/bundle.json').then(r=>r.json());if(path.includes('/books/document')){if(init?.method==='POST'){const book=validateBook(JSON.parse(String(init.body)));previewBooks.set(book.reading.id,book);return Response.json({reading:book.reading});}return Response.json(previewBooks.get(new URL(path,location.origin).searchParams.get('id')||'')||{error:'Buku tidak ditemukan'});}if(path.includes('/library/document?')){const id=new URL(path,location.origin).searchParams.get('id');return Response.json(docs.find((d:{id:string})=>d.id===id)||{error:'Tidak ditemukan'});}if(path.endsWith('/state')){if(init?.method==='PUT')previewData=mergeData(previewData,legacyData(JSON.parse(String(init.body))));return Response.json({data:previewData,revision:1});}if(path.endsWith('/access'))return Response.json({allowed:true});if(path.endsWith('/topics/refresh'))return Response.json({cached:true});if(path.endsWith('/daily'))return Response.json({papers:docs.map((d:{reading:unknown})=>d.reading),quote:selectQuote(docs,previewData.preferences.topics),updatedAt:null,errors:[]});if(path.endsWith('/news'))return Response.json({items:[],updatedAt:null});}
 const{data:{session}}=await supabase.auth.getSession();if(!session)return Response.json({error:'Masuk untuk membuka Ruang Tumbuh.'},{status:401});
 const headers=new Headers(init?.headers);headers.set('Authorization','Bearer '+session.access_token);headers.set('apikey',PUBLISHABLE_KEY);
 const endpoint=SUPABASE_URL+'/functions/v1/ruang-tumbuh/'+path.slice(base.length);
 let response=await nativeFetch(endpoint,{...init,headers});
 if(response.status===401){const{data,error}=await supabase.auth.refreshSession();if(!error&&data.session){headers.set('Authorization','Bearer '+data.session.access_token);response=await nativeFetch(endpoint,{...init,headers});}}
 return response;
}
export async function downloadExport(message:(s:string)=>void){try{const r=await apiFetch('/ruang-tumbuh/api/export');if(!r.ok)throw new Error();const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ruang-tumbuh-migrasi-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch{message('Ekspor belum berhasil. Coba kembali saat tersambung internet.');}}
