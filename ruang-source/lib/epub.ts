import{unzipSync,unzip,strFromU8}from'fflate';
import type{Block}from'./model.ts';
export type ImportedBook={title:string;authors:string[];language:string;blocks:Block[];chapters:number};
export async function readEpub(bytes:Uint8Array,parser:Pick<DOMParser,'parseFromString'>=new DOMParser()):Promise<ImportedBook>{
 if(bytes.length>25_000_000)throw new Error('Ukuran EPUB maksimum 25 MB.');let count=0,total=0;const wanted=new Set<string>();
 unzipSync(bytes,{filter:f=>{if(++count>6000)throw new Error('EPUB memiliki terlalu banyak berkas.');if(/(?:\.xml|\.opf|\.xhtml|\.html|mimetype)$/i.test(f.name)){if(f.originalSize>5_000_000||(total+=f.originalSize)>30_000_000)throw new Error('Isi EPUB terlalu besar untuk dibuka di perangkat ini.');wanted.add(f.name);}return false;}});
 const files=await new Promise<Record<string,Uint8Array>>((resolve,reject)=>unzip(bytes,{filter:f=>wanted.has(f.name)},(error,data)=>error?reject(new Error('Arsip EPUB rusak atau terenkripsi.')):resolve(data)));
 const xml=(path:string)=>{if(!files[path])throw new Error('Bagian EPUB tidak ditemukan: '+path);let text=strFromU8(files[path]);if(/<!ENTITY|<!DOCTYPE[^>]*\[/i.test(text))throw new Error('Format XML EPUB ini belum didukung.');text=text.replace(/<!DOCTYPE[^>]*>/ig,'');const d=parser.parseFromString(text,'application/xml');if(d.querySelector('parsererror'))throw new Error('Susunan EPUB tidak valid.');return d;};
 if(files['META-INF/encryption.xml'])throw new Error('EPUB memakai enkripsi yang belum didukung. Gunakan EPUB tanpa DRM atau enkripsi.');
 const container=xml('META-INF/container.xml'),opfPath=container.querySelector('rootfile')?.getAttribute('full-path');if(!opfPath)throw new Error('Paket EPUB tidak ditemukan.');const opf=xml(opfPath),items=new Map(Array.from(opf.querySelectorAll('manifest > item')).map(n=>[n.getAttribute('id'),n]));
 const meta=(name:string)=>Array.from(opf.querySelectorAll('*')).filter(n=>n.localName.split(':').at(-1)===name).map(n=>n.textContent?.trim()||'').filter(Boolean);
 const blocks:Block[]=[];let chapters=0,characters=0;
 for(const ref of Array.from(opf.querySelectorAll('spine > itemref'))){if(ref.getAttribute('linear')==='no')continue;const item=items.get(ref.getAttribute('idref'));if(!item)throw new Error('Daftar bab EPUB tidak lengkap.');const href=item.getAttribute('href')||'',url=new URL(href,'https://epub.invalid/'+opfPath);if(url.origin!=='https://epub.invalid')throw new Error('EPUB harus menyimpan teks bab di dalam berkas.');const path=decodeURIComponent(url.pathname.slice(1));const d=xml(path);d.querySelectorAll('script,style,nav,iframe,object,svg,form,button').forEach(n=>n.remove());const body=d.querySelector('body');if(!body)continue;let found=false;
 for(const n of Array.from(body.querySelectorAll('h1,h2,h3,h4,p,li,blockquote,figcaption,tr'))){if(n.parentElement?.closest('p,li,blockquote,tr'))continue;const text=(n.textContent||'').replace(/\s+/g,' ').trim();if(!text)continue;characters+=text.length;if(characters>5_000_000||blocks.length>=25000)throw new Error('Teks buku terlalu besar. Impor per bagian.');const heading=/^h[1-4]$/i.test(n.localName);blocks.push({id:'epub-'+chapters+'-'+blocks.length,kind:heading?'heading':n.localName==='figcaption'?'caption':'paragraph',text,section:'body'});found=true;}
 if(found)chapters++;
 }
 if(blocks.filter(b=>b.kind==='paragraph').length<2)throw new Error('EPUB tidak memiliki cukup teks yang dapat dibaca. Buku pindai atau komik belum didukung.');return{title:meta('title')[0]||'Buku pribadi',authors:meta('creator'),language:meta('language')[0]||'en',blocks,chapters};
}
