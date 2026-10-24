import type{Block}from'./model';
type Item={str:string;transform:number[];width:number;height:number;fontName:string;hasEOL?:boolean};
type Line={text:string;x:number;y:number;right:number;height:number;font:string;page:number};
type Doc={numPages:number;getPage:(n:number)=>Promise<{getTextContent:()=>Promise<{items:unknown[]}>;getViewport:(o:{scale:number})=>{width:number;height:number}}>} ;
export function linesFromItems(items:unknown[],page:number):Line[]{const lines:Line[]=[];let current:Line|null=null;for(const raw of items){const v=raw as Item;if(typeof v.str!=='string')continue;const x=v.transform[4],y=v.transform[5];if(current&&(Math.abs(current.y-y)>3||x<current.x-10)){if(current.text.trim())lines.push(current);current=null;}if(!current)current={text:'',x,y,right:x,height:v.height,font:v.fontName,page};if(v.str.trim()){current.text+=(current.text&&!current.text.endsWith(' ')?' ':'')+v.str;current.right=Math.max(current.right,x+v.width);current.height=Math.max(current.height,v.height);}if(v.hasEOL){if(current.text.trim())lines.push(current);current=null;}}if(current?.text.trim())lines.push(current);return lines;}
function tidy(text:string){return text.replace(/\b(pro|de|re|con|ef|signi|identi|classi|dif|suf)\s+(fi|fl)([a-z]+)/g,'$1$2$3').replace(/\bin fluenc/g,'influenc').replace(/([a-z])[-‐]\s+([a-z])/g,'$1$2').replace(/\s+([,.;:!?])/g,'$1').replace(/\s+/g,' ').replace(/\bfi\s+(?=[a-z])/g,'fi').replace(/\bfl\s+(?=[a-z])/g,'fl').replace(/\u0000/g,'').trim();}
function splitLong(text:string){if(text.split(/\s+/).length<170)return[text];const sentences=text.match(/[^.!?]+[.!?]*/g)||[text];const result:string[]=[];let part='';for(const sentence of sentences){if((part+sentence).split(/\s+/).length>140&&part){result.push(part.trim());part='';}part+=sentence+' ';}if(part.trim())result.push(part.trim());return result;}
export async function extractPdfDocument(doc:Doc,onPage?:(page:number,total:number)=>void){
 const blocks:Block[]=[],metadata:string[]=[];let first=true;
 for(let n=1;n<=doc.numPages;n++){
  onPage?.(n,doc.numPages);const page=await doc.getPage(n),vp=page.getViewport({scale:1});const raw=linesFromItems((await page.getTextContent()).items,n);
  const heights=raw.filter(l=>l.height>5&&l.text.length>30).map(l=>Math.round(l.height*2)/2);const freq=new Map<number,number>();heights.forEach(h=>freq.set(h,(freq.get(h)||0)+1));const bodyHeight=[...freq].sort((a,b)=>b[1]-a[1])[0]?.[0]||10;
  let lines=raw.filter(l=>l.y>vp.height*.045&&l.y<vp.height*.96&&l.x>vp.width*.035&&l.height>=bodyHeight*.73&&!/^\d+\s*$/.test(l.text)&&!/^Downloaded from|^Vol\.:|^www\.|^https?:\/\//i.test(l.text));
  if(first&&n===1&&raw.some(l=>/eprints@whiterose|White Rose Research Online/.test(l.text))){metadata.push(...raw.map(l=>l.text));continue;}
  if(first){const start=lines.findIndex(l=>/^abstract\b|^to test the hypothesis|^we study\b|^we examined\b|^over the last four decades|^inspired by\b|^business models, dynamic capabilities|^the use of the internet/i.test(l.text.trim()));if(start>0){metadata.push(...lines.slice(0,start).map(l=>l.text));lines=lines.slice(start);}first=false;}
  let paragraph='',previous:Line|null=null;
  const flush=()=>{if(paragraph.trim()){for(const p of splitLong(tidy(paragraph)))if(p.length>20)blocks.push({id:'b-'+blocks.length,kind:'paragraph',text:p,page:n});paragraph='';}};
  for(const line of lines){const text=tidy(line.text);if(!text)continue;const heading=(/^(abstract|introduction|results(?: and discussion)?|discussion|conclusions?|methods|materials and methods|references|acknowledg(e)?ments|limitations|funding|author contributions|data availability|appendix|significance)\s*[:.]?$/i.test(text)||/^\d{1,2}\.(?:\d+\.?)*\s+[A-Z][^.!?]{2,85}$/.test(text))||(line.height>bodyHeight*1.23&&text.length>3&&text.length<110&&!/[.!?]$/.test(text));
   if(/^(Contents lists available|journal homepage|j o u r n a l|E-mail address|E-mail addresses|Corresponding author|Please cite this article|Received \d|Accepted \d|\* for Long Range Planning|Long Range Planning xxx|International Journal of Information Management xxx|\d{4}-\d{4}\/)/i.test(text)){metadata.push(text);continue;}
   if(text.length===1&&/^[A-Z]$/.test(text)){paragraph+=text;previous=line;continue;}
   if(heading){flush();blocks.push({id:'b-'+blocks.length,kind:'heading',text,page:n});previous=line;continue;}
   const columnSwitch=previous&&(line.y>previous.y+bodyHeight*2||Math.abs(line.x-previous.x)>vp.width*.27);
   const gap=previous?previous.y-line.y:0;
   const indent=previous&&line.x-previous.x>5&&line.x-previous.x<24&&gap>0;
   const shortPrevious=previous&&previous.right-previous.x<vp.width*.30&&/[.!?:;]$/.test(previous.text.trim());
   if(columnSwitch||gap>bodyHeight*1.8||indent||shortPrevious)flush();
   paragraph+=(paragraph&&paragraph.length!==1?' ':'')+text;previous=line;
  }flush();
 }
 return{blocks,metadata:metadata.join('\n'),version:2};
}
