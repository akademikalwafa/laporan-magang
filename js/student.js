// ==========================================================================
// MAHASISWA — Beranda, Upload Foto, Laporan & Nilai, Dokumen
// Semua aksi: UI diperbarui seketika (optimistis), kirim ke server di latar belakang.
// ==========================================================================
const UQ = { items: [], running: false };
const slotOf = (b, s) => S.fotos.find(f => f.bulan === b && f.slot === s);
const cachedUrl = id => (Files.cache.get(id) || {}).url || '';
const imgTag = (fid, local, cls = '') => {
  const u = local || cachedUrl(fid);
  return `<img class="${cls}" ${u ? `src="${u}"` : `data-fid="${esc(fid)}"`} alt="" decoding="async">`;
};
function hydrate(root) {
  $$('img[data-fid]:not([data-ok])', root).forEach(img => {
    img.dataset.ok = '1';
    Files.get(img.dataset.fid).then(o => { img.src = o.url; img.closest('.ph')?.classList.add('ld'); })
      .catch(() => img.closest('.ph')?.classList.add('err'));
  });
}
function fotoStats() {
  const total = months().length * 3, c = { acc: 0, wait: 0, rej: 0, total };
  S.fotos.forEach(f => { if (f.status === 'diterima') c.acc++; else if (f.status === 'ditolak') c.rej++; else c.wait++; });
  return c;
}
const curMonth = () => { const o = months().filter(m => m.open); return o.length ? o[o.length - 1] : null; };
function monthSummary(b) {
  const a = [1, 2, 3].map(s => slotOf(b, s)), n = k => a.filter(f => f && f.status === k).length, miss = a.filter(f => !f).length;
  if (n('diterima') === 3) return { cls: 'ok', t: '3/3 Diterima ✔' };
  const p = []; if (n('diterima')) p.push(n('diterima') + ' Diterima'); if (n('ditolak')) p.push(n('ditolak') + ' Ditolak');
  if (n('menunggu')) p.push(n('menunggu') + ' Menunggu'); if (miss) p.push(miss + ' Belum');
  return { cls: n('ditolak') ? 'bad' : 'wait', t: p.join(', ') };
}
const segs = b => [1, 2, 3].map(s => { const f = slotOf(b, s); return `<i class="sg ${f ? f.status : ''}"></i>`; }).join('');

// ------------------------------- BERANDA -------------------------------
function renderBeranda() {
  const ms = months(), st = fotoStats(), cur = curMonth(), lp = laporanInfo(), p = S.profile || {};
  const pct = Math.round(st.acc / st.total * 100);
  const rej = S.fotos.filter(f => f.status === 'ditolak')[0];
  const hist = [...S.fotos].filter(f => f.tgl).sort((a, b) => new Date(b.tgl) - new Date(a.tgl)).slice(0, 5);
  const lapSt = S.laporan ? S.laporan.status : null;
  $('#v-beranda').innerHTML = `
  <div class="hero card">
    <div><small class="eyebrow">TAHUN AKADEMIK ${esc(S.settings.tahun_akademik)}</small><h2>Selamat Datang, ${esc(S.user.name)}</h2>
    <div class="tags"><span class="tag">${ic('shield')}NIM: ${esc(p.nim)}</span><span class="tag">${ic('cap')}Semester 7</span></div>
    ${p.mitra ? `<div class="mitra">${ic('building')}<span><b>Mitra:</b> ${esc(p.mitra)}</span></div>` : ''}
    ${p.pembimbing ? `<div class="mitra">${ic('users')}<span><b>Dosen Pembimbing:</b> ${esc(p.pembimbing)}</span></div>` : ''}</div>
  </div>
  ${rej ? `<div class="alert wait">${ic('alert')}<div><b>Tindakan Diperlukan</b><p>Ada ${st.rej} foto yang ditolak${rej.alasan ? `: <i>“${esc(rej.alasan)}”</i>` : ''}. Silakan upload ulang.</p>
    <button class="btn amb sm" data-act="nav" data-v="foto">Periksa Foto ${ic('right')}</button></div></div>` : ''}
  <div class="grid2">
    <div class="card">
      <div class="ch"><h3>${ic('camera')} Progres Unggahan Foto</h3><span class="b mute">Wajib 3 Foto/Bulan</span></div>
      <p class="muted">Dokumentasi absensi visual bulanan</p>
      <div class="big"><b>${st.acc}</b> dari ${st.total} foto tervalidasi <span class="pct">${pct}%</span></div>
      ${ms.map(m => { const s = m.open ? monthSummary(m.n) : null; return m.open ? `
        <div class="mrow"><div class="mh"><b>${m.name}</b>${cur && cur.n === m.n ? '<span class="b info">Berjalan</span>' : ''}<span class="grow"></span><span class="b ${s.cls}">${s.t}</span></div><div class="segs">${segs(m.n)}</div></div>` : `
        <div class="mrow lock"><div class="mh">${ic('lock')}<b>${m.name}</b><span class="grow"></span><span class="b mute">Terkunci (Buka 1 ${BULAN[m.start.getMonth()].slice(0, 3)})</span></div><div class="segs"><i class="sg"></i><i class="sg"></i><i class="sg"></i></div></div>`; }).join('')}
      <button class="btn pri" data-act="nav" data-v="foto">Buka Upload Foto ${ic('right')}</button>
    </div>
    <div class="stack">
      <div class="card">
        <div class="ch"><h3>${ic('file')} Laporan PKL & Nilai</h3><span class="b ${lp.open ? 'ok' : 'mute'}">${lp.open ? 'Terbuka' : 'Terkunci'}</span></div>
        <p class="muted">${lp.open ? 'Kumpulkan laporan akhir PKL (PDF) beserta berkas evaluasi nilai dosen pembimbing dan pembimbing lapangan.' : `Dibuka mulai ${lp.name} ${lp.year}.`}</p>
        <div class="tags"><span class="tag">Periode: ${lp.name} ${lp.year}</span>${lp.open ? badge(lapSt || 'belum', lapSt ? null : 'Menunggu Unggahan') : ''}</div>
        <button class="btn ${lp.open ? 'sec' : 'ghost'}" data-act="nav" data-v="laporan">Buka Laporan & Nilai ${ic('right')}</button>
      </div>
      <div class="card row">
        <span class="ico">${ic('book')}</span><div class="grow"><b>Dokumen & Panduan PKL</b><p class="muted sm">${S.dokumen.length} berkas panduan siap unduh</p></div>
        <button class="icb" data-act="nav" data-v="dokumen" aria-label="Buka dokumen">${ic('download')}</button>
      </div>
    </div>
  </div>
  ${hist.length ? `<div class="card"><div class="ch"><h3>${ic('clock')} Riwayat Terakhir</h3></div>
    ${hist.map(f => `<div class="hist"><span class="hi ${f.status}">${ic(f.status === 'diterima' ? 'check' : f.status === 'ditolak' ? 'x' : 'clock')}</span>
      <div><b>${esc(slotLabel(f.slot).split('(')[0].trim())} · ${months()[f.bulan - 1]?.name || ''}</b>
      <p>${f.status === 'diterima' ? 'Diterima' : f.status === 'ditolak' ? `<span class="red">Ditolak${f.alasan ? ': ' + esc(f.alasan) : ''}</span>` : 'Menunggu verifikasi koordinator'}</p></div>
      <small>${ago(f.tgl)}</small></div>`).join('')}</div>` : ''}
  <div class="tip">${ic('bulb')}<div><b>Tips Verifikasi Cepat</b><p>Pastikan pencahayaan cukup dan ID card terlihat jelas agar foto disetujui tanpa revisi.</p></div></div>`;
}

// ------------------------------- UPLOAD FOTO -------------------------------
function slotHtml(b, s) {
  const f = slotOf(b, s), st = f ? f.status : 'kosong', err = f && f._state === 'error';
  const sending = f && (f._state === 'queued' || f._state === 'sending');
  const lbl = slotLabel(s);
  let act = '';
  if (st === 'diterima') act = `<div class="lockrow">${ic('lock')}<span>Diverifikasi ${fmtDate(f.tgl, true)}</span><b>Terkunci</b></div>`;
  else if (err) act = `<div class="alert bad sm">${ic('alert')}<div><p>${esc(f._err || 'Gagal mengunggah.')}</p></div></div>
      <div class="two"><button class="btn pri sm" data-act="retryup" data-b="${b}" data-s="${s}">${ic('refresh')} Coba lagi</button><button class="btn ghost sm" data-act="dropup" data-b="${b}" data-s="${s}">Batal</button></div>`;
  else if (sending) act = `<div class="upg"><span class="spin dark"></span> ${f._state === 'queued' ? 'Mengantre…' : 'Mengirim…'}</div>`;
  else act = `<button class="btn ${st === 'ditolak' ? 'pri' : st === 'menunggu' ? 'sec' : 'out'} wide" data-act="pick" data-b="${b}" data-s="${s}">${ic(st === 'menunggu' ? 'refresh' : 'camera')} ${st === 'ditolak' ? 'Upload Ulang Foto ' + s : st === 'menunggu' ? 'Ubah Berkas' : 'Pilih / Ambil Foto'}</button>`;
  return `<div class="slot ${st}">
    <div class="sh"><span class="num">${s}</span><div class="grow"><b>${esc(lbl)}</b></div>${f ? badge(sending ? 'menunggu' : st, sending ? 'Dikirim' : null) : '<span class="b mute">Belum diunggah</span>'}</div>
    ${f ? `<div class="ph">${imgTag(f.fileId, f._local)}<span class="phs"></span>${st === 'ditolak' ? `<span class="phb">${ic('alert')} Kualitas Tidak Memenuhi Syarat</span>` : ''}</div>` :
      `<div class="ph empty" data-act="pick" data-b="${b}" data-s="${s}">${ic('camera')}<small>${esc(slotHint(s))}</small></div>`}
    ${st === 'ditolak' ? `<div class="note bad"><b>${ic('alert')} Catatan Evaluator:</b><p>“${esc(f.alasan || 'Foto tidak memenuhi syarat.')}”</p></div>` : ''}
    ${act}</div>`;
}
function renderFoto() {
  const ms = months(), st = fotoStats(), cur = curMonth(), open = S.ui.open || (S.ui.open = new Set(cur ? [cur.n] : []));
  $('#v-foto').innerHTML = `
  <div class="pgh"><h2>Unggah Foto Kegiatan</h2><p class="muted">Wajib 3 foto per bulan dari sudut/aktivitas berbeda dengan identitas kantor terlihat jelas.</p></div>
  <div class="stat navy"><div><small>STATUS PELAPORAN MAGANG</small><h3>${st.acc} dari ${st.total} Foto Tervalidasi</h3>${st.rej ? `<p>Segera selesaikan revisi pada foto yang ditolak.</p>` : '<p>Pantau status tiap foto di bawah.</p>'}</div><div class="pctbox"><b>${Math.round(st.acc / st.total * 100)}%</b><small>Total</small></div></div>
  ${ms.map(m => {
    if (!m.open) return `<div class="mcard lockm"><div class="mt">${ic('lock')}<div class="grow"><b>Bulan ${m.n} — ${m.name}</b><small>Sesi unggah dibuka otomatis pada 1 ${m.name} ${m.year}.</small></div><span class="b mute">Terkunci</span></div></div>`;
    const sm = monthSummary(m.n), isOpen = open.has(m.n), isCur = cur && cur.n === m.n;
    return `<div class="mcard ${isOpen ? 'open' : ''}"><button class="mt" data-act="tmonth" data-n="${m.n}">
      <span class="mi">${ic('camera')}</span><div class="grow"><b>Bulan ${m.n} — ${m.name}</b><small>${isCur ? 'Bulan Berjalan (Aktif)' : 'Periode 1 – ' + new Date(m.start.getFullYear(), m.start.getMonth() + 1, 0).getDate() + ' ' + m.name + ' ' + m.year}</small></div>
      <span class="b ${sm.cls}">${sm.t}</span>${ic(isOpen ? 'up' : 'down')}</button>
      ${isOpen ? `<div class="slots">${[1, 2, 3].map(s => slotHtml(m.n, s)).join('')}<p class="muted sm center">Format JPG/PNG · otomatis dikompres di perangkat sebelum dikirim.</p></div>` : ''}</div>`;
  }).join('')}`;
  hydrate($('#v-foto'));
}
ACT.tmonth = el => { const n = +el.dataset.n, o = S.ui.open; o.has(n) ? o.delete(n) : o.add(n); renderView('foto'); };
ACT.pick = el => {
  const b = +el.dataset.b, s = +el.dataset.s, f = slotOf(b, s);
  if (f && f.status === 'diterima') return;
  pickFile('image/jpeg,image/png', async file => {
    if (!/^image\/(jpeg|png)$/.test(file.type)) return toast('Format harus JPG atau PNG.', 'bad');
    let r; try { r = await compressImage(file); } catch (e) { return toast('Foto tidak dapat dibaca. Coba foto lain.', 'bad'); }
    const url = URL.createObjectURL(r.blob);
    const m = modal(`<div class="mh2"><h3>Pratinjau Foto ${s}</h3><button class="icb" data-close>${ic('x')}</button></div>
      <div class="pv"><img src="${url}" alt=""></div><p class="muted sm center">${esc(slotLabel(s))} · ${months()[b - 1].name}<br>Terkompres ${fmtKB(r.blob.size)} · ${r.w}×${r.h}px</p>
      <div class="two"><button class="btn ghost" data-close>Ganti Foto</button><button class="btn pri" id="pv-send">${ic('upload')} Kirim</button></div>`);
    $('#pv-send', m).onclick = () => { m.close(); enqueuePhoto(b, s, r.blob, url); };
  });
};
function enqueuePhoto(b, s, blob, url) {
  S.fotos = S.fotos.filter(f => !(f.bulan === b && f.slot === s));
  const e = { id: 'tmp' + Date.now(), bulan: b, slot: s, fileId: '', tgl: new Date().toISOString(), status: 'menunggu', alasan: '', _local: url, _blob: blob, _state: 'queued' };
  S.fotos.push(e); UQ.items.push(e); markDirty('beranda', 'foto'); toast('Foto ' + s + ' masuk antrean pengiriman.', 'ok', { ms: 2000 }); runUQ();
}
async function runUQ() {
  if (UQ.running) return; UQ.running = true; setSync('busy');
  while (UQ.items.length) {
    const e = UQ.items.shift(); e._state = 'sending'; markDirty('foto');
    try {
      const b64 = await blobToB64(e._blob);
      const r = await API.callRetry('uploadFoto', { bulan: e.bulan, slot: e.slot, mime: 'image/jpeg', data: b64 });
      Files.cache.set(r.foto.fileId, { url: e._local, blob: e._blob, mime: 'image/jpeg' });
      Object.assign(e, r.foto); delete e._state; delete e._blob; delete e._local;
      toast('Foto ' + e.slot + ' berhasil dikirim, menunggu verifikasi.', 'ok', { ms: 2500 });
    } catch (err) { e._state = 'error'; e._err = err.message; toast(esc(err.message), 'bad'); }
    markDirty('beranda', 'foto');
  }
  UQ.running = false; setSync(navigator.onLine ? 'ok' : 'err');
}
ACT.retryup = el => { const f = slotOf(+el.dataset.b, +el.dataset.s); if (f && f._blob) { f._state = 'queued'; UQ.items.push(f); markDirty('foto'); runUQ(); } };
ACT.dropup = el => { S.fotos = S.fotos.filter(f => !(f.bulan === +el.dataset.b && f.slot === +el.dataset.s && f._state)); markDirty('beranda', 'foto'); refresh(true); };

// ------------------------------- LAPORAN & NILAI -------------------------------
const nparse = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(n) ? null : n; };
const grade = n => n === null ? '-' : n >= 85 ? 'A' : n >= 70 ? 'B' : n >= 55 ? 'C' : n >= 40 ? 'D' : 'E';
const fnum = n => n === null ? '' : String(n).replace('.', ',');
function est() {
  const bw = +S.settings.bobot_dosen || 40, nd = nparse(S.ui.nd), nl = nparse(S.ui.nl);
  if (nd === null || nl === null) return null;
  return (nd * bw + nl * (100 - bw)) / 100;
}
function renderLaporan() {
  const lp = laporanInfo(), L = S.laporan, bw = +S.settings.bobot_dosen || 40, nv = S.nilai || {};
  if (S.ui.nd === undefined) { S.ui.nd = nv.nilaiDosen ?? ''; S.ui.nl = nv.nilaiLapangan ?? ''; }
  if (!lp.open) {
    $('#v-laporan').innerHTML = `<div class="pgh"><h2>Laporan PKL & Nilai</h2></div><div class="card center lockc">${ic('lock')}<h3>Belum Dibuka</h3><p class="muted">Menu unggah laporan PKL dan nilai akhir terbuka mulai <b>${lp.name} ${lp.year}</b>.<br>Fokus dulu pada unggahan foto kegiatan bulanan.</p><button class="btn pri" data-act="nav" data-v="foto">Ke Upload Foto</button></div>`;
    return;
  }
  const locked = L && L.status === 'diterima', nf = S.ui.nf || {};
  const e = est();
  const fileRow = (kind, id, nama) => {
    const x = nf[kind];
    if (x) return `<div class="frow"><span class="fi">${ic('file')}</span><div class="grow"><b>${esc(x.name)}</b><small>${x.state === 'error' ? '<span class="red">Gagal mengunggah</span>' : 'Mengunggah…'}</small></div>${x.state === 'error' ? `<button class="icb" data-act="nfpick" data-k="${kind}">${ic('refresh')}</button>` : '<span class="spin dark"></span>'}</div>`;
    if (!id) return `<button class="drop" data-act="nfpick" data-k="${kind}" ${locked ? 'disabled' : ''}>${ic('upload')}<span>Unggah berkas (PDF / JPG / PNG, maks 10 MB)</span></button>`;
    return `<div class="frow"><span class="fi ok">${ic('check')}</span><div class="grow"><b>${esc(nama || 'berkas')}</b><small>Terunggah</small></div><button class="icb" data-act="viewf" data-fid="${esc(id)}" data-t="${esc(nama || 'Berkas')}" title="Lihat">${ic('eye')}</button>${locked ? '' : `<button class="icb" data-act="nfpick" data-k="${kind}" title="Ganti">${ic('edit')}</button>`}</div>`;
  };
  $('#v-laporan').innerHTML = `
  <div class="pgh"><h2>Upload Laporan PKL & Nilai</h2></div>
  <div class="alert wait">${ic('clock')}<div><b>PERIODE AKTIF</b><p>Periode unggah laporan PKL telah dibuka (${lp.name} ${lp.year}).</p></div></div>
  <div class="card">
    <div class="ch"><h3>${ic('file')} Laporan Akhir PKL</h3>${L ? badge(L._state === 'error' ? 'ditolak' : L.status, L._state === 'sending' ? 'Mengirim' : L._state === 'error' ? 'Gagal' : (L.status === 'menunggu' ? 'Menunggu Verifikasi' : null)) : '<span class="b mute">Belum diunggah</span>'}</div>
    ${L && L.status === 'ditolak' ? `<div class="note bad"><b>${ic('alert')} Catatan Evaluator:</b><p>“${esc(L.alasan || 'Laporan perlu diperbaiki.')}”</p></div>` : ''}
    ${L && L._state === 'error' ? `<div class="alert bad sm">${ic('alert')}<div><p>${esc(L._err)}</p></div></div>` : ''}
    ${L ? `<div class="frow big"><span class="fi pdf">PDF</span><div class="grow"><b>${esc(L.nama)}</b><small>${L._state === 'sending' ? 'Mengunggah…' : 'Diunggah ' + fmtDate(L.tgl, true)}</small></div></div>
      <div class="two"><button class="btn out" data-act="viewlap" ${L._state === 'sending' ? 'disabled' : ''}>${ic('eye')} Lihat Preview</button>
      <button class="btn out" data-act="lappick" ${locked || L._state === 'sending' ? 'disabled' : ''}>${ic('refresh')} Ganti File PDF</button></div>`
      : `<button class="drop big" data-act="lappick">${ic('upload')}<span>Pilih file laporan (PDF, maks 10 MB)</span></button>`}
    <div class="note">${ic('alert')}<p>Hanya menerima format <b>.PDF</b> maksimal <b>10MB</b>. Pastikan lembar pengesahan sudah ditandatangani basah atau bertanda tangan digital resmi.</p></div>
  </div>
  <div class="pgh sm"><h3>Nilai Akhir Pembimbing</h3><p class="muted">Lengkapi formulir angka dan lampirkan bukti pengesahan otentik.</p></div>
  <div class="grid2">
    <div class="card"><div class="ch"><span class="num">1</span><div class="grow"><b>Dosen Pembimbing (Kampus)</b><small>Berdasarkan sidang & bimbingan</small></div><span class="b mute">Bobot: ${bw}%</span></div>
      <label class="lb">Nilai Akhir (Skala 0 - 100) <b class="gr" id="gr-d">Grade: ${grade(nparse(S.ui.nd))}</b></label>
      <div class="numf"><input inputmode="decimal" data-inp="nilai" data-k="nd" value="${esc(fnum(nparse(S.ui.nd)))}" placeholder="0" ${locked ? 'disabled' : ''}><span>/ 100</span></div>
      <label class="lb">Bukti Lembar Penilaian Dosen</label>${fileRow('dosen', nv.fileDosen, nv.namaDosen)}</div>
    <div class="card"><div class="ch"><span class="num">2</span><div class="grow"><b>Pembimbing Lapangan (Instansi)</b><small>${esc((S.profile || {}).mitra || 'Mitra industri')}</small></div><span class="b mute">Bobot: ${100 - bw}%</span></div>
      <label class="lb">Nilai Akhir (Skala 0 - 100) <b class="gr" id="gr-l">Grade: ${grade(nparse(S.ui.nl))}</b></label>
      <div class="numf"><input inputmode="decimal" data-inp="nilai" data-k="nl" value="${esc(fnum(nparse(S.ui.nl)))}" placeholder="0" ${locked ? 'disabled' : ''}><span>/ 100</span></div>
      <label class="lb">Surat Keterangan & Nilai Instansi</label>${fileRow('lapangan', nv.fileLapangan, nv.namaLapangan)}</div>
  </div>
  <div class="stat navy"><div><small>Estimasi Nilai Total</small><p>(${bw}% Kampus + ${100 - bw}% Instansi)</p></div><div class="est"><b id="est-v">${e === null ? '–' : e.toFixed(1).replace('.', ',')}</b><span id="est-g"> / ${e === null ? '-' : grade(e)}</span></div></div>
  <div class="sticky-cta"><button class="btn pri lg" data-act="savenilai" ${locked ? 'disabled' : ''}>${ic('ok')} ${locked ? 'Data Terkunci' : 'Simpan Perubahan & Ajukan Verifikasi'}</button>
  <small class="muted center">${ic('lock')} Data nilai dan laporan akan dikunci setelah admin menyetujui.</small></div>`;
}
INP.nilai = el => {
  S.ui[el.dataset.k] = el.value;
  const n = nparse(el.value); $('#gr-' + (el.dataset.k === 'nd' ? 'd' : 'l')).textContent = 'Grade: ' + grade(n);
  const e = est(); $('#est-v').textContent = e === null ? '–' : e.toFixed(1).replace('.', ','); $('#est-g').textContent = ' / ' + (e === null ? '-' : grade(e));
};
ACT.savenilai = () => {
  const nd = nparse(S.ui.nd), nl = nparse(S.ui.nl);
  if (nd === null || nl === null || nd < 0 || nd > 100 || nl < 0 || nl > 100) return toast('Isi kedua nilai dengan angka 0 – 100.', 'bad');
  S.nilai = Object.assign({}, S.nilai, { nilaiDosen: nd, nilaiLapangan: nl });
  const miss = []; if (!S.laporan) miss.push('laporan PDF'); if (!S.nilai.fileDosen) miss.push('bukti nilai dosen'); if (!S.nilai.fileLapangan) miss.push('bukti nilai instansi');
  toast(miss.length ? 'Nilai tersimpan. Masih perlu: ' + miss.join(', ') + '.' : 'Nilai tersimpan dan diajukan untuk verifikasi.', miss.length ? 'info' : 'ok', { ms: 4000 });
  bg(() => API.callRetry('saveNilai', { nilaiDosen: nd, nilaiLapangan: nl }), e => { toast(esc(e.message), 'bad'); refresh(true); });
};
ACT.lappick = () => pickFile('application/pdf', file => {
  if (!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name)) return toast('Laporan harus berformat PDF.', 'bad');
  if (file.size > 10 * 1048576) return toast('Ukuran PDF melebihi 10 MB (' + fmtKB(file.size) + ').', 'bad');
  const url = URL.createObjectURL(file);
  S.laporan = { nim: S.user.id, status: 'menunggu', nama: file.name, tgl: new Date().toISOString(), fileId: '', alasan: '', _state: 'sending', _local: url };
  markDirty('beranda', 'laporan');
  bg(async () => {
    const r = await API.callRetry('uploadLaporan', { name: file.name, data: await blobToB64(file) });
    Files.cache.set(r.laporan.fileId, { url, blob: file, mime: 'application/pdf', name: file.name });
    S.laporan = r.laporan; markDirty('beranda', 'laporan'); toast('Laporan terunggah, menunggu verifikasi.');
  }, e => { S.laporan._state = 'error'; S.laporan._err = e.message; markDirty('laporan'); toast(esc(e.message), 'bad'); });
});
ACT.nfpick = el => {
  const kind = el.dataset.k;
  pickFile('application/pdf,image/jpeg,image/png', file => {
    if (file.size > 10 * 1048576) return toast('Ukuran berkas melebihi 10 MB.', 'bad');
    S.ui.nf = S.ui.nf || {}; S.ui.nf[kind] = { name: file.name, state: 'sending' }; markDirty('laporan');
    bg(async () => {
      const r = await API.callRetry('uploadNilaiFile', { kind, name: file.name, mime: file.type, data: await blobToB64(file) });
      const id = kind === 'dosen' ? r.nilai.fileDosen : r.nilai.fileLapangan;
      Files.cache.set(id, { url: URL.createObjectURL(file), blob: file, mime: file.type, name: file.name });
      S.nilai = r.nilai; delete S.ui.nf[kind]; markDirty('laporan'); toast('Berkas nilai terunggah.');
    }, e => { S.ui.nf[kind].state = 'error'; markDirty('laporan'); toast(esc(e.message), 'bad'); });
  });
};

// pratinjau berkas (foto/PDF) — dipakai mahasiswa, admin, dosen
async function openFile(fid, title) {
  const m = modal(`<div class="mh2"><h3>${esc(title || 'Berkas')}</h3><button class="icb" data-close>${ic('x')}</button></div><div class="pvbox"><div class="spin dark big"></div></div>`, 'wide');
  try {
    const o = await Files.get(fid), box = $('.pvbox', m); if (!box) return;
    box.innerHTML = o.mime === 'application/pdf'
      ? `<iframe src="${o.url}" title="PDF"></iframe><a class="btn out sm" href="${o.url}" target="_blank" rel="noopener">${ic('ext')} Buka di tab baru</a>`
      : `<img src="${o.url}" alt="">`;
  } catch (e) { const box = $('.pvbox', m); if (box) box.innerHTML = `<p class="red">${esc(e.message)}</p>`; }
}
ACT.viewf = el => openFile(el.dataset.fid, el.dataset.t);
ACT.viewlap = () => { const L = S.laporan; if (!L) return; if (L._local && !L.fileId) { const m = modal(`<div class="mh2"><h3>${esc(L.nama)}</h3><button class="icb" data-close>${ic('x')}</button></div><div class="pvbox"><iframe src="${L._local}"></iframe></div>`, 'wide'); } else openFile(L.fileId, L.nama); };

// ------------------------------- DOKUMEN -------------------------------
const docExt = d => (String(d.nama || '').split('.').pop() || 'FILE').toUpperCase().slice(0, 4);
function docCard(d) {
  return `<div class="card dcard"><div class="dtop"><span class="dico">${ic('file')}</span><div class="grow">
    <div class="tags"><span class="b info">${esc(d.kategori || 'Dokumen')}</span><small class="muted">Update ${fmtDate(d.tgl, true)}</small></div>
    <h3>${esc(d.judul)}</h3><p class="muted">${esc(d.keterangan)}</p></div></div>
    <div class="dmeta"><b>${d.fileId ? docExt(d) : 'LINK'}</b>${d.kb ? `<span>${fmtKB(d.kb * 1024)}</span>` : ''}</div>
    <button class="btn out wide" data-act="dl" data-id="${esc(d.id)}">${ic('download')} Unduh Berkas</button></div>`;
}
function dokList() {
  const q = (S.ui.dq || '').toLowerCase(), k = S.ui.dk || 'Semua';
  const l = S.dokumen.filter(d => (k === 'Semua' || d.kategori === k) && (!q || (d.judul + ' ' + d.keterangan).toLowerCase().includes(q)));
  $('#dk-list').innerHTML = l.length ? l.map(docCard).join('') : `<div class="empty">${ic('search')}<p>Tidak ada dokumen yang cocok.</p></div>`;
}
function renderDokMhs() {
  const cats = ['Semua', ...new Set(S.dokumen.map(d => d.kategori).filter(Boolean))];
  $('#v-dokumen').innerHTML = `<div class="pgh"><span class="b info">${ic('shield')} REPOSITORY RESMI</span><h2>Dokumen & Panduan</h2><p class="muted">Berkas resmi, format laporan, dan surat pengantar magang.</p></div>
    <div class="inp srch">${ic('search')}<input data-inp="dq" placeholder="Cari dokumen atau panduan..." value="${esc(S.ui.dq || '')}"></div>
    <div class="chips">${cats.map(c => `<button class="chip2 ${c === (S.ui.dk || 'Semua') ? 'on' : ''}" data-act="dkat" data-k="${esc(c)}">${esc(c)}</button>`).join('')}</div>
    <div class="dgrid" id="dk-list"></div>`;
  dokList();
}
INP.dq = debounce(el => { S.ui.dq = el.value; dokList(); }, 120);
ACT.dkat = el => { S.ui.dk = el.dataset.k; $$('.chip2').forEach(c => c.classList.toggle('on', c.dataset.k === S.ui.dk)); dokList(); };
ACT.dl = async el => {
  const d = S.dokumen.find(x => x.id === el.dataset.id); if (!d) return;
  if (!d.fileId) { if (d.link) window.open(d.link, '_blank', 'noopener'); return; }
  const old = el.innerHTML; el.disabled = true; el.innerHTML = '<span class="spin dark"></span> Menyiapkan…';
  try {
    const o = await Files.get(d.fileId), a = document.createElement('a');
    a.href = o.url; a.download = d.nama || o.name || 'dokumen'; document.body.appendChild(a); a.click(); a.remove();
  } catch (e) { toast(esc(e.message), 'bad'); }
  el.disabled = false; el.innerHTML = old;
};
