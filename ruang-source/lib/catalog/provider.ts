import{DOMParser}from'linkedom';
import{journals,topicQuery,checkCandidate,journalsForTopic}from'./policy.ts';
import type{Candidate}from'./contracts.ts';
const base='https://www.ebi.ac.uk/europepmc/webservices/rest';
const plain=(s:string)=>new DOMParser().parseFromString('<div>'+s+'</div>','text/html').textContent?.replace(/\s+/g,' ').trim()||s.replace(/<[^>]*>/g,' ');
export function toCandidate(a:Record<string,any>,topic:string):Candidate{
 const j=a.journalInfo?.journal||{},types=(a.pubTypeList?.pubType||[])as string[],corrections=JSON.stringify(a.commentCorrectionList||{});
 return{pmcid:a.pmcid||'',doi:a.doi||'',title:plain(a.title||''),journal:j.title||a.journalTitle||'',issns:[j.issn,j.essn].filter(Boolean),year:Number(a.pubYear||a.firstPublicationDate?.slice(0,4)),published:a.firstPublicationDate||'',authors:(a.authorList?.author||[]).map((v:any)=>v.fullName||v.lastName||'').filter(Boolean),types,license:a.license||'',abstract:plain(a.abstractText||''),retracted:/retract|withdraw/i.test(corrections)||a.isRetracted==='Y'||types.some(t=>/retract|withdraw/i.test(t)),authorAffiliations:JSON.stringify((a.authorList?.author||[]).map((v:any)=>v.authorAffiliationDetailsList||[])),topic};
}
async function json(query:string,pageSize=14){const p=new URLSearchParams({query,format:'json',resultType:'core',pageSize:String(pageSize)});const r=await fetch(base+'/search?'+p,{signal:AbortSignal.timeout(22000)});if(!r.ok)throw new Error('Sumber teks lengkap belum merespons. Koleksi yang sudah tersimpan tetap bisa dibaca.');return await r.json()as{resultList?:{result?:Record<string,any>[]}};}
export async function discoverCandidates(topic:string,year=2026,order='relevance'){
 const terms=topicQuery(topic).split(/\s+OR\s+/i).map(s=>'TITLE_ABS:'+(/\s/.test(s)&&!s.startsWith('"')?'"'+s+'"':s)).join(' OR '),issns=journalsForTopic(topic).flatMap(j=>j.issns).map(i=>'ISSN:'+i).join(' OR '),today=new Date().toISOString().slice(0,10);
 const query='('+terms+') AND ('+issns+') AND OPEN_ACCESS:Y AND IN_PMC:Y AND FIRST_PDATE:['+year+'-01-01 TO '+today+'] NOT PUB_TYPE:preprint NOT PUB_TYPE:editorial NOT PUB_TYPE:retracted-publication'+(order==='latest'?' sort_date:y':'');
 const data=await json(query);return(data.resultList?.result||[]).map(a=>toCandidate(a,topic)).filter(c=>checkCandidate(c).allowed);
}
export async function candidateByPmc(pmcid:string,topic:string){if(!/^PMC\d+$/.test(pmcid))throw new Error('Identitas dokumen tidak valid');const d=await json('EXT_ID:'+pmcid+' AND SRC:PMC',1);let a=d.resultList?.result?.[0];if(!a){const fallback=await json(pmcid,1);a=fallback.resultList?.result?.[0];}if(!a||a.pmcid!==pmcid)throw new Error('Metadata artikel tidak ditemukan');return toCandidate(a,topic);}
export async function downloadXml(c:Candidate){if(!/^PMC\d+$/.test(c.pmcid))throw new Error('Identitas dokumen tidak valid');const r=await fetch(base+'/'+c.pmcid+'/fullTextXML',{signal:AbortSignal.timeout(25000)});if(!r.ok)throw new Error('Teks lengkap belum bisa disimpan');const xml=await r.text();if(xml.length>4_000_000)throw new Error('Dokumen terlalu besar');return xml;}
