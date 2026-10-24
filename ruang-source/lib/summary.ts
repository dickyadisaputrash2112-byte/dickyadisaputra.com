import type{Block,Reading}from'./model.ts';
import{summaries}from'./catalog/summaries.ts';
export type ReadingSummary={text:string;language:'id'|'en';kind:'editorial'|'abstract-excerpt'};
const tidy=(s:string)=>s.replace(/\s+/g,' ').trim();
const boilerplate=/artikel penelitian dari jurnal dalam daftar kurasi|teks utama, metode, dan referensinya|jurnal terverifikasi|teks lengkap.*tersedia di ruang/i;
export function abstractExcerpt(blocks:Block[]):ReadingSummary|undefined{
 const paragraphs=blocks.filter(b=>b.section==='abstract'&&b.kind==='paragraph').map(b=>tidy(b.text)).filter(t=>t&&!/^(?:trial registration|registration|funding|copyright|the online version)/i.test(t));if(!paragraphs.length)return;
 const source=paragraphs.join(' '),sentences=Array.from(new Intl.Segmenter('en',{granularity:'sentence'}).segment(source),s=>s.segment.trim()).filter(Boolean),chosen:string[]=[];let length=0;
 for(const sentence of sentences){if(chosen.length>=2)break;if(!chosen.length&&sentence.length>700)return; if(chosen.length&&length+sentence.length>700)break;chosen.push(sentence);length+=sentence.length+1;}
 const text=chosen.join(' ');return text?{text,language:'en',kind:'abstract-excerpt'}:undefined;
}
export function withSummary(reading:Reading,blocks?:Block[]):Reading{
 if(reading.type!=='journal'&&reading.type!=='book')return reading;
 const text=summaries[reading.id]||summaries[reading.doi?'doi:'+reading.doi.toLowerCase():''];const summary:ReadingSummary|undefined=text?{text,language:'id',kind:'editorial'}:reading.summary|| (blocks?abstractExcerpt(blocks):undefined);
 return summary?{...reading,summary}:reading;
}
export function cardSummary(reading:Reading):{text:string;label?:string;language?:'id'|'en'}{
 const r=withSummary(reading);if(r.summary)return{text:r.summary.text,label:r.summary.kind==='abstract-excerpt'?'Cuplikan abstrak · EN':'Ringkasan isi',language:r.summary.language};
 if(r.type==='journal')return{text:'Ringkasan isi belum tersedia untuk bacaan ini.',label:'Ringkasan isi'};
 const text=tidy(reading.description||'');if(!text||boilerplate.test(text))return{text:'Belum ada cuplikan teks.'};return{text};
}
