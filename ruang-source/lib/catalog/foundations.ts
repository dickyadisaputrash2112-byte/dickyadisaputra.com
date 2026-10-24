import{readings}from'../readings';
import type{Reading}from'../model.ts';
const notes:Record<string,{method:string;limitations:string}>={
 'active-learning':{method:'Meta-analisis · 225 studi pendidikan STEM',limitations:'Temuan berasal dari pendidikan tinggi STEM dan studi hingga periode sebelum 2014. Bentuk pembelajaran aktif bervariasi; bukan bukti satu teknik berlaku di semua kelas.'},
 'business-models':{method:'Kerangka konseptual',limitations:'Kerangka ini menjelaskan hubungan konsep. Bukan uji kausal atau estimasi dampak bisnis; perlu diuji dengan bukti empiris pada konteksmu.'},
 'digital-marketing':{method:'Sintesis perspektif dan agenda penelitian',limitations:'Memadukan literatur dan pandangan ahli; tidak semua usulan merupakan temuan empiris. Platform dan perilaku digital dapat berubah sejak publikasi.'},
 'ai-marketing':{method:'Kerangka strategis konseptual',limitations:'Klasifikasi membantu menyusun strategi, tetapi tidak mengestimasi hasil finansial penerapan AI. Evaluasi data, risiko, dan konteks organisasi tetap diperlukan.'},
 'chatgpt-education':{method:'Tinjauan sistematis · 14 studi awal',limitations:'Cakupan studi awal 2022–2023 tidak mewakili seluruh perkembangan AI hingga 2026. Periksa desain dan kualitas tiap studi sebelum menerapkan kesimpulan.'},
 'ai-at-work':{method:'Studi lapangan penerapan AI pada layanan pelanggan',limitations:'Hasil pada satu lingkungan layanan pelanggan tidak otomatis berlaku untuk pekerjaan lain. Perhatikan definisi produktivitas dan perbedaan pengalaman pekerja.'},
 'human-ai':{method:'Tinjauan sistematis dan meta-analisis',limitations:'Kinerja bergantung pada jenis tugas dan pembanding manusia/AI. Manfaat rata-rata tidak berarti kolaborasi selalu lebih baik daripada pihak terbaik.'}
};
export const foundations:Reading[]=readings.map(r=>({...r,local:true,textKind:'full',curation:{version:7,status:'ready',review:'editorial',reason:r.description,method:notes[r.id].method,limitations:notes[r.id].limitations,criteria:['Artikel jurnal pilihan, bukan skripsi','Teks lengkap sudah tersedia di Ruang','Bacaan fondasi diberi label tahun asli'],checkedAt:'2026-10-24T00:00:00.000Z',sourceUrl:r.url,authorCredentials:'not-inferred'}}));
