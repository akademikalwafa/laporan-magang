// Helper UI generik: ikon, escape, toast, modal, kompresi gambar, format.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ICONS = {
  home: '<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M9 7h6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-3.5 3.2-5.5 6.5-5.5s6 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .6 3.3 2.4 3.6 5.2"/>',
  ok: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
  no: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 16V5M7 9l5-5 5 5M5 20h14"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  logout: '<path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14-4M4 4v4h4M4 13a8 8 0 0 0 14 4M20 20v-4h-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  right: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  left: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  chl: '<path d="M15 6l-6 6 6 6"/>',
  chr: '<path d="M9 6l6 6-6 6"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 6l3 3"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>',
  zin: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M11 8v6M8 11h6"/>',
  zout: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M8 11h6"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  building: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
  wifi: '<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5v.1"/>'
};
const ic = (n, c = '') => `<svg class="ic ${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
function fmtDate(iso, short) {
  if (!iso) return '-';
  const d = new Date(iso); if (isNaN(d)) return '-';
  const o = short ? { day: '2-digit', month: 'short' } : { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  return d.toLocaleString('id-ID', o).replace(/\./g, ':').replace(/(\d{2}):(\d{2})$/, '$1.$2');
}
function ago(iso) {
  if (!iso) return '';
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return 'Baru saja'; if (m < 60) return m + ' menit lalu';
  const h = Math.round(m / 60); if (h < 24) return h + ' jam lalu';
  return fmtDate(iso, true);
}
const initials = n => String(n || '?').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

function badge(st, label) {
  const m = { diterima: ['ok', 'check', 'Diterima'], ditolak: ['bad', 'x', 'Ditolak'], menunggu: ['wait', 'clock', 'Menunggu'] }[st] || ['mute', 'clock', label || 'Belum'];
  return `<span class="b ${m[0]}">${ic(m[1])}${esc(label || m[2])}</span>`;
}

// ---- Toast ----
function toast(msg, type = 'ok', opt = {}) {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = `<span class="ti">${ic(type === 'bad' ? 'alert' : type === 'info' ? 'refresh' : 'check')}</span><div class="tb">${msg}</div>${opt.undo ? '<button class="tu">Batalkan</button>' : ''}<button class="tx" aria-label="Tutup">${ic('x')}</button>`;
  $('#toasts').appendChild(el);
  const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 200); };
  el.querySelector('.tx').onclick = close;
  if (opt.undo) el.querySelector('.tu').onclick = () => { opt.undo(); close(); };
  setTimeout(close, opt.ms || (type === 'bad' ? 6000 : 3500));
  while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove();
}

// ---- Modal ----
function modal(html, cls = '') {
  const root = $('#modal-root'), el = document.createElement('div');
  el.className = 'modal-bg';
  el.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true">${html}</div>`;
  root.appendChild(el);
  const close = () => { el.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  el.addEventListener('mousedown', e => { if (e.target === el) close(); });
  el.close = close;
  el.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
  return el;
}

// ---- Berkas ----
const blobToB64 = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(b); });
const fmtKB = b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';

// Kompres di perangkat: maks sisi 1600px, JPEG, target < ~900 KB (turunkan kualitas bertahap)
async function compressImage(file, maxSide = 1600, target = 900 * 1024) {
  let bmp;
  try { bmp = await createImageBitmap(file); }
  catch (e) {
    bmp = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  }
  let w = bmp.width, h = bmp.height; const sc = Math.min(1, maxSide / Math.max(w, h));
  w = Math.round(w * sc); h = Math.round(h * sc);
  const c = document.createElement('canvas'); let q = 0.82, blob;
  for (let i = 0; i < 6; i++) {
    c.width = w; c.height = h;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(bmp, 0, 0, w, h);
    blob = await new Promise(r => c.toBlob(r, 'image/jpeg', q));
    if (blob.size <= target) break;
    if (q > 0.5) q -= 0.12; else { w = Math.round(w * 0.82); h = Math.round(h * 0.82); }
  }
  return { blob, w, h };
}

function pickFile(accept, cb) {
  const i = document.createElement('input'); i.type = 'file'; i.accept = accept;
  i.onchange = () => { if (i.files[0]) cb(i.files[0]); };
  i.click();
}
const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

// Registri aksi untuk event delegation (data-act / data-inp / data-chg)
const ACT = {}, INP = {}, CHG = {};
