import type{Reading}from'../model.ts';
import{CATALOG_VERSION,type CatalogStore,type CuratedDocument,type CatalogIndex}from'./contracts.ts';
import{discoverCandidates,downloadXml}from'./provider.ts';
import{parseJats}from'./jats.ts';
import{topicQuery,journalsForTopic}from'./policy.ts';
const normalized=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export const ready=(r:Reading)=>r.type==='journal'&&r.textKind==='full'&&r.curation?.status==='ready'&&r.curation.version===CATALOG_VERSION;
export function createCatalog(store:CatalogStore,bundle:CuratedDocument[]){
 const docKey=(id:string)=>'catalog:v7:document:'+id;
 async function document(id:string){let saved:CuratedDocument|null=null;try{saved=await store.get<CuratedDocument>(docKey(id));}catch{}return saved||bundle.find(d=>d.id===id)||null;}
 async function allDocuments(){let saved:CuratedDocument[]=[];try{saved=await store.list<CuratedDocument>('catalog:v7:document:');}catch{}return[...saved,...bundle].filter((d,i,a)=>d?.reading&&ready(d.reading)&&a.findIndex(v=>v.id===d.id)===i);}
 async function search(topic:string,year:number,order:string,force=false):Promise<CatalogIndex>{
  const key='catalog:v7:search2:'+year+':'+order+':'+normalized(topic),cached=await store.get<CatalogIndex>(key);if(cached&&!force&&Date.now()-Date.parse(cached.updatedAt)<86400_000)return cached;
  const errors:string[]=[],items:Reading[]=[];let rejected=0;
  const docs=await allDocuments(),tokens=topicQuery(topic).split(/\s+OR\s+/i).map(normalized).filter(Boolean),fallback=docs.map(d=>d.reading).filter(r=>(r.year||0)>=year&&journalsForTopic(topic).some(j=>normalized(j.name)===normalized(r.source))&&tokens.some(t=>(' '+normalized(r.title+' '+r.topic+' '+r.description+' '+r.source)+' ').includes(' '+t+' ')));
  try{const candidates=await discoverCandidates(topic,year,order);for(const c of candidates.slice(0,7)){try{const id='doi:'+c.doi.toLowerCase(),existing=await document(id);if(existing){items.push(existing.reading);continue;}const doc=await parseJats(await downloadXml(c),c);await store.put(docKey(doc.id),doc);items.push(doc.reading);if(items.length>=4)break;}catch{rejected++;}}}catch(e){errors.push((e as Error).message);}
  const combined=[...items,...fallback].filter((r,i,a)=>ready(r)&&a.findIndex(x=>x.id===r.id)===i);if(order==='latest')combined.sort((a,b)=>(b.published||'').localeCompare(a.published||''));
  const result:CatalogIndex={items:combined.slice(0,12),updatedAt:new Date().toISOString(),policyVersion:CATALOG_VERSION,errors,rejected,notice:combined.length?'Semua hasil sudah memiliki teks lengkap di Ruang. Kurasi sumber tidak menjamin setiap kesimpulan pasti benar.':'Belum ada teks lengkap yang lolos untuk topik dan tahun ini. Coba istilah Inggris atau rentang 2024–2026; standar kurasi tetap dipertahankan.'};if(result.items.length||!errors.length)await store.put(key,result);return result;
 }
 async function snapshot(){return{version:1,policyVersion:CATALOG_VERSION,documents:await allDocuments()};}
 return{document,allDocuments,search,snapshot};
}
