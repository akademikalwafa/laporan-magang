// ==========================================================================
// ADMIN & DOSEN — Rekap, Detail, Verifikasi, Kelola Dokumen, Pengaturan
// Rekap dihitung di browser dari data bootstrap → filter/cari/verifikasi terasa 0ms.
// ==========================================================================
const isAdmin = () => S.role === 'admin';
const nameOf = nim => (S.mahasiswa.find(m => m.nim === nim) || {}).nama || nim;

// ------------------------------- REKAP -------------------------------
function rekapRows() {
  if (S._rk && S._rk.v === S.ver) return S._rk.rows;
  const ms = months(), lp = laporanInfo();
  const rows = S.mahasiswa.map(m => {
    const fs = S.idx.f[m.nim] || [];
    const per = ms.map(mo => {
      if (!mo.open) return { open: false };
      const a = fs.filter(f => f.bulan === mo.n);
      return { open: true, acc: a.filter(x => x.status === 'diterima').length, wait: a.filter(x => x.status === 'menunggu').length, rej: a.filter(x => x.status === 'ditolak').length, up: a.length };
    });
    const op = per.filter(p => p.open), total = op.reduce((s, p) => s + p.up, 0);
    const st = total === 0 ? 'belum' : (op.length && op.every(p => p.acc === 3) ? 'lengkap' : 'kurang');
    const l = S.idx.l[m.nim];
    return { ...m, per, st, rev: op.some(p => p.rej), lap: l ? l.status : null, q: (m.nim + ' ' + m.nama).toLowerCase() };
  });
  S._rk = { v: S.ver, rows }; return rows;
}
const mchip = p => !p.open ? `<span class="b mute">${ic('lock')}Terkunci</span>`
  : p.acc === 3 ? '<span class="b ok">3/3 ACC</span>' : p.up === 0 ? '<span class="b mute">0/3 Belum</span>'
  : p.rej ? `<span class="b bad">${p.acc}/3 (${p.rej} Ditolak)</span>` : p.wait ? `<span class="b wait">${p.acc}/3 (${p.wait} Menunggu)</span>` : `<span class="b bad">${p.acc}/3 (${3 - p.up} Belum)</span>`;
const lapChip = (r, open) => r.lap === 'diterima' ? `<span class="b ok">${ic('check')}Diterima</span>` : r.lap === 'menunggu' ? '<span class="b wait">Menunggu (PDF)</span>'
  : r.lap === 'ditolak' ? '<span class="b bad">Ditolak</span>' : (open ? '<span class="b mute">Belum</span>' : '<span class="muted">-</span>');

function rekapFiltered() {
  const u = S.ui, q = (u.rq || '').toLowerCase().trim();
  return rekapRows().filter(r => (!u.rs || r.st === u.rs) && (!u.rp || r.prodi === u.rp) && (!u.rd || r.pemb === u.rd) && (!q || r.q.includes(q)));
}
function fillSel(sel, label, vals, cur) {
  const el = $(sel); if (!el) return;
  el.innerHTML = `<option value="">${label}</option>` + vals.map(v => `<option ${v === cur ? 'selected' : ''}>${esc(v)}</option>`).join('');
}
function renderRekap() {
  const u = S.ui; u.rpage = u.rpage || 1;
  if (!$('#rk-body')) {
    $('#v-rekap').innerHTML = `
    <div class="pgh row"><div class="grow"><span class="chip"><i></i><span id="rk-ta"></span></span><h2>Rekap Mahasiswa PKL & Magang</h2>
      <p class="muted" id="rk-sub"></p></div><button class="btn out" data-act="rcsv">${ic('download')} Ekspor CSV</button>${isAdmin() ? `<button class="btn out" id="rk-sync" data-act="syncnow">${ic('refresh')} Sinkronisasi Rekap</button>` : ''}</div>
    <div class="alert wait" id="rk-arsip" style="display:none">${ic('lock')}<div><b>Mode Arsip (baca-saja)</b><p>Anda sedang melihat data periode lama. Pilih periode aktif untuk kembali.</p></div></div>
    <div class="stats3" id="rk-stats"></div>
    <div class="card toolbar"><div class="inp srch grow">${ic('search')}<input data-inp="rq" placeholder="Cari berdasarkan NIM atau nama mahasiswa..." value="${esc(u.rq || '')}"></div>
      <select data-chg="rs"><option value="">Semua Status</option><option value="lengkap">Lengkap</option><option value="kurang">Kurang</option><option value="belum">Belum upload</option></select>
      <select data-chg="rp" id="rk-prodi"></select><select data-chg="rd" id="rk-dosen"></select><select data-chg="rper" id="rk-per" title="Periode"></select></div>
    <div class="card tcard"><div class="tscroll"><table class="tbl"><thead id="rk-head"></thead><tbody id="rk-body"></tbody></table></div><div class="pager" id="rk-pager"></div></div>`;
    $('select[data-chg=rs]').value = u.rs || '';
  }
  const all = rekapRows(), ms = months(), lp = laporanInfo();
  fillSel('#rk-prodi', 'Semua Program Studi', [...new Set(S.mahasiswa.map(m => m.prodi).filter(Boolean))].sort(), u.rp);
  fillSel('#rk-dosen', 'Semua Dosen Pembimbing', [...new Set(S.mahasiswa.map(m => m.pemb).filter(Boolean))].sort(), u.rd);
  const per = $('#rk-per'); per.style.display = S.periodes.length > 1 ? '' : 'none';
  per.innerHTML = S.periodes.map(p => `<option value="${esc(p)}" ${p === S.periode ? 'selected' : ''}>${esc(p)}${p === S.periodeAktif ? ' (aktif)' : ''}</option>`).join('');
  $('#rk-arsip').style.display = S.arsip ? '' : 'none'; const sy = $('#rk-sync'); if (sy) sy.style.display = S.arsip ? 'none' : '';
  $('#rk-ta').textContent = 'TAHUN AKADEMIK ' + S.periode;
  const c = { lengkap: 0, kurang: 0, belum: 0 }; all.forEach(r => c[r.st]++);
  const pc = k => all.length ? (c[k] / all.length * 100).toFixed(1) + '%' : '0%';
  $('#rk-sub').textContent = `Pemantauan kelengkapan unggah 3 foto per bulan, laporan PDF, dan nilai akhir ${all.length} mahasiswa magang.`;
  $('#rk-stats').innerHTML = [['lengkap', 'STATUS: LENGKAP', 'ok'], ['kurang', 'KURANG / PERLU REVISI', 'wait'], ['belum', 'BELUM UPLOAD', 'mute']].map(([k, t, cl]) =>
    `<button class="card stat3 ${cl} ${u.rs === k ? 'on' : ''}" data-act="rstat" data-k="${k}"><small>${t}</small><div><b>${c[k]}</b><span>Mahasiswa</span></div><em>${pc(k)}</em></button>`).join('');
  $('#rk-head').innerHTML = `<tr><th>NIM</th><th>MAHASISWA & PRODI</th><th class="hm">MITRA & PEMBIMBING</th>${ms.map(m => `<th>${m.name.slice(0, 3).toUpperCase()} (3 FOTO)</th>`).join('')}<th>LAPORAN PKL</th><th>STATUS AKHIR</th><th></th></tr>`;
  const list = rekapFiltered();
  const pp = 25, pages = Math.max(1, Math.ceil(list.length / pp)); if (u.rpage > pages) u.rpage = pages;
  const view = list.slice((u.rpage - 1) * pp, u.rpage * pp);
  $('#rk-body').innerHTML = view.length ? view.map(r => `<tr data-act="detail" data-nim="${esc(r.nim)}">
    <td class="mono">${esc(r.nim)}</td><td><div class="who2"><span class="av c${r.nim.slice(-1) % 4}">${esc(initials(r.nama))}</span><div><b>${esc(r.nama)}</b><small>${esc(r.prodi)}</small></div></div></td>
    <td class="hm">${r.mitra ? ic('building') + esc(r.mitra) : '-'}${r.pemb ? `<small class="block muted">${esc(r.pemb)}</small>` : ''}</td>${r.per.map(p => `<td>${mchip(p)}</td>`).join('')}<td>${lapChip(r, lp.open)}</td>
    <td>${r.st === 'lengkap' ? '<span class="b ok dot">Lengkap</span>' : r.st === 'belum' ? '<span class="b mute dot">Belum Upload</span>' : `<span class="b wait dot">${r.rev ? 'Perlu Revisi' : 'Kurang'}</span>`}</td>
    <td><button class="btn ghost sm">${ic('eye')} Lihat</button></td></tr>`).join('') : `<tr><td colspan="${ms.length + 5}" class="empty">${all.length ? 'Tidak ada mahasiswa yang cocok dengan filter.' : 'Belum ada mahasiswa magang pada periode ini. Jalankan sinkronisasi di Pengaturan.'}</td></tr>`;
  const pg = []; for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - u.rpage) <= 1) pg.push(i); else if (pg[pg.length - 1] !== '…') pg.push('…');
  $('#rk-pager').innerHTML = `<small class="muted">Menampilkan <b>${list.length ? (u.rpage - 1) * pp + 1 : 0}-${Math.min(u.rpage * pp, list.length)}</b> dari ${list.length} mahasiswa</small><div class="pg">
    <button ${u.rpage <= 1 ? 'disabled' : ''} data-act="rpage" data-p="${u.rpage - 1}">${ic('chl')}</button>${pg.map(p => p === '…' ? '<span>…</span>' : `<button class="${p === u.rpage ? 'on' : ''}" data-act="rpage" data-p="${p}">${p}</button>`).join('')}<button ${u.rpage >= pages ? 'disabled' : ''} data-act="rpage" data-p="${u.rpage + 1}">${ic('chr')}</button></div>`;
}
CHG.rd = el => { S.ui.rd = el.value; S.ui.rpage = 1; renderRekap(); };
CHG.rper = async el => {
  try {
    const b = await API.call('bootstrap', { periode: el.value });
    applyBoot(b); S.ui.rp = ''; S.ui.rd = ''; S.ui.rpage = 1; S.ui.vq = null; S.ui.dnim = null; markDirty();
    toast(b.arsip ? 'Menampilkan arsip periode ' + esc(b.periode) + ' (baca-saja).' : 'Kembali ke periode aktif.', 'info', { ms: 2500 });
  } catch (e) { toast(esc(e.message), 'bad'); renderRekap(); }
};
ACT.rcsv = () => {
  const list = rekapFiltered(), ms = months(), bw = +S.settings.bobot_dosen || 40;
  const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const head = ['NIM', 'Nama', 'Program Studi', 'Mitra', 'Dosen Pembimbing', ...ms.map(m => 'Foto diterima ' + m.name + ' (maks 3)'), 'Laporan PKL', 'Nilai Dosen', 'Nilai Lapangan', 'Nilai Total', 'Status'];
  const rows = list.map(r => {
    const n = S.idx.n[r.nim] || {}, nd = nparse(n.nilaiDosen), nl = nparse(n.nilaiLapangan), tot = nd !== null && nl !== null ? ((nd * bw + nl * (100 - bw)) / 100).toFixed(1) : '';
    return [r.nim, r.nama, r.prodi, r.mitra, r.pemb, ...r.per.map(p => p.open ? p.acc : 'terkunci'), r.lap || 'belum', nd ?? '', nl ?? '', tot, r.st === 'lengkap' ? 'Lengkap' : r.st === 'belum' ? 'Belum upload' : 'Kurang'];
  });
  const csv = '\uFEFF' + [head, ...rows].map(r => r.map(q).join(';')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'rekap-pkl-' + String(S.periode).replace(/\W+/g, '-') + '.csv'; document.body.appendChild(a); a.click(); a.remove();
  toast('Rekap diekspor (' + list.length + ' baris). Buka dengan Excel.', 'ok', { ms: 2500 });
};
INP.rq = debounce(el => { S.ui.rq = el.value; S.ui.rpage = 1; renderRekap(); }, 150);
CHG.rs = el => { S.ui.rs = el.value; S.ui.rpage = 1; renderRekap(); };
CHG.rp = el => { S.ui.rp = el.value; S.ui.rpage = 1; renderRekap(); };
ACT.rstat = el => { S.ui.rs = S.ui.rs === el.dataset.k ? '' : el.dataset.k; $('select[data-chg=rs]').value = S.ui.rs; S.ui.rpage = 1; renderRekap(); };
ACT.rpage = el => { S.ui.rpage = +el.dataset.p; renderRekap(); };
// ------------------------------- DETAIL MAHASISWA -------------------------------
function askReason(title, cb) {
  const chips = ['Foto buram / blur', 'ID Card / Nametag tidak tampak', 'Bukan lokasi magang resmi', 'Aktivitas tidak sesuai pedoman'];
  const m = modal(`<div class="mh2"><h3>${esc(title)}</h3><button class="icb" data-close>${ic('x')}</button></div>
    <div class="chips">${chips.map(c => `<button class="chip2" data-t="${esc(c)}">+ ${esc(c)}</button>`).join('')}</div>
    <textarea id="rs-note" rows="3" placeholder="Alasan penolakan untuk mahasiswa (wajib)"></textarea>
    <div class="two"><button class="btn ghost" data-close>Batal</button><button class="btn bad" id="rs-ok">${ic('x')} Tolak & Minta Revisi</button></div>`);
  $$('.chip2', m).forEach(b => b.onclick = () => { const t = $('#rs-note', m); t.value = (t.value ? t.value + '; ' : '') + b.dataset.t; });
  $('#rs-ok', m).onclick = () => { const v = $('#rs-note', m).value.trim(); if (!v) return toast('Alasan penolakan wajib diisi.', 'bad'); m.close(); cb(v); };
}
function detailHtml(nim) {
  const m = S.mahasiswa.find(x => x.nim === nim) || { nim, nama: nim }, ms = months(), lp = laporanInfo(), L = S.idx.l[nim], N = S.idx.n[nim];
  const fs = S.idx.f[nim] || [], adm = isAdmin() && !S.arsip;
  return `<div class="dh"><span class="av lg">${esc(initials(m.nama))}</span><div class="grow"><h3>${esc(m.nama)}</h3><p class="muted">NIM <span class="mono">${esc(m.nim)}</span> · ${esc(m.prodi || '-')}</p>
    <p class="muted sm">${m.mitra ? ic('building') + esc(m.mitra) : ''}${m.pemb ? ' · Pembimbing: ' + esc(m.pemb) : ''}</p></div><button class="icb" data-close>${ic('x')}</button></div>
  ${ms.map(mo => !mo.open ? `<div class="dm lockm">${ic('lock')} Bulan ${mo.n} — ${mo.name} <span class="b mute">Terkunci</span></div>` : `<div class="dm"><h4>Bulan ${mo.n} — ${mo.name} ${mo.year}</h4><div class="dph">${[1, 2, 3].map(s => {
    const f = fs.find(x => x.bulan === mo.n && x.slot === s);
    return `<div class="dp ${f ? f.status : ''}"><div class="ph sm">${f ? `<button class="phb2" data-act="viewf" data-fid="${esc(f.fileId)}" data-t="${esc(slotLabel(s))}">${imgTag(f.fileId, '')}</button>` : `<div class="empty">${ic('camera')}</div>`}</div>
      <small>${esc(slotLabel(s).split('(')[0].trim())}</small>${f ? badge(f.status) : '<span class="b mute">Belum</span>'}
      ${f && f.status === 'ditolak' ? `<small class="red">${esc(f.alasan)}</small>` : ''}
      ${adm && f && f.status === 'menunggu' ? `<div class="two"><button class="btn ok sm" data-act="dtacc" data-id="${esc(f.id)}">${ic('check')}</button><button class="btn bad sm" data-act="dtrej" data-id="${esc(f.id)}">${ic('x')}</button></div>` : ''}</div>`; }).join('')}</div></div>`).join('')}
  <div class="dm"><h4>Laporan PKL</h4>${L ? `<div class="frow"><span class="fi pdf">PDF</span><div class="grow"><b>${esc(L.nama)}</b><small>${fmtDate(L.tgl)}${L.status === 'ditolak' ? ' · <span class="red">' + esc(L.alasan) + '</span>' : ''}</small></div>${badge(L.status)}
      <button class="icb" data-act="viewf" data-fid="${esc(L.fileId)}" data-t="${esc(L.nama)}">${ic('eye')}</button>
      ${adm && L.status === 'menunggu' ? `<button class="btn ok sm" data-act="dtlacc" data-id="${esc(nim)}">${ic('check')}</button><button class="btn bad sm" data-act="dtlrej" data-id="${esc(nim)}">${ic('x')}</button>` : ''}</div>`
      : `<p class="muted">${lp.open ? 'Belum diunggah.' : 'Dibuka ' + lp.name + ' ' + lp.year + '.'}</p>`}</div>
  ${N && (N.nilaiDosen !== '' || N.nilaiLapangan !== '') ? `<div class="dm"><h4>Nilai Akhir</h4><div class="two"><div class="nbox"><small>Dosen Pembimbing</small><b>${esc(N.nilaiDosen || '-')}</b>${N.fileDosen ? `<button class="btn ghost sm" data-act="viewf" data-fid="${esc(N.fileDosen)}" data-t="Bukti nilai dosen">${ic('eye')} Berkas</button>` : ''}</div>
      <div class="nbox"><small>Pembimbing Lapangan</small><b>${esc(N.nilaiLapangan || '-')}</b>${N.fileLapangan ? `<button class="btn ghost sm" data-act="viewf" data-fid="${esc(N.fileLapangan)}" data-t="Bukti nilai instansi">${ic('eye')} Berkas</button>` : ''}</div></div></div>` : ''}`;
}
function renderDetail() { const m = S.ui.dm; if (m && m.isConnected) { $('.modal', m).innerHTML = detailHtml(S.ui.dnim); hydrate(m); } }
ACT.detail = el => { S.ui.dnim = el.dataset.nim; S.ui.dm = modal(detailHtml(S.ui.dnim), 'wide'); hydrate(S.ui.dm); };
const fotoById = id => S.fotos.find(f => f.id === id);
ACT.dtacc = el => { const f = fotoById(el.dataset.id); const d = queueDecision({ type: 'foto', id: f.id }, 'diterima', ''); markDirty(); renderDetail(); toast('Foto diterima.', 'ok', { undo: () => { undoDecision(d); renderDetail(); } }); };
ACT.dtrej = el => { const f = fotoById(el.dataset.id); askReason('Tolak Foto ' + f.slot, n => { queueDecision({ type: 'foto', id: f.id }, 'ditolak', n); markDirty(); renderDetail(); toast('Foto ditolak, mahasiswa dapat upload ulang.'); }); };
ACT.dtlacc = el => { const d = queueDecision({ type: 'laporan', id: el.dataset.id }, 'diterima', ''); markDirty(); renderDetail(); toast('Laporan diterima.', 'ok', { undo: () => { undoDecision(d); renderDetail(); } }); };
ACT.dtlrej = el => askReason('Tolak Laporan PKL', n => { queueDecision({ type: 'laporan', id: el.dataset.id }, 'ditolak', n); markDirty(); renderDetail(); toast('Laporan ditolak.'); });

// ------------------------------- VERIFIKASI (admin) -------------------------------
let vbuf = [], vtimer = null;
function queueItems() {
  if (S.arsip) return [];
  if (S._q && S._q.v === S.ver) return S._q.l;
  const l = [];
  S.fotos.forEach(f => { if (f.status === 'menunggu' && f.fileId) l.push({ type: 'foto', key: 'f' + f.id, id: f.id, nim: f.nim, bulan: f.bulan, slot: f.slot, fileId: f.fileId, tgl: f.tgl }); });
  S.lap.forEach(x => { if (x.status === 'menunggu' && x.fileId) l.push({ type: 'laporan', key: 'l' + x.nim, id: x.nim, nim: x.nim, fileId: x.fileId, tgl: x.tgl, nama: x.nama }); });
  l.sort((a, b) => new Date(a.tgl) - new Date(b.tgl));
  S._q = { v: S.ver, l }; return l;
}
function setStatus(item, status, note) {
  const o = item.type === 'foto' ? S.fotos.find(x => x.id === item.id) : S.lap.find(x => x.nim === item.id);
  const prev = { status: o.status, alasan: o.alasan }; o.status = status; o.alasan = status === 'ditolak' ? note : ''; S.ver++; return { o, prev };
}
function queueDecision(item, status, note) {
  const r = setStatus(item, status, note);
  const d = { type: item.type, id: item.id, status, alasan: note, o: r.o, prev: r.prev };
  vbuf.push(d); clearTimeout(vtimer); vtimer = setTimeout(flushV, 3000); return d;
}
function undoDecision(d) {
  const i = vbuf.indexOf(d); if (i < 0) return toast('Sudah terkirim ke server.', 'info');
  vbuf.splice(i, 1); d.o.status = d.prev.status; d.o.alasan = d.prev.alasan; S.ver++; markDirty(); renderDetail();
}
function flushV() {
  if (!vbuf.length) return; const b = vbuf.splice(0);
  bg(() => API.callRetry('verify', { items: b.map(x => ({ type: x.type, id: x.id, status: x.status, alasan: x.alasan })) }),
     e => { toast('Gagal menyimpan verifikasi: ' + esc(e.message) + '. Memuat ulang data…', 'bad'); refresh(true); });
}
window.addEventListener('beforeunload', e => { if (vbuf.length) { flushV(); e.preventDefault(); e.returnValue = ''; } });
const itemLabel = it => it.type === 'foto' ? `Foto Slot ${it.slot} ${nameOf(it.nim)}` : `Laporan PKL ${nameOf(it.nim)}`;
const VQ = () => S.ui.vq || (S.ui.vq = { f: 'all', i: 0, sel: new Set(), zoom: 1, note: '' });
const vList = () => queueItems().filter(x => VQ().f === 'all' || x.type === VQ().f);
const vCur = () => vList()[VQ().i];

function renderVerif() {
  const all = queueItems(), vq = VQ(), list = vList(), nF = all.filter(x => x.type === 'foto').length, nL = all.length - nF;
  if (vq.i >= list.length) vq.i = Math.max(0, list.length - 1);
  const it = list[vq.i];
  if (!it) { $('#v-verifikasi').innerHTML = `<div class="card center lockc">${ic('ok')}<h3>Semua Beres 🎉</h3><p class="muted">Tidak ada item yang menunggu verifikasi${vq.f !== 'all' ? ' pada filter ini' : ''}.</p>${vq.f !== 'all' ? `<button class="btn out" data-act="vfilter" data-f="all">Tampilkan Semua</button>` : ''}</div>`; return; }
  const m = S.mahasiswa.find(x => x.nim === it.nim) || { nim: it.nim, nama: it.nim };
  const mo = it.type === 'foto' ? months()[it.bulan - 1] : null;
  const sibl = it.type === 'foto' ? (S.idx.f[it.nim] || []).filter(f => f.bulan === it.bulan).sort((a, b) => a.slot - b.slot) : [];
  const chips = ['Foto buram / blur', 'ID Card / Nametag tidak tampak', 'Bukan lokasi magang resmi', 'Aktivitas tidak sesuai pedoman'];
  $('#v-verifikasi').innerHTML = `
  <div class="card vbar"><span class="vi">${ic('ok')}</span><h3>Antrean Verifikasi</h3><span class="b wait">${all.length} Item Menunggu</span>
    <div class="seg">${[['all', 'Semua', all.length], ['foto', 'Foto', nF], ['laporan', 'Laporan', nL]].map(([k, t, n]) => `<button class="${vq.f === k ? 'on' : ''}" data-act="vfilter" data-f="${k}">${t} (${n})</button>`).join('')}</div>
    <span class="grow"></span><div class="vnav"><button class="icb" data-act="vprev" ${vq.i <= 0 ? 'disabled' : ''}>${ic('chl')}</button><div><b>Item ${vq.i + 1}</b> dari ${list.length}</div><button class="icb" data-act="vnext" ${vq.i >= list.length - 1 ? 'disabled' : ''}>${ic('chr')}</button><small class="hm">J Sebelum · K Berikut</small></div></div>
  <div class="vgrid">
    <div class="vleft"><div class="card vprev"><div class="vhead"><b>${it.type === 'foto' ? `${ic('camera')} ${esc(slotLabel(it.slot))}` : `${ic('file')} Laporan Akhir PKL`}</b>
      <div class="vtools">${it.type === 'foto' ? `<button class="icb" data-act="vzoom" data-d="-0.25">${ic('zout')}</button><span id="zv">${Math.round(vq.zoom * 100)}%</span><button class="icb" data-act="vzoom" data-d="0.25">${ic('zin')}</button><button class="btn ghost sm" data-act="vzoom" data-d="0">Reset</button>` : ''}
      <button class="btn ghost sm" data-act="viewf" data-fid="${esc(it.fileId)}" data-t="Pratinjau">${ic('ext')} Layar penuh</button></div></div>
      <div class="vimgwrap" id="vprev"><div class="spin dark big"></div></div>
      <div class="vfoot"><small class="muted">Diunggah: ${fmtDate(it.tgl)}</small></div></div>
      ${sibl.length ? `<div class="card"><div class="ch"><h3>${ic('clock')} Rekam Jejak Bulan Ini</h3><small class="muted">${esc(mo.name)}</small></div>${sibl.map(f => `<div class="hist"><span class="hi ${f.status}">${ic(f.status === 'diterima' ? 'check' : f.status === 'ditolak' ? 'x' : 'clock')}</span><div><b>Foto ${f.slot} (${esc(slotLabel(f.slot).split('(')[0].trim())})</b><p>${f.status === 'ditolak' ? `<span class="red">Alasan: ${esc(f.alasan)}</span>` : esc(f.status)}</p></div>${badge(f.status)}</div>`).join('')}</div>` : ''}
    </div>
    <div class="vright">
      <div class="card"><div class="dh"><span class="av lg">${esc(initials(m.nama))}</span><div class="grow"><h3>${esc(m.nama)}</h3><p class="muted sm mono">NIM: ${esc(m.nim)}</p><p class="muted sm">${esc(m.prodi || '')}</p></div></div>
        <div class="kv"><div><small>PERIODE</small><b>${it.type === 'foto' ? `Bulan ${it.bulan} — ${esc(mo.name)} ${mo.year}` : 'Laporan Akhir'}</b></div><div><small>SLOT BERKAS</small><b>${it.type === 'foto' ? `Slot ${it.slot} (${esc(slotLabel(it.slot).split('(')[0].trim())})` : 'PDF'}</b></div>
        <div class="w2"><small>MITRA & INSTANSI</small><b>${esc(m.mitra || '-')}</b></div>${m.pemb ? `<div class="w2"><small>DOSEN PEMBIMBING</small><b>${esc(m.pemb)}</b></div>` : ''}</div></div>
      <div class="card"><div class="ch"><h3><span class="dotw"></span> Keputusan Verifikator</h3></div>
        <button class="btn ok lg wide" data-act="vacc">${ic('ok')} Terima ${it.type === 'foto' ? 'Berkas Foto' : 'Laporan'} (Lolos Verifikasi)</button>
        <button class="btn badl lg wide" data-act="vrej">${ic('no')} Tolak & Minta Revisi Mahasiswa</button>
        <small class="muted">⚡ Template alasan penolakan cepat:</small><div class="chips">${chips.map(c => `<button class="chip2" data-act="vchip" data-t="${esc(c)}">+ ${esc(c)}</button>`).join('')}</div>
        <textarea id="vnote" rows="3" data-inp="vnote" placeholder="Catatan penolakan untuk mahasiswa (wajib jika ditolak)…">${esc(vq.note)}</textarea>
        ${list[vq.i + 1] ? `<div class="nextq">Berikutnya: <b>${esc(nameOf(list[vq.i + 1].nim))}</b> (${list[vq.i + 1].type === 'foto' ? 'Foto Slot ' + list[vq.i + 1].slot : 'Laporan PKL'})</div>` : ''}</div>
    </div></div>
  <div class="card"><div class="ch"><h3>${ic('users')} Proses Banyak Sekaligus</h3><div class="two2"><button class="btn out sm" data-act="vselall">${vq.sel.size >= list.length ? 'Batal pilih semua' : 'Pilih semua'}</button>
    <button class="btn ok sm" data-act="vbulk" data-st="diterima" ${vq.sel.size ? '' : 'disabled'}>${ic('check')} Terima (${vq.sel.size})</button><button class="btn bad sm" data-act="vbulk" data-st="ditolak" ${vq.sel.size ? '' : 'disabled'}>${ic('x')} Tolak (${vq.sel.size})</button></div></div>
    <div class="qlist">${list.map((x, i) => `<div class="qrow ${i === vq.i ? 'cur' : ''}"><input type="checkbox" data-chg="vsel" data-k="${esc(x.key)}" ${vq.sel.has(x.key) ? 'checked' : ''} aria-label="pilih"><button data-act="vgo" data-i="${i}"><b>${esc(nameOf(x.nim))}</b><small>${x.type === 'foto' ? `Foto Slot ${x.slot} · ${esc(months()[x.bulan - 1].name)}` : 'Laporan PKL'}</small></button><small class="muted">${ago(x.tgl)}</small></div>`).join('')}</div></div>`;
  loadPreview(it);
  list.slice(vq.i + 1, vq.i + 3).forEach(x => Files.prefetch(x.fileId));
}
async function loadPreview(it) {
  const box = $('#vprev'); if (!box) return;
  try {
    const o = await Files.get(it.fileId); const cur = vCur(); if (!cur || cur.key !== it.key || !$('#vprev')) return;
    $('#vprev').innerHTML = o.mime === 'application/pdf' ? `<iframe src="${o.url}" title="PDF"></iframe>` : `<img id="vimg" src="${o.url}" alt="" style="transform:scale(${VQ().zoom})">`;
  } catch (e) { if ($('#vprev')) $('#vprev').innerHTML = `<p class="red">${esc(e.message)}</p>`; }
}
function vMove(d) { const vq = VQ(), n = vList().length; vq.i = Math.min(Math.max(0, vq.i + d), Math.max(0, n - 1)); vq.zoom = 1; vq.note = ''; renderView('verifikasi'); }
ACT.vprev = () => vMove(-1); ACT.vnext = () => vMove(1);
ACT.vgo = el => { VQ().i = +el.dataset.i; VQ().zoom = 1; VQ().note = ''; renderView('verifikasi'); };
ACT.vfilter = el => { const q = VQ(); q.f = el.dataset.f; q.i = 0; q.sel.clear(); renderView('verifikasi'); };
ACT.vzoom = el => { const q = VQ(), d = +el.dataset.d; q.zoom = d === 0 ? 1 : Math.min(4, Math.max(0.5, q.zoom + d)); const i = $('#vimg'); if (i) i.style.transform = `scale(${q.zoom})`; $('#zv').textContent = Math.round(q.zoom * 100) + '%'; };
INP.vnote = el => { VQ().note = el.value; };
ACT.vchip = el => { const q = VQ(); q.note = (q.note ? q.note + '; ' : '') + el.dataset.t; $('#vnote').value = q.note; };
function announce(it, label, d) { toast(`<b>${esc(itemLabel(it))}</b> diverifikasi (${label})`, label === 'Diterima' ? 'ok' : 'info', { undo: () => undoDecision(d), ms: 4500 }); }
ACT.vacc = () => { const it = vCur(); if (!it) return; const d = queueDecision(it, 'diterima', ''); VQ().note = ''; VQ().zoom = 1; markDirty(); announce(it, 'Diterima', d); };
ACT.vrej = () => {
  const it = vCur(); if (!it) return;
  const note = VQ().note.trim();
  if (!note) { toast('Isi alasan penolakan atau pilih template terlebih dahulu.', 'bad'); const t = $('#vnote'); if (t) t.focus(); return; }
  const d = queueDecision(it, 'ditolak', note); VQ().note = ''; VQ().zoom = 1; markDirty(); announce(it, 'Ditolak', d);
};
CHG.vsel = el => { const s = VQ().sel; el.checked ? s.add(el.dataset.k) : s.delete(el.dataset.k); renderView('verifikasi'); };
ACT.vselall = () => { const q = VQ(), l = vList(); if (q.sel.size >= l.length) q.sel.clear(); else l.forEach(x => q.sel.add(x.key)); renderView('verifikasi'); };
ACT.vbulk = el => {
  const q = VQ(), st = el.dataset.st, items = vList().filter(x => q.sel.has(x.key)); if (!items.length) return;
  const run = note => {
    const ds = items.map(it => queueDecision(it, st, note)); q.sel.clear(); markDirty();
    toast(`<b>${items.length} item</b> diverifikasi (${st === 'diterima' ? 'Diterima' : 'Ditolak'})`, 'ok', { undo: () => ds.forEach(undoDecision), ms: 5000 });
  };
  if (st === 'diterima') run(''); else askReason('Tolak ' + items.length + ' Item Terpilih', run);
};

// ------------------------------- KELOLA DOKUMEN (admin) -------------------------------
function renderDokAdmin() {
  const d = S.dokumen, aktif = d.filter(x => x.aktif).length, pdf = d.filter(x => /pdf/i.test(x.mime || x.nama || '')).length;
  $('#v-dokumen').innerHTML = `
  <div class="pgh row"><div class="grow"><span class="chip"><i></i>Manajemen Berkas · Semester 7</span><h2>Kelola Dokumen & Panduan PKL</h2><p class="muted">Repositori panduan, template laporan, dan surat resmi yang dapat diunduh mahasiswa.</p></div>
    <button class="btn pri" data-act="dedit" data-id="">${ic('plus')} Tambah Dokumen Baru</button></div>
  <div class="stats3"><div class="card stat3"><small>DOKUMEN AKTIF</small><div><b>${aktif}</b><span>Berkas terbit</span></div></div>
    <div class="card stat3"><small>TOTAL DOKUMEN</small><div><b>${d.length}</b><span>${d.length - aktif} nonaktif</span></div></div>
    <div class="card stat3"><small>DISTRIBUSI FORMAT</small><div><b>${pdf}</b><span>PDF · ${d.length - pdf} lainnya</span></div></div></div>
  <div class="card tcard"><div class="tscroll"><table class="tbl dtbl"><thead><tr><th>Urutan</th><th>Judul Dokumen</th><th class="hm">Berkas</th><th>Aktif</th><th>Diperbarui</th><th></th></tr></thead><tbody>
    ${d.length ? d.map((x, i) => `<tr class="${x.aktif ? '' : 'off'}"><td><div class="ord"><button class="icb" data-act="dmove" data-id="${esc(x.id)}" data-d="-1" ${i === 0 ? 'disabled' : ''}>${ic('up')}</button><button class="icb" data-act="dmove" data-id="${esc(x.id)}" data-d="1" ${i === d.length - 1 ? 'disabled' : ''}>${ic('down')}</button></div></td>
      <td><b>${esc(x.judul)}</b> <span class="b info">${esc(x.kategori)}</span><small class="muted block">${esc(x.keterangan)}</small></td>
      <td class="hm mono">${x.fileId ? esc(x.nama || 'berkas') + (x.kb ? ' · ' + fmtKB(x.kb * 1024) : '') : (x.link ? 'Tautan' : '-')}</td>
      <td><label class="sw"><input type="checkbox" data-chg="dtoggle" data-id="${esc(x.id)}" ${x.aktif ? 'checked' : ''}><i></i></label></td><td class="muted">${fmtDate(x.tgl, true)}</td>
      <td><button class="btn ghost sm" data-act="dedit" data-id="${esc(x.id)}">${ic('edit')} Ubah</button></td></tr>`).join('') : `<tr><td colspan="6" class="empty">Belum ada dokumen. Klik “Tambah Dokumen Baru”.</td></tr>`}</tbody></table></div></div>`;
}
let reorderT;
ACT.dmove = el => {
  const l = S.dokumen, i = l.findIndex(x => x.id === el.dataset.id), j = i + +el.dataset.d; if (j < 0 || j >= l.length) return;
  [l[i], l[j]] = [l[j], l[i]]; l.forEach((x, k) => x.urutan = k + 1); markDirty('dokumen');
  clearTimeout(reorderT); reorderT = setTimeout(() => bg(() => API.callRetry('reorderDokumen', { ids: S.dokumen.map(x => x.id) })), 900);
};
CHG.dtoggle = el => {
  const x = S.dokumen.find(d => d.id === el.dataset.id); x.aktif = el.checked; markDirty('dokumen');
  bg(() => API.callRetry('saveDokumen', { doc: { id: x.id, judul: x.judul, keterangan: x.keterangan, kategori: x.kategori, aktif: x.aktif } }), e => { x.aktif = !x.aktif; markDirty('dokumen'); toast(esc(e.message), 'bad'); });
  toast(x.aktif ? 'Dokumen diaktifkan.' : 'Dokumen dinonaktifkan (tersembunyi dari mahasiswa).', 'ok', { ms: 2000 });
};
ACT.dedit = el => {
  const x = S.dokumen.find(d => d.id === el.dataset.id) || { judul: '', keterangan: '', kategori: 'Pedoman', aktif: true, link: '' };
  const cats = [...new Set(['Pedoman', 'Template', 'Evaluasi', 'Surat', ...S.dokumen.map(d => d.kategori)])];
  const m = modal(`<div class="mh2"><h3>${x.id ? 'Ubah' : 'Tambah'} Dokumen</h3><button class="icb" data-close>${ic('x')}</button></div>
    <label class="lb">Judul</label><div class="inp"><input id="dj" value="${esc(x.judul)}" placeholder="mis. Buku Panduan PKL 2026/2027"></div>
    <label class="lb">Kategori</label><div class="inp"><input id="dk" list="dkl" value="${esc(x.kategori)}"><datalist id="dkl">${cats.map(c => `<option>${esc(c)}</option>`).join('')}</datalist></div>
    <label class="lb">Keterangan singkat</label><textarea id="dket" rows="2">${esc(x.keterangan)}</textarea>
    <label class="lb">Berkas ${x.fileId ? '(sudah ada: ' + esc(x.nama || 'berkas') + ' — pilih untuk mengganti)' : ''}</label><input type="file" id="dfile">
    <label class="lb">atau tempel tautan Google Drive</label><div class="inp"><input id="dlink" value="${esc(x.link || '')}" placeholder="https://drive.google.com/file/d/..."></div>
    <div class="two"><button class="btn ghost" data-close>Batal</button><button class="btn pri" id="dsave">${ic('check')} Simpan</button></div>`);
  $('#dsave', m).onclick = async () => {
    const judul = $('#dj', m).value.trim(); if (!judul) return toast('Judul wajib diisi.', 'bad');
    const f = $('#dfile', m).files[0]; if (f && f.size > 12 * 1048576) return toast('Ukuran berkas maksimal 12 MB.', 'bad');
    const doc = { id: x.id || '', judul, kategori: $('#dk', m).value.trim() || 'Pedoman', keterangan: $('#dket', m).value.trim(), link: $('#dlink', m).value.trim(), aktif: x.aktif !== false };
    const payload = { doc, file: f ? { name: f.name, mime: f.type, data: await blobToB64(f) } : null };
    m.close();
    let row = x.id ? x : { id: 'tmp' + Date.now(), urutan: S.dokumen.length + 1, fileId: '', tgl: new Date().toISOString() };
    Object.assign(row, { judul, kategori: doc.kategori, keterangan: doc.keterangan, aktif: doc.aktif, link: doc.link, tgl: new Date().toISOString() });
    if (f) { row.nama = f.name; row.kb = Math.round(f.size / 1024); row.mime = f.type; }
    if (!x.id) S.dokumen.push(row); markDirty('dokumen'); toast('Dokumen disimpan.');
    bg(async () => { const r = await API.callRetry('saveDokumen', payload); Object.assign(row, r.doc); markDirty('dokumen'); },
       e => { toast(esc(e.message), 'bad'); refresh(true); });
  };
};

// ------------------------------- PENGATURAN (admin) -------------------------------
const SETK = ['src_surat_url', 'src_surat_sheet', 'src_surat_kata', 'src_surat_status', 'src_angkatan', 'src_rekap_url', 'src_rekap_sheet', 'map', 'bulan_mulai', 'tahun_mulai', 'jumlah_bulan', 'bobot_dosen', 'tanggal_simulasi', 'label_1', 'label_2', 'label_3', 'instruksi_1', 'instruksi_2', 'instruksi_3'];
function draft() { return S.ui.set || (S.ui.set = Object.fromEntries(SETK.map(k => [k, S.settings[k] ?? '']))); }
const isDirtySet = () => SETK.some(k => String(draft()[k]) !== String(S.settings[k] ?? ''));
function previewMonths(s) {
  const n = +s.jumlah_bulan || 3, now = s.tanggal_simulasi ? new Date(s.tanggal_simulasi + 'T12:00:00') : nowDate(), out = [];
  for (let i = 0; i <= n; i++) { const st = new Date(+s.tahun_mulai, +s.bulan_mulai - 1 + i, 1); out.push({ i, name: BULAN[st.getMonth()], year: st.getFullYear(), open: now >= st, lap: i === n }); }
  return out;
}
function renderPengaturan() {
  const s = draft(), tk = S.tokens, ex = S.mahasiswa.length * previewMonths(s).filter(m => m.open && !m.lap).length * 3;
  const acc = S.fotos.filter(f => f.status === 'diterima').length, wait = S.fotos.filter(f => f.status === 'menunggu').length, pct = ex ? Math.min(100, Math.round(acc / ex * 100)) : 0;
  $('#v-pengaturan').innerHTML = `
  <div class="pgh row"><h2 class="grow">Pengaturan Sistem PKL & Magang</h2><span id="setd" class="b wait" style="display:${isDirtySet() ? '' : 'none'}">Perubahan belum disimpan</span>
    <button class="btn ghost" data-act="setreset">Batal Perubahan</button><button class="btn pri" data-act="setsave">${ic('ok')} Simpan Pengaturan</button></div>
  <div class="grid2 top">
   <div class="stack">
    <div class="card"><div class="ch"><h3>${ic('clock')} Periode Magang & Pelaporan Bertahap</h3><span class="b ok">Kalender Aktif</span></div>
      <div class="fgrid"><div><label class="lb">Bulan Mulai Magang</label><select data-inp="set" data-k="bulan_mulai">${BULAN.map((b, i) => `<option value="${i + 1}" ${+s.bulan_mulai === i + 1 ? 'selected' : ''}>${b} (Bulan ${i + 1})</option>`).join('')}</select></div>
      <div><label class="lb">Tahun Mulai</label><input type="number" data-inp="set" data-k="tahun_mulai" value="${esc(s.tahun_mulai)}"></div>
      <div><label class="lb">Durasi Periode Magang</label><select data-inp="set" data-k="jumlah_bulan">${[1, 2, 3, 4, 5, 6].map(n => `<option value="${n}" ${+s.jumlah_bulan === n ? 'selected' : ''}>${n} Bulan</option>`).join('')}</select></div>
      <div><label class="lb">Periode Aktif (tahun akademik)</label><input value="${esc(S.settings.tahun_akademik)}" disabled></div>
      <div><label class="lb">Bobot Nilai Dosen (%)</label><input type="number" min="0" max="100" data-inp="set" data-k="bobot_dosen" value="${esc(s.bobot_dosen)}"></div>
      <div><label class="lb">Simulasi tanggal (uji coba)</label><input type="date" data-inp="set" data-k="tanggal_simulasi" value="${esc(s.tanggal_simulasi)}"></div></div>
      <p class="muted sm">Jendela Laporan PKL & Nilai otomatis terbuka pada bulan setelah periode magang berakhir. Kosongkan simulasi tanggal untuk memakai tanggal asli.</p>
      <label class="lb">Simulasi jadwal pengunggahan mahasiswa</label><div class="sim" id="simrow"></div></div>
    <div class="card"><div class="ch"><h3>${ic('camera')} Kustomisasi Label Slot Foto Kegiatan</h3><span class="b mute">Wajib 3 Sudut</span></div>
      ${[1, 2, 3].map(i => `<div class="slotset"><span class="num">${i}</span><div class="grow"><label class="lb">Label Slot Foto #${i}</label><input data-inp="set" data-k="label_${i}" value="${esc(s['label_' + i])}"><label class="lb">Instruksi Mahasiswa</label><input data-inp="set" data-k="instruksi_${i}" value="${esc(s['instruksi_' + i])}"></div></div>`).join('')}
      <p class="muted sm">${ic('shield')} Format JPG/PNG · otomatis dikompres di perangkat mahasiswa sebelum dikirim.</p></div>
   </div>
   <div class="stack">
    <div class="card"><div class="ch"><h3>${ic('refresh')} Sumber Data Sinkronisasi</h3><span class="b ${s.src_surat_url ? 'ok' : 'wait'}">${s.src_surat_url ? 'Tautan terisi' : 'Belum diisi'}</span></div>
      <p class="muted sm">Yang masuk hanya mahasiswa yang ada di <b>surat Konfirmasi Magang yang disetujui</b> <b>dan sudah punya dosen pembimbing</b>. Anggota kelompok dibaca otomatis dari isi surat.</p>
      <label class="lb">Tautan spreadsheet Aplikasi Surat (wajib)</label><div class="inp"><input data-inp="set" data-k="src_surat_url" value="${esc(s.src_surat_url)}" placeholder="https://docs.google.com/spreadsheets/d/…"></div>
      <div class="fgrid"><div><label class="lb">Nama sheet (opsional)</label><input data-inp="set" data-k="src_surat_sheet" value="${esc(s.src_surat_sheet)}" placeholder="sheet pertama"></div>
        <div><label class="lb">Jenis surat (kata kunci)</label><input data-inp="set" data-k="src_surat_kata" value="${esc(s.src_surat_kata)}"></div></div>
      <label class="lb">Status surat yang sah (kosongkan = semua)</label><input data-inp="set" data-k="src_surat_status" value="${esc(s.src_surat_status)}" placeholder="DISETUJUI">
      <label class="lb">Tautan spreadsheet Rekap Mahasiswa (opsional, untuk memastikan semester 7)</label><div class="inp"><input data-inp="set" data-k="src_rekap_url" value="${esc(s.src_rekap_url)}" placeholder="https://docs.google.com/spreadsheets/d/…"></div>
      <div class="fgrid"><div><label class="lb">Nama sheet Rekap</label><input data-inp="set" data-k="src_rekap_sheet" value="${esc(s.src_rekap_sheet)}" placeholder="sheet pertama"></div><div><label class="lb">Tahun masuk angkatan (opsional)</label><input data-inp="set" data-k="src_angkatan" value="${esc(s.src_angkatan)}" placeholder="mis. 2023"></div></div>
      <div class="note info">${ic('refresh')}<p><b>Terakhir disinkronkan</b><br>${S.settings.sync_last ? fmtDate(S.settings.sync_last) + ' — ' + esc(S.settings.sync_msg) : 'Belum pernah. ' + S.mahasiswa.length + ' mahasiswa aktif saat ini.'}<br><small>Otomatis tiap hari 02:00 WIB.</small></p></div>
      <div class="stack" style="gap:8px;margin-top:10px"><button class="btn out wide" data-act="srccols">${ic('sliders')} 1. Uji Tautan & Atur Kolom</button>
        <button class="btn out wide" data-act="syncpreview">${ic('eye')} 2. Pratinjau Hasil (tanpa mengubah data)</button>
        <button class="btn pri wide" data-act="syncnow">${ic('refresh')} 3. Sinkronkan Sekarang</button></div></div>
    <div class="card"><div class="ch"><h3>${ic('clock')} Periode / Tahun Ajaran</h3><span class="b ok">Aktif: ${esc(S.settings.tahun_akademik)}</span></div>
      <p class="muted sm">Aplikasi dipakai ulang tiap tahun. Saat angkatan baru mulai, tekan tombol di bawah: data periode ini diarsipkan (tetap bisa dilihat di Rekap → pilih periode) dan periode baru mulai bersih.</p>
      <button class="btn out wide" data-act="perbaru">${ic('plus')} Mulai Periode Baru…</button></div>
    <div class="card"><div class="ch"><h3>Ringkasan Validasi Berkas Berjalan</h3></div>
      <div class="ring" style="--p:${pct}"><b>${pct}%</b><small>Tervalidasi</small></div>
      <div class="kv"><div><small>Foto diterima</small><b>${acc} / ${ex || '–'}</b></div><div><small>Menunggu review</small><b>${wait}</b></div></div></div>
   </div></div>
  <div class="card"><div class="ch"><div><h3>${ic('key')} Manajemen Token Akses Dosen (Read-Only)</h3><p class="muted sm">Token unik untuk dosen pembimbing — tanpa password, hanya melihat.</p></div><button class="btn out sm" data-act="tkadd">${ic('plus')} Buat Token Dosen Baru</button></div>
    <div class="tscroll"><table class="tbl"><thead><tr><th>Nama Dosen</th><th class="hm">Program Studi</th><th>Token Akses</th><th>Status</th><th class="hm">Terakhir Digunakan</th><th></th></tr></thead><tbody>
    ${tk.length ? tk.map(t => `<tr class="${t.aktif ? '' : 'off'}"><td><div class="who2"><span class="av">${esc(initials(t.nama))}</span><div><b>${esc(t.nama)}</b><small>${t.nip ? 'NIP. ' + esc(t.nip) : ''}</small></div></div></td><td class="hm">${esc(t.prodi)}</td>
      <td><code class="tok">${esc(t.token)}</code></td><td>${t.aktif ? '<span class="b ok">Aktif</span>' : '<span class="b mute">Dinonaktifkan</span>'}</td><td class="hm muted">${t.terakhir ? fmtDate(t.terakhir) : '–'}</td>
      <td class="acts"><button class="icb" title="Salin" data-act="tkcopy" data-t="${esc(t.token)}">${ic('copy')}</button><button class="icb" title="Token baru" data-act="tkop" data-op="regen" data-t="${esc(t.token)}">${ic('refresh')}</button><button class="icb" title="${t.aktif ? 'Nonaktifkan' : 'Aktifkan'}" data-act="tkop" data-op="toggle" data-t="${esc(t.token)}">${ic(t.aktif ? 'lock' : 'check')}</button><button class="icb" title="Hapus" data-act="tkop" data-op="delete" data-t="${esc(t.token)}">${ic('trash')}</button></td></tr>`).join('')
      : `<tr><td colspan="6" class="empty">Belum ada token dosen.</td></tr>`}</tbody></table></div></div>`;
  simRow();
}
function simRow() {
  const el = $('#simrow'); if (!el) return;
  el.innerHTML = previewMonths(draft()).map(m => `<div class="sm1 ${m.lap ? 'lap' : ''}"><small>${m.lap ? 'Evaluasi Akhir' : 'Bulan ' + String(m.i + 1).padStart(2, '0')}</small><b>${m.name}</b><span class="${m.open ? 'okt' : 'mt'}">${m.open ? (m.lap ? 'Laporan & Nilai (Aktif)' : 'Terbuka (Aktif)') : (ic('lock') + (m.lap ? 'Laporan & Nilai' : 'Terkunci'))}</span></div>`).join('');
}
INP.set = el => { draft()[el.dataset.k] = el.value; simRow(); const d = $('#setd'); if (d) d.style.display = isDirtySet() ? '' : 'none'; };
ACT.setreset = () => { S.ui.set = null; renderView('pengaturan'); toast('Perubahan dibatalkan.', 'info', { ms: 1800 }); };
ACT.setsave = () => {
  const s = draft(), prev = { ...S.settings };
  const v = { ...s, bulan_mulai: +s.bulan_mulai, tahun_mulai: +s.tahun_mulai, jumlah_bulan: +s.jumlah_bulan, bobot_dosen: Math.min(100, Math.max(0, +s.bobot_dosen || 0)) };
  Object.assign(S.settings, v); S.ui.set = null; S.ver++; S.ui.open = null; markDirty(); toast('Pengaturan disimpan dan langsung berlaku.');
  bg(() => API.callRetry('saveSettings', { settings: v }), e => { S.settings = prev; markDirty(); toast('Gagal menyimpan: ' + esc(e.message), 'bad'); });
};
ACT.tkcopy = el => { navigator.clipboard?.writeText(el.dataset.t).then(() => toast('Token disalin.', 'ok', { ms: 1500 })).catch(() => toast('Salin manual: ' + esc(el.dataset.t), 'info')); };
ACT.tkadd = () => {
  const m = modal(`<div class="mh2"><h3>Buat Token Dosen Baru</h3><button class="icb" data-close>${ic('x')}</button></div>
    <label class="lb">Nama dosen</label><div class="inp"><input id="tn" placeholder="Dr. Nama, M.T."></div>
    <label class="lb">Program studi</label><div class="inp"><input id="tp"></div><label class="lb">NIP (opsional)</label><div class="inp"><input id="tnip"></div>
    <div class="two"><button class="btn ghost" data-close>Batal</button><button class="btn pri" id="tsave">${ic('key')} Buat Token</button></div>`);
  $('#tsave', m).onclick = async e => {
    const b = e.currentTarget, nama = $('#tn', m).value.trim(); if (!nama) return toast('Nama dosen wajib diisi.', 'bad');
    b.disabled = true; b.innerHTML = '<span class="spin"></span> Membuat…';
    try { const r = await API.callRetry('createToken', { nama, prodi: $('#tp', m).value.trim(), nip: $('#tnip', m).value.trim() }); S.tokens.push(r.token); m.close(); markDirty('pengaturan'); toast('Token dibuat: <b>' + esc(r.token.token) + '</b>', 'ok', { ms: 7000 }); }
    catch (er) { toast(esc(er.message), 'bad'); b.disabled = false; b.innerHTML = ic('key') + ' Buat Token'; }
  };
};
ACT.tkop = async el => {
  const t = S.tokens.find(x => x.token === el.dataset.t), op = el.dataset.op; if (!t) return;
  if (op === 'delete') { if (!confirm('Hapus token ' + t.token + '? Dosen tidak akan bisa masuk lagi.')) return; S.tokens = S.tokens.filter(x => x !== t); markDirty('pengaturan'); return bg(() => API.callRetry('updateToken', { token: t.token, op }), e => { toast(esc(e.message), 'bad'); refresh(true); }); }
  if (op === 'toggle') { t.aktif = !t.aktif; markDirty('pengaturan'); return bg(() => API.callRetry('updateToken', { token: el.dataset.t, op }), e => { t.aktif = !t.aktif; markDirty('pengaturan'); toast(esc(e.message), 'bad'); }); }
  if (op === 'regen') { if (!confirm('Buat token baru untuk ' + t.nama + '? Token lama langsung tidak berlaku.')) return;
    el.disabled = true; try { const r = await API.callRetry('updateToken', { token: t.token, op }); Object.assign(t, r.token); markDirty('pengaturan'); toast('Token baru: <b>' + esc(r.token.token) + '</b>', 'ok', { ms: 7000 }); } catch (e) { toast(esc(e.message), 'bad'); el.disabled = false; } }
};

// ------------------------------- SUMBER DATA: uji, pratinjau, sinkron, periode baru -------------------------------
async function saveSettingsNow() {
  if (!isDirtySet()) return;
  const s = draft(), v = { ...s, bulan_mulai: +s.bulan_mulai, tahun_mulai: +s.tahun_mulai, jumlah_bulan: +s.jumlah_bulan, bobot_dosen: Math.min(100, Math.max(0, +s.bobot_dosen || 0)) };
  const r = await API.callRetry('saveSettings', { settings: v });
  Object.assign(S.settings, r.settings); S.ui.set = null; S.ver++; markDirty();
}
const SRCF = {
  surat: [['perihal', 'Kolom jenis surat *'], ['status', 'Kolom status surat'], ['json', 'Kolom data JSON (anggota, instansi, dosen)'], ['nim', 'Kolom NIM (cadangan)'], ['tanggal', 'Kolom tanggal'], ['mitra', 'Kolom tempat magang (jika bukan di JSON)'], ['dosen', 'Kolom dosen pembimbing (jika bukan di JSON)']],
  rekap: [['nim', 'NIM *'], ['nama', 'Nama'], ['prodi', 'Program studi'], ['status', 'Status mahasiswa (Aktif/…)'], ['angkatan', 'Tahun masuk'], ['semester', 'Semester (jika ada)']] };
const SRCP = [['p_mitra', 'Di dalam JSON → tempat magang', 'instansi'], ['p_dosen', 'Di dalam JSON → dosen pembimbing', '_admin.NAMA_DOSEN_PEMBIMBING'], ['p_anggota', 'Di dalam JSON → daftar anggota', 'anggotaAcc']];
function parseMapD() { try { return JSON.parse(draft().map || '{}') || {}; } catch (e) { return {}; } }
ACT.srccols = async () => {
  const d = draft(), kinds = [];
  if (d.src_surat_url) kinds.push('surat'); if (d.src_rekap_url) kinds.push('rekap');
  if (!kinds.length) return toast('Isi tautan Aplikasi Surat terlebih dahulu.', 'bad');
  const m = modal(`<div class="mh2"><h3>Uji Tautan & Atur Kolom</h3><button class="icb" data-close>${ic('x')}</button></div><div id="srcbody"><div class="center"><span class="spin dark big"></span><p class="muted">Menghubungi spreadsheet…</p></div></div>`, 'wide');
  const st = {}, map = parseMapD();
  const collect = k => {
    const o = {};
    SRCF[k].forEach(([f]) => { const el = $('select[data-fld="' + k + '.' + f + '"]', m); if (el) o[f] = el.value || '-'; });
    if (k === 'surat') SRCP.forEach(([f, , def]) => { const el = $('input[data-path="' + f + '"]', m); const v = el ? el.value.trim() : ''; if (v && v !== def) o[f] = v; });
    return o;
  };
  const load = async kind => {
    try { st[kind] = await API.call('previewSumber', { kind, url: d['src_' + kind + '_url'], sheet: d['src_' + kind + '_sheet'], map, kata: d.src_surat_kata, status: d.src_surat_status }); }
    catch (e) { st[kind] = { err: e.message }; }
  };
  const draw = () => {
    $('#srcbody', m).innerHTML = kinds.map(k => {
      const p = st[k], ttl = k === 'surat' ? 'Aplikasi Surat' : 'Rekap Mahasiswa';
      if (p.err) return `<div class="alert bad"><div><b>${ttl}</b><p>${esc(p.err)}</p></div></div>`;
      const c = p.contoh, mp = map[k] || {};
      return `<div class="dm"><h4>${ttl}: ${esc(p.judul)} <span class="b ok">${p.total} baris</span></h4>
        <label class="lb">Sheet</label><select data-sheet="${k}">${p.sheets.map(n => `<option ${n === p.sheet ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
        <div class="fgrid">${SRCF[k].map(([f, lb]) => `<div><label class="lb">${lb}</label><select data-fld="${k}.${f}"><option value="">(tidak dipakai)</option>${p.headers.map(h => `<option ${h === p.detected[f] ? 'selected' : ''}>${esc(h)}</option>`).join('')}</select></div>`).join('')}</div>
        ${k === 'surat' ? `<div class="fgrid">${SRCP.map(([f, lb, def]) => `<div><label class="lb">${lb}</label><input data-path="${f}" value="${esc(mp[f] || def)}"></div>`).join('')}</div>
          ${c ? (c.ok ? `<div class="note info">${ic('check')}<p><b>Contoh hasil baca (${c.baris} surat cocok):</b><br>Tempat magang: <b>${esc(c.instansi || '— kosong —')}</b><br>Dosen pembimbing: <b>${esc(c.dosen || '— kosong —')}</b><br>Anggota: <b>${c.anggota}</b>${c.nama.length ? ' (' + esc(c.nama.join(', ')) + '…)' : ''}${c.msg ? '<br><span class="red">' + esc(c.msg) + '</span>' : ''}</p></div>` : `<div class="alert bad sm">${ic('alert')}<div><p>${esc(c.msg)}</p></div></div>`) : ''}` : ''}
        <button class="btn out sm" data-recheck="${k}" style="margin-top:8px">${ic('refresh')} Cek ulang dengan pilihan ini</button>
        <div class="tscroll" style="margin-top:10px"><table class="tbl" style="min-width:0;font-size:12px"><thead><tr>${p.headers.slice(0, 8).map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${p.sample.map(rw => `<tr>${rw.slice(0, 8).map(cc => `<td>${esc(cc)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
    }).join('') + `<div class="two"><button class="btn ghost" data-close>Batal</button><button class="btn pri" id="srcsave">${ic('check')} Simpan Pengaturan Kolom</button></div>`;
    $$('select[data-sheet]', m).forEach(sel => sel.onchange = async () => { const k = sel.dataset.sheet; d['src_' + k + '_sheet'] = sel.value; delete map[k]; $('#srcbody', m).style.opacity = .5; await load(k); $('#srcbody', m).style.opacity = 1; draw(); });
    $$('[data-recheck]', m).forEach(b => b.onclick = async () => { const k = b.dataset.recheck; map[k] = collect(k); b.disabled = true; await load(k); draw(); });
    const sv = $('#srcsave', m); if (sv) sv.onclick = async () => {
      const out = {}; let warn = '';
      kinds.forEach(k => { if (st[k].err) return; out[k] = collect(k); });
      if (out.surat && out.surat.perihal === '-') warn = 'Kolom jenis surat';
      else if (out.surat && out.surat.json === '-' && out.surat.nim === '-') warn = 'Kolom data JSON atau NIM';
      else if (out.rekap && out.rekap.nim === '-') warn = 'NIM di Rekap';
      if (warn) return toast('Wajib dipilih: ' + esc(warn), 'bad');
      d.map = JSON.stringify(out);
      sv.disabled = true; sv.innerHTML = '<span class="spin"></span> Menyimpan…';
      try { await saveSettingsNow(); m.close(); toast('Pengaturan sumber & kolom tersimpan. Lanjut klik Pratinjau Hasil.'); } catch (e) { toast(esc(e.message), 'bad'); sv.disabled = false; sv.innerHTML = 'Simpan Pengaturan Kolom'; }
    };
  };
  await Promise.all(kinds.map(load)); draw();
};
const syncReport = r => `
  <div class="stats3"><div class="card stat3 ok"><small>LAYAK MASUK</small><div><b>${r.layak}</b><span>mahasiswa</span></div></div>
    <div class="card stat3 wait"><small>DILEWATI</small><div><b>${r.dilewati}</b><span>belum lengkap</span></div></div>
    <div class="card stat3 mute"><small>DINONAKTIFKAN</small><div><b>${r.akanDiarsipkan}</b><span>tidak ada di sumber</span></div></div></div>
  <p class="muted sm">Penyaringan: ${r.funnel.total} baris surat → ${r.funnel.jenis} berjenis “${esc(S.settings.src_surat_kata)}” → ${r.funnel.status} berstatus sah → ${r.funnel.anggota} anggota ditemukan · periode ${esc(r.periode)}</p>
  ${r.layak === 0 ? `<div class="alert bad sm">${ic('alert')}<div><p>Belum ada yang layak. Lihat angka penyaringan di atas untuk tahu tahap yang menghabiskan data (jenis, status, atau anggota), lalu cek lewat “Uji Tautan & Atur Kolom”.</p></div></div>` : ''}
  ${r.skip.length ? `<h4 style="margin-top:12px">Dilewati (perlu dilengkapi di aplikasi surat/rekap)</h4><div class="tscroll" style="max-height:240px"><table class="tbl" style="min-width:0;font-size:12.5px"><tbody>${r.skip.map(x => `<tr><td class="mono">${esc(x.nim)}</td><td>${esc(x.nama)}</td><td class="red">${esc(x.alasan)}</td></tr>`).join('')}</tbody></table></div>${r.dilewati > r.skip.length ? `<small class="muted">…dan ${r.dilewati - r.skip.length} lainnya</small>` : ''}` : ''}
  ${r.sample.length ? `<h4 style="margin-top:12px">Contoh yang masuk</h4><ul class="muted sm" style="padding-left:18px">${r.sample.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}`;
ACT.syncpreview = async el => {
  const old = el.innerHTML; el.disabled = true; el.innerHTML = '<span class="spin dark"></span> Memeriksa…';
  try {
    await saveSettingsNow();
    const r = await API.call('syncNow', { dry: true });
    const m = modal(`<div class="mh2"><h3>Pratinjau Sinkronisasi</h3><button class="icb" data-close>${ic('x')}</button></div>${syncReport(r)}
      <div class="two"><button class="btn ghost" data-close>Tutup</button><button class="btn pri" id="pvapply" ${r.layak ? '' : 'disabled'}>${ic('refresh')} Terapkan Sekarang</button></div>`, 'wide');
    $('#pvapply', m).onclick = () => { m.close(); ACT.syncnow($('[data-act=syncnow]')); };
  } catch (e) { toast(esc(e.message), 'bad', { ms: 9000 }); }
  el.disabled = false; el.innerHTML = old;
};
ACT.syncnow = async el => {
  if (!el) return; const old = el.innerHTML; el.disabled = true; el.innerHTML = '<span class="spin dark"></span> Menyinkronkan…';
  try {
    await saveSettingsNow();
    const r = await API.call('syncNow', {}); S.settings.sync_last = r.last; S.settings.sync_msg = r.msg;
    await refresh(true);
    toast(r.layak ? 'Sinkronisasi selesai: ' + esc(r.msg) + (r.dilewati ? ' Buka “Pratinjau Hasil” untuk melihat yang dilewati.' : '') : 'Tidak ada mahasiswa yang layak masuk. Buka “Pratinjau Hasil” untuk melihat penyebabnya.', r.layak ? 'ok' : 'bad', { ms: 8000 });
  } catch (e) { toast(esc(e.message), 'bad', { ms: 9000 }); }
  el.disabled = false; el.innerHTML = old;
};
ACT.perbaru = () => {
  const cur = String(S.settings.tahun_akademik), mm = cur.match(/(\d{4})\s*\/\s*(\d{4})/), sug = mm ? (+mm[1] + 1) + '/' + (+mm[2] + 1) : '';
  const m = modal(`<div class="mh2"><h3>Mulai Periode Baru</h3><button class="icb" data-close>${ic('x')}</button></div>
    <div class="alert wait">${ic('alert')}<div><p>Periode <b>${esc(cur)}</b> akan diarsipkan (baca-saja). Mahasiswa periode baru dimasukkan lewat sinkronisasi. Foto, laporan, dan nilai lama tidak dihapus.</p></div></div>
    <label class="lb">Nama periode baru</label><div class="inp"><input id="pn" value="${esc(sug)}" placeholder="2027/2028"></div>
    <div class="fgrid"><div><label class="lb">Bulan mulai magang</label><select id="pb">${BULAN.map((b, i) => `<option value="${i + 1}" ${+S.settings.bulan_mulai === i + 1 ? 'selected' : ''}>${b}</option>`).join('')}</select></div>
      <div><label class="lb">Tahun mulai</label><input type="number" id="pt" value="${+S.settings.tahun_mulai + 1}"></div>
      <div><label class="lb">Durasi (bulan)</label><select id="pj">${[1, 2, 3, 4, 5, 6].map(n => `<option ${+S.settings.jumlah_bulan === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>
    <div class="two"><button class="btn ghost" data-close>Batal</button><button class="btn bad" id="pgo">${ic('check')} Arsipkan & Mulai Periode Baru</button></div>`);
  $('#pgo', m).onclick = async e => {
    const b = e.currentTarget, nama = $('#pn', m).value.trim(); if (!nama) return toast('Nama periode wajib diisi.', 'bad');
    b.disabled = true; b.innerHTML = '<span class="spin"></span> Memproses…';
    try {
      await API.callRetry('startPeriode', { periode: nama, bulan_mulai: +$('#pb', m).value, tahun_mulai: +$('#pt', m).value, jumlah_bulan: +$('#pj', m).value });
      m.close(); S.ui = {}; await refresh(true); toast('Periode ' + esc(nama) + ' dimulai. Jalankan sinkronisasi untuk memasukkan mahasiswa.', 'ok', { ms: 7000 });
    } catch (er) { toast(esc(er.message), 'bad'); b.disabled = false; b.innerHTML = ic('check') + ' Arsipkan & Mulai Periode Baru'; }
  };
};
