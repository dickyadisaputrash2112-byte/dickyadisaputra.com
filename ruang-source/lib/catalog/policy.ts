import type{Candidate}from'./contracts';
// Explicit journal selection, not a ranking of authors by academic degree.
export const journals=[
 {name:'PLOS One',issns:['1932-6203']},{name:'PLOS Digital Health',issns:['2767-3170']},
 {name:'PLOS Biology',issns:['1545-7885','1544-9173']},{name:'PLOS Computational Biology',issns:['1553-7358','1553-734X']},
 {name:'Nature Communications',issns:['2041-1723']},{name:'Nature Human Behaviour',issns:['2397-3374']},
 {name:'npj Science of Learning',issns:['2056-7936']},{name:'Scientific Reports',issns:['2045-2322']},
 {name:'BMC Medical Education',issns:['1472-6920']},{name:'Science Advances',issns:['2375-2548']},
 {name:'Humanities and Social Sciences Communications',issns:['2662-9992']}
];
export function checkCandidate(c:Candidate){
 const reasons:string[]=[];if(!/^PMC\d+$/.test(c.pmcid))reasons.push('Tidak ada teks lengkap arsip');if(!/^10\.\d{4,9}\//i.test(c.doi))reasons.push('DOI belum terverifikasi');
 if(!journals.some(j=>j.issns.some(i=>c.issns.includes(i))))reasons.push('Jurnal belum masuk daftar kurasi');
 if(c.retracted||c.types.some(t=>/retract|withdraw|preprint|editorial|comment|correction|errat|letter|protocol|conference|dissertation|thesis/i.test(t)))reasons.push('Jenis atau status publikasi tidak memenuhi syarat');
 if(!c.types.some(t=>/research-article|journal article|review-article|systematic review|meta-analysis/i.test(t)))reasons.push('Bukan artikel penelitian atau tinjauan');
 if(/undergraduate thesis|bachelor.?s thesis|skripsi|student journal|undergraduate research journal/i.test(c.title+' '+c.journal+' '+c.authorAffiliations))reasons.push('Skripsi atau publikasi mahasiswa');
 if(/undergraduate (?:student|researcher)|bachelor.?s? (?:degree )?student|mahasiswa[ \-]*(?:s1|sarjana)/i.test(c.authorAffiliations))reasons.push('Status penulis S1 tercantum dalam metadata');
 if(!c.year||c.published>new Date().toISOString().slice(0,10))reasons.push('Tanggal publikasi belum valid');
 if(!/^cc[ -]?by(?:[ -]?nc)?$/i.test(c.license.trim()))reasons.push('Lisensi penayangan ulang belum cocok');
 return{allowed:reasons.length===0,reasons};
}
export function guessMethod(text:string){if(/meta.analysis/i.test(text))return'Meta-analisis';if(/systematic (?:literature |narrative )?review/i.test(text))return'Tinjauan sistematis';if(/randomi[sz]ed.{0,30}(trial|experiment)|random.{0,20}assign/i.test(text))return'Eksperimen acak';if(/cross.sectional|survey|questionnaire/i.test(text))return'Survei / observasional';if(/case stud/i.test(text))return'Studi kasus';if(/benchmark|dataset|fine.tun|model performance/i.test(text))return'Evaluasi metode / model';return'Artikel penelitian; periksa bagian metode';}
export function topicQuery(topic:string){const t=topic.toLowerCase().trim();const aliases:Record<string,string>={pendidikan:'education OR teaching OR "student learning"',education:'education OR teaching OR "student learning"',marketing:'marketing OR "consumer behavior" OR "consumer behaviour"',pemasaran:'marketing OR "consumer behavior"',bisnis:'business OR entrepreneurship OR workplace OR "business model"',business:'business OR entrepreneurship OR workplace OR "business model"',ai:'"artificial intelligence" OR "generative AI"', 'artificial intelligence':'"artificial intelligence" OR "generative AI"'};return aliases[t]||topic.replace(/["():\[\]{}\\]/g,' ').trim().slice(0,100);}

export function journalsForTopic(topic:string){return /^(marketing|pemasaran|business|bisnis)$/i.test(topic.trim())?journals.filter(j=>!['BMC Medical Education','PLOS Digital Health','PLOS Biology','PLOS Computational Biology','npj Science of Learning'].includes(j.name)):journals;}
