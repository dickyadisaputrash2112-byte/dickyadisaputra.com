export type Block = {id:string;kind:'heading'|'paragraph'|'caption';text:string;page?:number;image?:string;imageAlt?:string;section?:'abstract'|'body'|'back'};
export type Curation = {version:number;status:'ready';review:'editorial'|'source-policy';reason:string;method:string;limitations:string;criteria:string[];checkedAt:string;licenseUrl?:string;sourceUrl:string;authorCredentials:'not-inferred';};
export type Highlight = {id:string;blockId:string;start:number;end:number;quote:string;color:'yellow'|'blue'|'pink';lang:'en'|'id';learn:boolean;createdAt:number;updatedAt:number;deletedAt?:number};
export type Reading = {id:string;title:string;topic:string;categories?:string[];source:string;year?:number;url:string;fetchUrl?:string;pdfUrl?:string;type:'journal'|'news'|'personal';description:string;guide:string;published?:string;authors?:string[];license?:string;isPreprint?:boolean;access?:'open'|'unknown';textKind?:'full'|'abstract'|'excerpt'|'link';blocks?:Block[];local?:boolean;documentId?:string;documentRevision?:string;doi?:string;wordCount?:number;readingMinutes?:number;curation?:Curation;language?:string;};
export type Entry = {notes:string[];original?:string[];blocks?:Block[];translated?:string[];translations?:Record<string,string>;contentVersion?:number;contentRevision?:string;textKind?:Reading['textKind'];highlights:Highlight[];saved?:boolean;done?:string;read?:boolean;page?:number;item?:Reading;updatedAt:number;notesUpdatedAt?:number;contentUpdatedAt?:number;savedUpdatedAt?:number;progressUpdatedAt?:number;category?:string;deletedAt?:number;organizeUpdatedAt?:number};
export type Preferences = {topics:string[];fontSize:number;lineHeight:number;theme:'paper'|'white'|'night';rate:number;updatedAt:number};
export type LearningData = {entries:Record<string,Entry>;custom:Reading[];preferences:Preferences};
export const emptyData=():LearningData=>({entries:{},custom:[],preferences:{topics:['education','marketing','business','artificial intelligence'],fontSize:20,lineHeight:1.85,theme:'paper',rate:1,updatedAt:0}});
export function mergeData(a:LearningData,b:LearningData):LearningData{
 const entries:Record<string,Entry>={};
 for(const id of new Set([...Object.keys(a.entries||{}),...Object.keys(b.entries||{})])){
  const x=a.entries[id],y=b.entries[id];if(!x||!y){entries[id]=x||y;continue;}
  const latest=(x.updatedAt||0)>(y.updatedAt||0)?x:y,entry={...latest};
  const newer=(key:keyof Entry)=>((x[key] as number)??x.updatedAt??0)>((y[key] as number)??y.updatedAt??0)?x:y;
  const n=newer('notesUpdatedAt');entry.notes=n.notes;entry.notesUpdatedAt=n.notesUpdatedAt;
  const c=newer('contentUpdatedAt');for(const key of ['original','blocks','translated','translations','contentVersion','contentRevision','textKind','contentUpdatedAt'] as const)(entry as Record<string,unknown>)[key]=c[key];
  const s=newer('savedUpdatedAt');entry.saved=s.saved;entry.savedUpdatedAt=s.savedUpdatedAt;
  const p=newer('progressUpdatedAt');for(const key of ['page','read','done','progressUpdatedAt'] as const)(entry as Record<string,unknown>)[key]=p[key];
  const o=(x.organizeUpdatedAt||0)>(y.organizeUpdatedAt||0)?x:y;entry.category=o.category;entry.deletedAt=o.deletedAt;entry.organizeUpdatedAt=o.organizeUpdatedAt;
  const marks=new Map<string,Highlight>();for(const h of [...(x.highlights||[]),...(y.highlights||[])])if(!marks.has(h.id)||(marks.get(h.id)!.updatedAt||0)<h.updatedAt)marks.set(h.id,h);
  entry.highlights=[...marks.values()];entries[id]=entry;
 }
 return {entries,custom:[...a.custom,...b.custom].filter((r,i,all)=>all.findIndex(x=>x.id===r.id)===i),preferences:(a.preferences.updatedAt||0)>(b.preferences.updatedAt||0)?a.preferences:b.preferences};
}
export function legacyData(raw:unknown):LearningData{
 const root=(raw||{}) as Record<string,unknown>,result=emptyData();
 if(Array.isArray(root.custom))result.custom=root.custom as Reading[];
 const saved=(root.entries||{}) as Record<string,Partial<Entry>>;
 for(const [id,e]of Object.entries(saved)){const t=e.updatedAt||Date.now();result.entries[id]={...e,notes:Array.from({length:5},(_,i)=>e.notes?.[i]||''),highlights:e.highlights||[],updatedAt:t,notesUpdatedAt:e.notesUpdatedAt??t,contentUpdatedAt:e.contentUpdatedAt??t,savedUpdatedAt:e.savedUpdatedAt??t,organizeUpdatedAt:e.organizeUpdatedAt??0,progressUpdatedAt:e.progressUpdatedAt??t};}
 if(root.preferences)result.preferences={...result.preferences,...root.preferences as Partial<Preferences>};
 if(typeof root.rate==='number')result.preferences.rate=root.rate;
 return result;
}
export function plainBlocks(text:string):Block[]{return text.replace(/\r/g,'').split(/\n\s*\n/).flatMap(p=>{p=p.trim();if(!p)return[];if(p.length<2200)return[p];const parts:string[]=[];let chunk='';for(const s of p.match(/[^.!?]+[.!?]*/g)||[p]){if(chunk.length+s.length>1600&&chunk){parts.push(chunk.trim());chunk='';}chunk+=s;}if(chunk.trim())parts.push(chunk.trim());return parts;}).map((text,i)=>({id:'p-'+i,kind:'paragraph',text}));}
