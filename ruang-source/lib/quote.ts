import type{CuratedDocument}from'./catalog/contracts.ts';
import type{Reading}from'./model.ts';
import{matchesTopic}from'./categories.ts';
export type DailyQuote={date:string;text:string;blockId:string;reading:Reading;revision:string};
export function wibDay(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
function hash(s:string){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
export function selectQuote(documents:CuratedDocument[],topics:string[],day=wibDay(),preferredId=''):DailyQuote|null{
 const candidates:{value:DailyQuote;score:number;tie:number}[]=[];
 for(const d of documents){if(!d.license?.url?.match(/creativecommons\.org\/licenses\/by(?:-nc)?\//))continue;const relevant=topics.some(t=>matchesTopic(d.reading.title+' '+d.reading.topic+' '+d.reading.description,t));
 for(const b of d.blocks){if(b.kind!=='paragraph'||b.section!=='body')continue;for(const part of new Intl.Segmenter('en',{granularity:'sentence'}).segment(b.text)){const text=part.segment.trim();if(text.length<65||text.length>230||/\b(?:fig(?:ure)?|table|appendix|supplementary|p\s*[<=>])\b|https?:|\[[\d,– -]+\]|\d{2,}/i.test(text))continue;let score=(relevant?35:0)+(d.id===preferredId?40:0)+(d.reading.curation?.review==='editorial'?15:0)+(/\b(?:learn|learning|understand|evidence|critical|decision|knowledge|support|practice|business|important|skills|research)\b/i.test(text)?12:0);candidates.push({value:{date:day,text,blockId:b.id,reading:d.reading,revision:d.revision},score,tie:hash(day+d.id+b.id+text)});}}
 }
 candidates.sort((a,b)=>b.score-a.score||a.tie-b.tie);return candidates[0]?.value||null;
}
