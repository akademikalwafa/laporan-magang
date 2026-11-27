// ==========================================================================
// INTI APLIKASI — state, kalender bulan, routing SPA (0ms), boot & sinkronisasi
// ==========================================================================
const S = {
  role: null, user: null, profile: null, settings: {}, off: 0, view: null, dirty: {}, ui: {},
  fotos: [], laporan: null, nilai: null, dokumen: [],
  mahasiswa: [], lap: [], nilaiAll: [], tokens: [], idx: { f: {}, l: {}, n: {} }, ver: 0, lastSync: 0, pending: 0
};
const VIEWS = { mhs: ['beranda', 'foto', 'laporan', 'dokumen'], admin: ['rekap', 'verifikasi', 'dokumen', 'pengaturan'], dosen: ['rekap'] };
const NAVL = { beranda: ['Beranda', 'home'], foto: ['Upload Foto', 'camera'], laporan: ['Laporan', 'file'], dokumen: ['Dokumen', 'book'],
               rekap: ['Rekap Mahasiswa', 'users'], verifikasi: ['Verifikasi', 'ok'], pengaturan: ['Pengaturan Sistem', 'sliders'] };
const navLabel = v => (S.role === 'admin' && v === 'dokumen') ? 'Kelola Dokumen' : (S.role === 'dosen' && v === 'rekap' ? 'Rekap Mahasiswa' : NAVL[v][0]);

// ---------- Kalender unggah bertahap (dihitung lokal → tanpa panggilan server) ----------
function nowDate() {
  const sim = S.settings.tanggal_simulasi;
  if (sim) { const [y, m, d] = sim.split('-').map(Number); return new Date(y, m - 1, d, 12); }
  return new Date(Date.now() + S.off);
}
function months() {
  const s = S.settings, n = +s.jumlah_bulan || 3, now = nowDate();
  return Array.from({ length: n }, (_, i) => {
    const st = new Date(+s.tahun_mulai, +s.bulan_mulai - 1 + i, 1);
    return { n: i + 1, name: BULAN[st.getMonth()], year: st.getFullYear(), start: st, open: now >= st };
  });
}
function laporanInfo() {
  const s = S.settings, n = +s.jumlah_bulan || 3, st = new Date(+s.tahun_mulai, +s.bulan_mulai - 1 + n, 1);
  return { start: st, name: BULAN[st.getMonth()], year: st.getFullYear(), open: nowDate() >= st };
}
const slotLabel = i => S.settings['label_' + i] || ('Foto ' + i);
const slotHint = i => S.settings['instruksi_' + i] || '';

// ---------- Data ----------
function reindex() {
  const f = {}, l = {}, n = {};
  S.fotos.forEach(x => (f[x.nim] = f[x.nim] || []).push(x));
  S.lap.forEach(x => { if (x) l[x.nim] = x; });
  S.nilaiAll.forEach(x => n[x.nim] = x);
  S.idx = { f, l, n };
}
function keepLocal(list) {
  const loc = (S.fotos || []).filter(f => f._state);
  return list.filter(f => !loc.some(l => l.bulan === f.bulan && l.slot === f.slot)).concat(loc);
}
function applyBoot(b) {
  S.user = b.user; S.role = b.user.role; S.settings = b.settings; S.off = b.serverNow - Date.now();
  S.periode = b.periode; S.arsip = !!b.arsip; S.periodes = b.periodes || []; S.periodeAktif = b.periodeAktif || b.periode;
  if (S.role === 'mhs') {
    S.profile = b.profile; S.fotos = keepLocal(b.fotos);
    S.laporan = (S.laporan && S.laporan._state) ? S.laporan : b.laporan;
    S.nilai = b.nilai; S.dokumen = b.dokumen;
  } else {
    S.mahasiswa = b.mahasiswa.map(r => ({ nim: r[0], nama: r[1], prodi: r[2], mitra: r[3], pemb: r[4] }));
    S.fotos = b.fotos.map(r => ({ id: r[0], nim: r[1], bulan: r[2], slot: r[3], fileId: r[4], tgl: r[5], status: r[6], alasan: r[7] }));
    S.lap = b.laporan.filter(Boolean); S.nilaiAll = b.nilaiAll;
    if (b.dokumen) S.dokumen = b.dokumen;
    if (b.tokens) S.tokens = b.tokens;
    reindex();
  }
  S.ver++; S._rk = null;
}
function saveBoot(b) { if (b.arsip) return; try { localStorage.setItem('pkl_boot', JSON.stringify(b)); } catch (e) { /* kuota penuh: abaikan */ } }

// ---------- Render terjadwal ----------
let rq = false;
function markDirty(...vs) {
  (vs.length ? vs : VIEWS[S.role]).forEach(v => S.dirty[v] = true);
  if (rq) return; rq = true;
  requestAnimationFrame(() => { rq = false; if (S.dirty[S.view]) renderView(S.view); updateBadges(); });
}
function renderView(v) {
  S.dirty[v] = false;
  const fn = { beranda: renderBeranda, foto: renderFoto, laporan: renderLaporan,
               dokumen: S.role === 'admin' ? renderDokAdmin : renderDokMhs, rekap: renderRekap, verifikasi: renderVerif, pengaturan: renderPengaturan }[v];
  if (fn) fn();
}
function updateBadges() {
  const c = $('#top-per'); if (c) { c.textContent = (S.arsip ? 'ARSIP · ' : 'T.A. ') + (S.periode || ''); c.classList.toggle('arch', !!S.arsip); }
  if (S.role !== 'admin') return;
  const n = queueItems().length;
  $$('[data-badge="verifikasi"]').forEach(e => { e.textContent = n; e.style.display = n ? '' : 'none'; });
}

// ---------- Routing SPA: tampil/sembunyi section (tanpa jaringan) ----------
function go(v) {
  const list = VIEWS[S.role]; if (!list) return;
  if (!list.includes(v)) v = list[0];
  S.view = v;
  $$('.view').forEach(e => e.classList.toggle('active', e.id === 'v-' + v));
  $$('[data-v]').forEach(e => e.classList.toggle('active', e.dataset.v === v));
  const t = $('#top-title'); if (t) t.textContent = navLabel(v);
  if (location.hash !== '#' + v) history.replaceState(null, '', '#' + v);
  if (S.dirty[v] !== false) renderView(v);
  window.scrollTo(0, 0);
}
ACT.nav = el => go(el.dataset.v);
window.addEventListener('hashchange', () => { if (S.role) go(location.hash.slice(1)); });

// ---------- Status sinkronisasi latar belakang ----------
function setSync(state) {
  const p = $('#syncpill'); if (!p) return;
  const m = { ok: ['ok', 'Tersinkron'], busy: ['busy', 'Menyinkronkan…'], err: ['err', 'Offline · data lokal'] }[state];
  p.className = 'sync ' + m[0]; p.innerHTML = `<i></i><span>${m[1]}</span>`;
}
// jalankan penulisan di latar belakang (UI sudah diperbarui secara optimistis)
async function bg(fn, onFail) {
  S.pending++; setSync('busy');
  try { return await fn(); }
  catch (e) { (onFail || (x => toast(esc(x.message), 'bad')))(e); return undefined; }
  finally { S.pending--; if (!S.pending) setSync(navigator.onLine ? 'ok' : 'err'); }
}
const busy = () => S.pending > 0 || (typeof UQ !== 'undefined' && UQ.running) || (typeof vbuf !== 'undefined' && vbuf.length > 0);

async function refresh(force) {
  if (!API.token || (!force && busy())) return;
  try {
    const b = await API.call('bootstrap', S.arsip ? { periode: S.periode } : {});
    if (!force && busy()) return;
    applyBoot(b); saveBoot(b); S.lastSync = Date.now(); setSync('ok'); markDirty();
  } catch (e) { if (e.code !== 'AUTH') setSync('err'); }
}
setInterval(() => { if (document.visibilityState === 'visible' && S.role && Date.now() - S.lastSync > 60000) refresh(); }, 20000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.role && Date.now() - S.lastSync > 30000) refresh(); });
window.addEventListener('online', () => { setSync('ok'); refresh(); });
window.addEventListener('offline', () => setSync('err'));

// ---------- Shell ----------
function buildShell() {
  $('#login').classList.add('hidden'); $('#shell').classList.remove('hidden');
  document.body.dataset.role = S.role;
  const vs = VIEWS[S.role];
  const roleName = { mhs: 'Mahasiswa', admin: 'Koordinator', dosen: 'Dosen' }[S.role];
  $('#side').innerHTML = `
    <div class="brand"><span class="logo">${ic('cap')}</span><div><b>PORTAL PKL</b><small>Biro Akademik</small></div></div>
    <nav>${vs.map(v => `<button class="nv" data-act="nav" data-v="${v}">${ic(NAVL[v][1])}<span>${esc(navLabel(v))}</span>${v === 'verifikasi' ? '<em class="cnt" data-badge="verifikasi" style="display:none">0</em>' : ''}</button>`).join('')}</nav>
    <button class="nv out" data-act="logout">${ic('logout')}<span>Keluar Sistem</span></button>`;
  $('#top').innerHTML = `
    <span class="logo sm">${ic('cap')}</span><h1 id="top-title"></h1><span class="chip hm" id="top-per"></span><span class="grow"></span>
    <span id="syncpill" class="sync ok"><i></i><span>Tersinkron</span></span>
    <div class="who"><span class="av">${esc(initials(S.user.name))}</span><div><b>${esc(S.user.name)}</b><small>${roleName}${S.role === 'mhs' && S.profile ? ' · ' + esc(S.profile.nim) : ''}</small></div></div>
    <button class="icb" data-act="logout" title="Keluar" aria-label="Keluar">${ic('logout')}</button>`;
  $('#views').innerHTML = vs.map(v => `<section class="view" id="v-${v}"></section>`).join('');
  S.dirty = {}; S.ui = {};
  window.scrollTo(0, 0);
}
function startApp() {
  buildShell();
  go(location.hash.slice(1) || VIEWS[S.role][0]);
  // render menu lain di waktu senggang supaya perpindahan berikutnya terasa instan
  const idle = window.requestIdleCallback || (f => setTimeout(f, 250));
  idle(() => VIEWS[S.role].forEach(v => { if (S.dirty[v] !== false && v !== S.view) renderView(v); }));
  updateBadges();
  if (S.role === 'admin') idle(() => queueItems().slice(0, 3).forEach(i => Files.prefetch(i.fileId)));
}

// ---------- Login ----------
const LG = { mode: 'mhs', ta: '' };
function renderLogin(err = '') {
  const m = LG.mode, ta = LG.ta ? `T.A. ${esc(LG.ta)}` : 'T.A.';
  let form = '';
  if (m === 'mhs') form = `
    <label for="f-nim">Nomor Induk Mahasiswa (NIM)</label>
    <div class="inp">${ic('shield')}<input id="f-nim" inputmode="numeric" autocomplete="username" placeholder="Contoh: 21010119120045" value="${esc(LG.nim || '')}"></div>
    <button class="btn pri lg" data-act="doLogin">Masuk ke Portal Mahasiswa ${ic('right')}</button>`;
  if (m === 'admin') form = `
    <label for="f-user">Username</label><div class="inp">${ic('shield')}<input id="f-user" autocomplete="username" placeholder="admin"></div>
    <label for="f-pass">Password</label><div class="inp">${ic('lock')}<input id="f-pass" type="password" autocomplete="current-password" placeholder="••••••••"></div>
    <button class="btn pri lg" data-act="doLogin">Masuk sebagai Koordinator ${ic('right')}</button>`;
  if (m === 'dosen') form = `
    <label for="f-tok">Token Akses Dosen</label><div class="inp">${ic('key')}<input id="f-tok" autocomplete="off" autocapitalize="characters" placeholder="DSN-2026-XXXXXX"></div>
    <button class="btn pri lg" data-act="doLogin">Masuk sebagai Dosen ${ic('right')}</button>`;
  const title = { mhs: 'Portal Mahasiswa', admin: 'Masuk Koordinator', dosen: 'Masuk Dosen Pembimbing' }[m];
  $('#login').innerHTML = `
    <div class="lg-card">
      <div class="lg-logo">${ic('cap')}</div>
      <h2>PORTAL MAGANG /<br>PKL</h2>
      <div class="card">
        <span class="chip"><i></i>${ta}</span>
        <p class="sub">${m === 'mhs' ? 'Khusus mahasiswa aktif Semester 7 yang terdaftar program Praktik Kerja Lapangan.' : title}</p>
        ${err ? `<div class="alert bad">${ic('alert')}<div><b>Verifikasi Diperlukan</b><p>${esc(err)}</p></div></div>` : ''}
        <form id="lgform" autocomplete="on">${form}</form>
        <div class="sep"><span>atau opsi masuk lainnya</span></div>
        ${m !== 'admin' ? `<button class="alt" data-act="lgmode" data-m="admin"><span class="ai">${ic('shield')}</span><b>Masuk sebagai Koordinator / Admin</b>${ic('chr')}</button>` : ''}
        ${m !== 'dosen' ? `<button class="alt" data-act="lgmode" data-m="dosen"><span class="ai amber">${ic('key')}</span><b>Masuk sebagai Dosen Pembimbing</b>${ic('chr')}</button>` : ''}
        ${m !== 'mhs' ? `<button class="alt" data-act="lgmode" data-m="mhs"><span class="ai">${ic('cap')}</span><b>Masuk sebagai Mahasiswa</b>${ic('chr')}</button>` : ''}
      </div>
    </div>`;
  $('#lgform').addEventListener('submit', e => { e.preventDefault(); ACT.doLogin($('#lgform .btn')); });
  const f = $('#login input'); if (f && !('ontouchstart' in window)) f.focus();
}
ACT.lgmode = el => { LG.mode = el.dataset.m; renderLogin(); };
ACT.doLogin = async btn => {
  const m = LG.mode; let action, data;
  if (m === 'mhs') { LG.nim = $('#f-nim').value.trim(); action = 'loginMhs'; data = { nim: LG.nim }; }
  if (m === 'admin') { action = 'loginAdmin'; data = { username: $('#f-user').value, password: $('#f-pass').value }; }
  if (m === 'dosen') { action = 'loginDosen'; data = { token: $('#f-tok').value }; }
  btn.disabled = true; const old = btn.innerHTML; btn.innerHTML = '<span class="spin"></span> Memeriksa…';
  try {
    const r = await API.call(action, data);
    API.setToken(r.token); applyBoot(r.boot); saveBoot(r.boot); S.lastSync = Date.now();
    startApp();
  } catch (e) { renderLogin(e.message); }
};
function logout(msg) {
  if (API.token) API.call('logout').catch(() => {});
  API.setToken(''); localStorage.removeItem('pkl_boot');
  Files.cache.forEach(o => { try { URL.revokeObjectURL(o.url); } catch (e) {} }); Files.cache.clear();
  Object.assign(S, { role: null, user: null, profile: null, fotos: [], laporan: null, nilai: null, dokumen: [], mahasiswa: [], lap: [], nilaiAll: [], tokens: [], idx: { f: {}, l: {}, n: {} }, ui: {}, dirty: {}, view: null, _rk: null });
  history.replaceState(null, '', location.pathname);
  $('#shell').classList.add('hidden'); $('#login').classList.remove('hidden');
  LG.mode = 'mhs'; renderLogin(); if (msg) toast(msg, 'info');
}
ACT.logout = () => { if (busy() && !confirm('Masih ada data yang sedang dikirim. Keluar sekarang?')) return; logout(); };
window.addEventListener('pkl-auth-expired', () => { if (S.role) logout('Sesi berakhir. Silakan masuk kembali.'); });

// ---------- Delegasi event ----------
document.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (el && !el.disabled && ACT[el.dataset.act]) ACT[el.dataset.act](el, e); });
document.addEventListener('input', e => { const el = e.target.closest('[data-inp]'); if (el && INP[el.dataset.inp]) INP[el.dataset.inp](el, e); });
document.addEventListener('change', e => { const el = e.target.closest('[data-chg]'); if (el && CHG[el.dataset.chg]) CHG[el.dataset.chg](el, e); });
document.addEventListener('keydown', e => {
  if (S.role === 'admin' && S.view === 'verifikasi' && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) && !$('.modal-bg')) {
    if (e.key === 'j' || e.key === 'J') ACT.vprev(); if (e.key === 'k' || e.key === 'K') ACT.vnext();
  }
});

// ---------- INIT ----------
(function init() {
  API.ping().then(d => { if (d && d.tahun_akademik) { LG.ta = d.tahun_akademik; if (!S.role) { const c = $('#login .chip'); if (c) c.innerHTML = `<i></i>T.A. ${esc(LG.ta)}`; } } });
  if (API.token) {
    try {
      const cached = JSON.parse(localStorage.getItem('pkl_boot') || 'null');
      if (cached) { applyBoot(cached); startApp(); refresh(true); return; }
    } catch (e) { /* cache rusak → login ulang */ }
    API.call('bootstrap').then(b => { applyBoot(b); saveBoot(b); S.lastSync = Date.now(); startApp(); }).catch(() => { API.setToken(''); renderLogin(); });
    return;
  }
  renderLogin();
})();
