export function validatePasswords(password,confirmation,current=''){
 if(password.length<8)return 'Password baru minimal 8 karakter.';
 if(password!==confirmation)return 'Kedua password baru belum sama.';
 if(current&&password===current)return 'Pilih password baru yang berbeda dari password saat ini.';
 return '';
}
export function recoveryHash(link){
 const url=new URL(link);
 if(url.origin!=='https://icpirkkojrzoaoyibpiz.supabase.co'||url.pathname!=='/auth/v1/verify'||url.searchParams.get('type')!=='recovery')throw new Error('Gunakan tautan pemulihan dari email layanan akun website ini.');
 const token=url.searchParams.get('token_hash')||url.searchParams.get('token');
 if(!token||!/[a-zA-Z0-9]/.test(token)||token.length>1024)throw new Error('Tautan pemulihan belum lengkap.');
 return token;
}
