// Keep each successful upload when another file fails, so retry never duplicates it.
export async function uploadPhotoBatch(entries, { upload, persist, onProgress = () => {} }) {
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];
    if (entry.saved) continue;
    entry.error = ''; onProgress(entry, index, entries.length, 'uploading');
    try {
      if (!entry.src) entry.src = await upload(entry.file);
      await persist(entry);
      entry.saved = true;
      onProgress(entry, index, entries.length, 'saved');
    } catch (error) {
      entry.error = error.message || 'Unggah belum berhasil.';
      onProgress(entry, index, entries.length, 'failed');
    }
  }
  return { saved: entries.filter(entry => entry.saved).length, failed: entries.filter(entry => !entry.saved).length };
}
