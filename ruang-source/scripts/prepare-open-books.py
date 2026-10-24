"""Fetch pinned, licensed OpenStax sources and preserve collection reading order.
Run manually when updating editions; never treats repository modification dates as publication dates.
"""
import urllib.request,json,xml.etree.ElementTree as ET,re,hashlib,concurrent.futures,time
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'public/books';OUT.mkdir(exist_ok=True)
SPECS=[('osbooks-principles-marketing','principles-marketing','Marketing',2023,['Maria Gomez Albrecht','Mark Green','Linda Hoffman'],'Pemasaran, perilaku konsumen, segmentasi, merek, dan strategi digital.'),('osbooks-introduction-business','introduction-business-2e','Bisnis',None,['OpenStax'],'Sistem ekonomi, etika, kewirausahaan, manajemen, dan keuangan.'),('osbooks-psychology','psychology-2e','Psikologi',2020,['Rose M. Spielman','William J. Jenkins','Marilyn D. Lovett'],'Metode penelitian, otak, pembelajaran, ingatan, dan perilaku.')]
def get(url):
 for attempt in range(3):
  try:return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'RuangTumbuh-book-preparation'}),timeout=30).read()
  except Exception:
   if attempt==2:raise
   time.sleep(attempt+1)
def local(n):return n.tag.split('}')[-1]
def text(n):
 def walk(e):
  result=e.text or ''
  for c in e:
   if local(c) not in ['image','media','audio','video']:result+=walk(c)
   result+=c.tail or ''
  return result
 return re.sub(r'\s+',' ',walk(n)).strip()
manifest=[]
for repo,slug,topic,year,authors,description in SPECS:
 commit=json.loads(get(f'https://api.github.com/repos/openstax/{repo}/commits/main'))['sha'];base=f'https://raw.githubusercontent.com/openstax/{repo}/{commit}/';collection=ET.fromstring(get(base+'collections/'+slug+'.collection.xml'));license=next(n for n in collection.iter() if local(n)=='license').attrib['url'].replace('http:','https:');title=next(n for n in collection.iter() if local(n)=='title').text
 modules=[n.attrib['document'] for n in collection.iter() if local(n)=='module'];cache=ROOT/'.cache/open-books'/repo;cache.mkdir(exist_ok=True,parents=True)
 def load(mid):
  p=cache/(commit+'-'+mid+'.xml')
  if not p.exists():p.write_bytes(get(base+'modules/'+mid+'/index.cnxml'))
  return mid,ET.fromstring(p.read_bytes())
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:docs=dict(pool.map(load,dict.fromkeys(modules)))
 blocks=[];parts=[];figures=0;chapter_count=0
 def append(kind,t,identity,**kw):
  if t:blocks.append({'id':identity,'kind':kind,'text':t,'section':'body',**kw})
 def emit(n,mid):
  global figures
  tag=local(n);ident='book-'+mid+'-'+n.attrib.get('id',str(len(blocks)))
  if tag in ['title','para','item','caption','entry','note','definition','example','problem','solution']:
   # Containers with block children recurse so no text is duplicated.
   children=[c for c in n if local(c) in ['para','title','list','item','section','figure','table','problem','solution','example','note']]
   if not children:
    t=text(n)
    if tag=='item':t='• '+t
    append('heading' if tag=='title' else 'caption' if tag=='caption' else 'paragraph',t,ident);return
  if tag=='figure':
   caption=next((text(c) for c in n if local(c)=='caption'),'')
   for img in [c for c in n.iter() if local(c)=='image']:
    src=img.attrib.get('src','');image=urllib.parse.urljoin(base+'modules/'+mid+'/index.cnxml',src);alt=next((c.attrib.get('alt','') for c in n.iter() if local(c)=='media'),'')
    if image.startswith(base):append('caption',caption or alt or 'Gambar buku',ident+'-image-'+str(figures),image=image,imageAlt=alt);figures+=1
   # Caption already included with image; nested figure is uncommon but retain it.
   for child in n:
    if local(child) not in ['caption','media']:emit(child,mid)
   return
  if tag in ['media','image','audio','video','metadata']:return
  if tag=='table':
   # Preserve row boundaries for accessible textual tables.
   for row in [c for c in n.iter() if local(c)=='row']:
    append('paragraph',' | '.join(text(c) for c in row if local(c)=='entry'),ident+'-row-'+str(len(blocks)))
   return
  if n.text and n.text.strip() and not list(n):append('paragraph',text(n),ident);return
  for child in n:emit(child,mid)
 content=next(n for n in collection if local(n)=='content')
 def traverse(n):
  global chapter_count
  if local(n)=='subcollection':
   t=next((c.text for c in n if local(c)=='title'),'')
   if t:append('heading',t,'chapter-'+str(chapter_count));chapter_count+=1
  if local(n)=='module':
   mid=n.attrib['document'];doc=docs[mid];t=next((text(c) for c in doc if local(c)=='title'),'')
   append('heading',t,'module-'+mid)
   for c in doc:
    if local(c)=='content':emit(c,mid)
  else:
   for c in n:
    if local(c) not in ['title','metadata']:traverse(c)
 traverse(content)
 # Keep each part comfortably below connector and GitHub blob limits.
 for start in range(0,len(blocks),500):
  filename=f'{slug}-{len(parts)+1}.json';(OUT/filename).write_text(json.dumps(blocks[start:start+500],ensure_ascii=False,separators=(',',':')));parts.append('/ruang-tumbuh/books/'+filename)
 words=sum(len(b['text'].split()) for b in blocks);assert len(modules)==len(docs) and words>30000
 record={'id':'book-'+slug,'title':title,'topic':topic,'categories':[topic]+(['Pendidikan','Neuroscience'] if topic=='Psikologi' else []),'source':'OpenStax · Rice University','type':'book','format':'book','url':'https://openstax.org/details/books/'+slug,'description':description,'guide':'Pilih satu bab, jelaskan ide utamanya, lalu hubungkan dengan pengalamanmu.','textKind':'full','authors':authors,'license':'CC BY-NC-SA 4.0','licenseUrl':license,'attribution':f'{title}, OpenStax, Rice University. Diadaptasi dari sumber {commit}: judul, paragraf, tabel, dan keterangan gambar ditata ulang. Lisensi asli dan kredit gambar dipertahankan; video dan materi pengajar tidak disertakan. Tidak berafiliasi atau didukung OpenStax.','bookFile':'/ruang-tumbuh/books/'+slug+'.json','wordCount':words,'language':'en'}
 if year:record['year']=year
 (OUT/(slug+'.json')).write_text(json.dumps({'parts':parts,'metadata':record['attribution'],'sourceCommit':commit,'licenseUrl':license,'modules':len(modules),'figures':figures},ensure_ascii=False,separators=(',',':')))
 manifest.append(record);print(title, 'modules',len(modules),'blocks',len(blocks),'words',words,'figures',figures,flush=True)
(OUT/'catalog.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
