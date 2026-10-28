export async function saveWritingPost(client, { id, payload, password, existing }) {
  const needsPassword = payload.access_level === 'password' && !existing?.password_hash;
  const desiredStatus = payload.status;
  // A password is set by a separate RPC. Keep new locked content in draft until it succeeds.
  const staged = needsPassword ? { ...payload, status: 'draft', access_level: 'public' } : payload;
  const query = id ? client.from('blog_posts').update(staged).eq('id', id) : client.from('blog_posts').insert(staged);
  const result = await query.select().single();
  if (result.error) throw Error(result.error.message);
  const postId = result.data.id;
  if (payload.access_level === 'password' && password) {
    const locked = await client.rpc('blog_set_post_password', { requested_post_id: postId, new_password: password });
    if (locked.error) {
      const error = Error('Draf tersimpan, tetapi password belum terpasang. Coba simpan kembali.');
      error.postId = postId; throw error;
    }
  }
  if (needsPassword) {
    const published = await client.from('blog_posts').update({ status: desiredStatus, access_level: 'password' }).eq('id', postId).select().single();
    if (published.error) { const error = Error('Tulisan terkunci tersimpan sebagai draf. Coba simpan kembali untuk menerbitkannya.'); error.postId = postId; throw error; }
    return published.data;
  }
  return result.data;
}
