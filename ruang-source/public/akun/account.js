import{createClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm';
import{validatePasswords,recoveryHash}from'./password-helpers.js';
const initialHash=new URLSearchParams(location.hash.slice(1));
const client=createClient('https://icpirkkojrzoaoyibpiz.supabase.co','sb_publishable_sLuzWthdq8Xpz7TAvQdLzg_nhTF_dwn',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:true}});
const $=id=>document.getElementById(id),form=$('password-form');
let mode='change',recoveryVerified=false,working=false;
function status(message,kind='info'){$('status').textContent=message;$('status').dataset.kind=kind;}
function render(){const reset=mode==='recover'&&!recoveryVerified;$('current-field').hidden=mode==='recover';$('current-password').required=mode==='change';$('new-fields').hidden=reset;for(const id of ['new-password','confirm-password'])$(id).required=!reset;$('email').readOnly=recoveryVerified;$('email').required=!recoveryVerified;$('submit').textContent=reset?'Kirim tautan pemulihan':'Simpan password baru';$('recovery-help').hidden=mode!=='recover';$('recovery-notice').hidden=!recoveryVerified;for(const name of ['change','recover'])$('mode-'+name).classList.toggle('active',mode===name);}
function busy(value){working=value;for(const el of document.querySelectorAll('button'))el.disabled=value;}
for(const name of ['change','recover'])$('mode-'+name).onclick=()=>{if(working)return;mode=name;$('current-password').value='';$('new-password').value='';$('confirm-password').value='';status('');render();};
client.auth.onAuthStateChange((event,session)=>{if(event==='PASSWORD_RECOVERY'&&session){recoveryVerified=true;mode='recover';$('email').value=session.user.email||'';render();}});
async function initialize(){const{data:{session}}=await client.auth.getSession();if(session&&initialHash.get('type')==='recovery'){recoveryVerified=true;mode='recover';$('email').value=session.user.email||'';render();}const params=new URLSearchParams(location.hash.slice(1));if(params.get('error_description')){mode='recover';status('Tautan pemulihan sudah kedaluwarsa atau tidak valid. Minta tautan baru.','error');history.replaceState(null,'',location.pathname);render();}}
form.addEventListener('submit',async event=>{event.preventDefault();if(working)return;const email=$('email').value.trim(),current=$('current-password').value,password=$('new-password').value;
 if(mode==='recover'&&!recoveryVerified){busy(true);status('Mengirim permintaan pemulihan…');try{const{error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)throw error;status('Jika email terdaftar, tautan pemulihan akan dikirim. Buka email tersebut untuk membuat password baru.','success');}catch(e){status(e.status===429?'Terlalu banyak permintaan. Tunggu sebentar sebelum mencoba lagi.':'Permintaan belum berhasil. Coba kembali saat tersambung internet.','error');}finally{busy(false);}return;}
 const invalid=validatePasswords(password,$('confirm-password').value,mode==='change'?current:'');if(invalid){status(invalid,'error');return;}
 busy(true);status('Memeriksa akun dan menyimpan password baru…');let passwordSaved=false;
 try{
  if(mode==='change'){const{error}=await client.auth.signInWithPassword({email,password:current});if(error)throw new Error('Email atau password saat ini belum cocok. Periksa kembali atau pilih Lupa password.');}
  const{error}=await client.auth.updateUser({password,...(mode==='change'?{current_password:current}:{})});if(error)throw error;passwordSaved=true;
  $('current-password').value='';$('new-password').value='';$('confirm-password').value='';
  const{error:logoutError}=await client.auth.signOut({scope:'global'});
  status('Password berhasil diganti. Gunakan password baru untuk masuk kembali ke akunmu.'+(logoutError?' Keluar dari aplikasi lain secara manual bila masih terbuka.':''),'success');recoveryVerified=false;mode='change';render();
 }catch(e){status(passwordSaved?'Password sudah diganti. Masuk kembali menggunakan password baru.':e.status===429?'Terlalu banyak percobaan. Tunggu sebentar lalu coba kembali.':e.message||'Password belum dapat diganti. Coba kembali.','error');}finally{busy(false);}
});
$('verify-form').addEventListener('submit',async event=>{event.preventDefault();if(working)return;let token;try{token=recoveryHash($('recovery-link').value.trim());}catch(e){status(e.message,'error');return;}busy(true);status('Memeriksa tautan pemulihan…');try{const{data,error}=await client.auth.verifyOtp({type:'recovery',token_hash:token});if(error||!data.session)throw new Error('Tautan sudah dipakai atau kedaluwarsa. Minta tautan pemulihan baru.');$('recovery-link').value='';recoveryVerified=true;mode='recover';$('email').value=data.user.email||'';render();status('Tautan terverifikasi. Isi password barumu.','success');}catch(e){status(e.message,'error');}finally{busy(false);}});
render();initialize().catch(()=>status('Layanan akun belum tersambung. Muat ulang saat koneksi tersedia.','error'));
