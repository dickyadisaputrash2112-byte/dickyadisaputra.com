import{parseHTML}from'linkedom';
import{Readability}from'@mozilla/readability';
import type{Block}from'./model.ts';
export function cleanHtml(input:string){let text=input;for(let i=0;i<3;i++){const{document}=parseHTML('<html><body><div>'+text+'</div></body></html>');document.querySelectorAll('script,style,iframe,object').forEach(n=>n.remove());document.querySelectorAll('p,br,div,li').forEach(n=>n.appendChild(document.createTextNode('\n')));const next=document.body.textContent||'';if(next===text)break;text=next;}return text.replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();}
export function fromHtml(html:string,url:string):{title:string;blocks:Block[];excerpt:string}{
 const{document}=parseHTML(html);Object.defineProperty(document,'documentURI',{value:url,configurable:true});
 const article=new Readability(document as unknown as Document,{charThreshold:300}).parse();
 if(!article?.content)throw new Error('Isi artikel belum dapat dikenali. Tautan tetap bisa disimpan; tempel teks atau gunakan bookmarklet dari Safari.');
 const parsed=parseHTML('<html><body>'+article.content+'</body></html>').document;
 parsed.querySelectorAll('script,style,nav,footer,header,form,button,iframe').forEach(n=>n.remove());
 const blocks:Block[]=[];
 for(const n of Array.from(parsed.querySelectorAll('h1,h2,h3,h4,p,blockquote,li,figcaption'))){if(n.parentElement?.closest('p,li,blockquote'))continue;const text=cleanHtml(n.textContent||'').trim();if(text.length<12)continue;blocks.push({id:'b-'+blocks.length,kind:/^H/.test(n.tagName)?'heading':n.tagName==='FIGCAPTION'?'caption':'paragraph',text});}
 if(blocks.filter(b=>b.kind==='paragraph').map(b=>b.text).join(' ').length<350)throw new Error('Sumber hanya memberikan cuplikan atau meminta akses. Buka sumber asli dan tempel teks yang bisa kamu baca.');
 return{title:article.title||parsed.title||url,blocks,excerpt:cleanHtml(article.excerpt||'')};
}
const allowed=['bbc.com','bbc.co.uk','theguardian.com','nature.com','springer.com','mdpi.com','frontiersin.org','plos.org','ncbi.nlm.nih.gov','arxiv.org','sciencedirect.com','danielle.li','eprints.whiterose.ac.uk','escholarship.org'];
export function supportedSource(url:string){try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&allowed.some(h=>u.hostname===h||u.hostname.endsWith('.'+h));}catch{return false;}}
export async function sourceFetch(url:string){let current=url;for(let i=0;i<5;i++){if(!supportedSource(current))throw new Error('Tautan tersimpan. Untuk sumber ini, tambahkan teks melalui bookmarklet Safari, tempel teks, atau unggah PDF.');const r=await fetch(current,{redirect:'manual',signal:AbortSignal.timeout(20000),headers:{Accept:'text/html,application/pdf'}});if([301,302,303,307,308].includes(r.status)){current=new URL(r.headers.get('location')||'',current).href;continue;}if(!r.ok)throw new Error('Sumber tidak mengizinkan pembacaan langsung. Buka sumber asli lalu tambahkan teks atau PDF.');if(Number(r.headers.get('content-length'))>20_000_000)throw new Error('Dokumen terlalu besar. Unduh dan unggah PDF hingga 25 MB.');return r;}throw new Error('Tautan berpindah terlalu banyak. Buka sumber asli.');}
