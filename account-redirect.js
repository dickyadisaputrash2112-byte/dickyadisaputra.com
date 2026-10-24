// Keep recovery tokens in the URL fragment and never send them to an application page.
(()=>{const p=new URLSearchParams(location.hash.slice(1));if(p.get('type')==='recovery'&&p.get('access_token')&&p.get('refresh_token'))location.replace('/akun/index.html'+location.hash);})();
