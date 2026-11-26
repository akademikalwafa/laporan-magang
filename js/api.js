// Lapisan komunikasi ke GAS (fetch). POST WAJIB text/plain agar tidak memicu CORS preflight.
const API = (() => {
  const cfg = window.APP_CONFIG;
  let token = localStorage.getItem('pkl_token') || '';
  const setToken = t => { token = t || ''; t ? localStorage.setItem('pkl_token', t) : localStorage.removeItem('pkl_token'); };

  async function call(action, data = {}) {
    if (!cfg.GAS_URL || cfg.GAS_URL.indexOf('GANTI') === 0) throw new Error('GAS_URL belum diisi di js/config.js');
    let res;
    try {
      res = await fetch(cfg.GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, token, data }) });
    } catch (e) { const er = new Error('Tidak ada koneksi. Periksa jaringan Anda.'); er.net = true; throw er; }
    let j;
    try { j = await res.json(); } catch (e) { const er = new Error('Respons server tidak valid.'); er.net = true; throw er; }
    if (!j.success) {
      const er = new Error(j.message || 'Terjadi kesalahan.'); er.code = j.code || 'ERR';
      if (er.code === 'AUTH') window.dispatchEvent(new Event('pkl-auth-expired'));
      throw er;
    }
    return j.data;
  }
  // coba ulang otomatis untuk gangguan jaringan sesaat (bukan untuk error dari server)
  async function callRetry(action, data, n = 2) {
    for (let i = 0; ; i++) {
      try { return await call(action, data); }
      catch (e) { if (!e.net || i >= n) throw e; await new Promise(r => setTimeout(r, 900 * (i + 1))); }
    }
  }
  const ping = () => fetch(cfg.GAS_URL).then(r => r.json()).then(j => j.data).catch(() => null);
  return { call, callRetry, ping, setToken, get token() { return token; } };
})();

// Cache berkas (foto/PDF) di memori: dipakai ulang, di-prefetch, tanpa unduh dua kali.
const Files = {
  cache: new Map(), pending: new Map(),
  get(id) {
    if (!id) return Promise.resolve(null);
    if (this.cache.has(id)) return Promise.resolve(this.cache.get(id));
    if (this.pending.has(id)) return this.pending.get(id);
    const p = API.callRetry('getFile', { fileId: id }).then(r => {
      const bin = atob(r.data), u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const blob = new Blob([u8], { type: r.mime });
      const o = { url: URL.createObjectURL(blob), blob, mime: r.mime, name: r.name };
      this.cache.set(id, o); this.pending.delete(id); return o;
    }).catch(e => { this.pending.delete(id); throw e; });
    this.pending.set(id, p); return p;
  },
  prefetch(id) { if (id && !this.cache.has(id)) this.get(id).catch(() => {}); }
};
