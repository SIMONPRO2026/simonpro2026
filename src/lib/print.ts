import { Proyek, LaporanHarian, Survey } from '@/types'
import { formatCurrency, formatDate, formatDateTime } from './utils'

// ─── Print Laporan Harian ──────────────────────────────────────────────
export function printLaporanHarian(laporan: LaporanHarian & { proyekNama: string; proyekKode: string }) {
  const cuacaLabel: Record<string, string> = {
    cerah: '☀️ Cerah', berawan: '⛅ Berawan',
    hujan_ringan: '🌦️ Hujan Ringan', hujan_lebat: '⛈️ Hujan Lebat',
  }

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Laporan Harian - ${laporan.proyekKode}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 24px; }
  .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1d6fde; padding-bottom: 14px; }
  .header h1 { font-size: 16px; font-weight: 700; color: #0f2140; margin-bottom: 4px; }
  .header h2 { font-size: 13px; color: #374151; margin-bottom: 3px; }
  .header p { font-size: 11px; color: #6b7280; }
  .logo { font-size: 20px; font-weight: 900; color: #1d6fde; margin-bottom: 4px; }
  .section { margin: 16px 0; }
  .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; 
    letter-spacing: 0.08em; color: #1d6fde; border-bottom: 1px solid #e5e7eb; 
    padding-bottom: 4px; margin-bottom: 10px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .field { margin-bottom: 8px; }
  .label { font-size: 10px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  .value { font-size: 12px; color: #111827; margin-top: 1px; }
  .progress-bar { height: 10px; background: #e5e7eb; border-radius: 5px; margin-top: 4px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 5px; background: #1d6fde; }
  .uraian-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; margin-top: 4px; line-height: 1.6; }
  .foto-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
  .foto-item { border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; }
  .foto-item img { width: 100%; height: 100px; object-fit: cover; }
  .foto-caption { font-size: 10px; color: #6b7280; padding: 4px 6px; background: #f9fafb; }
  .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-green { background: #dcfce7; color: #15803d; }
  .badge-amber { background: #fef9c3; color: #854d0e; }
  .gps-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 10px; font-family: monospace; font-size: 11px; color: #166534; }
  .footer { margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .sign-box { text-align: center; }
  .sign-title { font-size: 11px; font-weight: 600; color: #374151; margin-bottom: 50px; }
  .sign-line { border-top: 1px solid #374151; padding-top: 6px; font-size: 11px; }
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); 
    font-size: 72px; font-weight: 900; color: rgba(29,111,222,0.06); pointer-events: none; z-index: -1;
    white-space: nowrap; }
  @media print { 
    body { padding: 0; }
    @page { margin: 1cm; size: A4; }
  }
</style>
</head>
<body>
<div class="watermark">SIMONPRO</div>

<div class="header">
  <div class="logo">SIMONPRO</div>
  <h1>LAPORAN HARIAN PELAKSANAAN PEKERJAAN</h1>
  <h2>Dinas Pekerjaan Umum Kota Dumai</h2>
  <p>Dicetak: ${formatDateTime(new Date().toISOString())}</p>
</div>

<div class="section">
  <div class="section-title">Informasi Proyek</div>
  <div class="grid">
    <div class="field">
      <div class="label">Nama Proyek</div>
      <div class="value">${laporan.proyekNama}</div>
    </div>
    <div class="field">
      <div class="label">Kode Proyek</div>
      <div class="value">${laporan.proyekKode}</div>
    </div>
    <div class="field">
      <div class="label">Tanggal Laporan</div>
      <div class="value">${formatDate(laporan.tanggal)}</div>
    </div>
    <div class="field">
      <div class="label">Kondisi Cuaca</div>
      <div class="value">${cuacaLabel[laporan.cuaca] || laporan.cuaca}</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Koordinat GPS</div>
  <div class="gps-box">
    📍 Lintang: ${laporan.koordinat.lat.toFixed(6)}° &nbsp;|&nbsp; 
    Bujur: ${laporan.koordinat.lng.toFixed(6)}° &nbsp;|&nbsp; 
    Akurasi: ±${laporan.koordinat.accuracy?.toFixed(0) || '?'}m
  </div>
</div>

<div class="section">
  <div class="section-title">Progress Pekerjaan</div>
  <div class="field">
    <div class="label">Progress Fisik Kumulatif</div>
    <div style="display:flex;align-items:center;gap:12px;margin-top:4px;">
      <div style="flex:1">
        <div class="progress-bar"><div class="progress-fill" style="width:${laporan.progressFisik}%"></div></div>
      </div>
      <div style="font-size:18px;font-weight:700;color:#1d6fde;width:50px;text-align:right">${laporan.progressFisik}%</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Uraian Pekerjaan Harian</div>
  <div class="uraian-box">${laporan.uraianPekerjaan}</div>
</div>

${laporan.foto.length > 0 ? `
<div class="section">
  <div class="section-title">Dokumentasi Foto (${laporan.foto.length} foto)</div>
  <div class="foto-grid">
    ${laporan.foto.slice(0, 6).map(f => `
      <div class="foto-item">
        <img src="${f.url}" alt="${f.keterangan}" onerror="this.style.display='none'" />
        <div class="foto-caption">${f.keterangan}</div>
      </div>
    `).join('')}
  </div>
</div>
` : ''}

<div class="section">
  <div class="section-title">Status Persetujuan</div>
  <div style="display:flex;align-items:center;gap:10px;">
    <span class="status-badge ${laporan.disetujui ? 'badge-green' : 'badge-amber'}">
      ${laporan.disetujui ? '✓ Disetujui' : '⏳ Menunggu Persetujuan'}
    </span>
    ${laporan.disetujui ? `<span style="font-size:11px;color:#6b7280">oleh ${laporan.disetujuiOleh}</span>` : ''}
  </div>
</div>

<div class="section">
  <div class="label" style="margin-bottom:4px">Dilaporkan Oleh</div>
  <div class="value">${laporan.userName} &nbsp;|&nbsp; ${formatDateTime(laporan.createdAt)}</div>
</div>

<div class="footer">
  <div class="sign-box">
    <div class="sign-title">Dibuat oleh PPTK</div>
    <div class="sign-line">${laporan.userName}</div>
  </div>
  <div class="sign-box">
    <div class="sign-title">Disetujui oleh PPK</div>
    <div class="sign-line">${laporan.disetujuiOleh || '...........................'}</div>
  </div>
</div>

<script>window.print()</script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=794,height=1123')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

// ─── Print Rekap Proyek ──────────────────────────────────────────────
export function printRekapProyek(proyek: Proyek) {
  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Rekap Proyek - ${proyek.kode}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 24px; }
  .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1d6fde; padding-bottom: 14px; }
  .header h1 { font-size: 15px; font-weight: 700; color: #0f2140; margin-bottom: 4px; }
  .logo { font-size: 20px; font-weight: 900; color: #1d6fde; margin-bottom: 4px; }
  .section { margin: 16px 0; }
  .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; 
    letter-spacing: 0.08em; color: #1d6fde; border-bottom: 1px solid #e5e7eb; 
    padding-bottom: 4px; margin-bottom: 10px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .field { margin-bottom: 6px; }
  .label { font-size: 10px; color: #6b7280; font-weight: 600; text-transform: uppercase; }
  .value { font-size: 12px; color: #111827; }
  .progress-bar { height: 12px; background: #e5e7eb; border-radius: 6px; margin-top: 4px; overflow: hidden; }
  .fill-blue { height: 100%; background: #1d6fde; border-radius: 6px; }
  .fill-green { height: 100%; background: #16a34a; border-radius: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 6px; }
  th { background: #f1f5f9; padding: 6px 8px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb; }
  td { padding: 6px 8px; border: 1px solid #e5e7eb; color: #374151; }
  tr:nth-child(even) td { background: #f9fafb; }
  .health-badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; }
  .on-track { background: #dcfce7; color: #15803d; }
  .warning { background: #fef9c3; color: #854d0e; }
  .kritis { background: #fee2e2; color: #991b1b; }
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); 
    font-size: 72px; font-weight: 900; color: rgba(29,111,222,0.05); pointer-events: none; }
  .deviasi-neg { color: #dc2626; font-weight: 700; }
  .deviasi-pos { color: #16a34a; font-weight: 700; }
  @media print { @page { margin: 1cm; size: A4; } }
</style>
</head>
<body>
<div class="watermark">SIMONPRO</div>

<div class="header">
  <div class="logo">SIMONPRO</div>
  <h1>REKAP MONITORING PROYEK</h1>
  <p style="font-size:11px;color:#6b7280">Dinas Pekerjaan Umum Kota Dumai · Dicetak: ${formatDateTime(new Date().toISOString())}</p>
</div>

<div class="section">
  <div class="section-title">Identitas Proyek</div>
  <div class="grid2">
    <div class="field"><div class="label">Nama Proyek</div><div class="value" style="font-weight:600">${proyek.nama}</div></div>
    <div class="field"><div class="label">Kode</div><div class="value">${proyek.kode}</div></div>
    <div class="field"><div class="label">Lokasi</div><div class="value">${proyek.lokasi}</div></div>
    <div class="field"><div class="label">Kecamatan</div><div class="value">${proyek.kecamatan}</div></div>
    <div class="field"><div class="label">Anggaran</div><div class="value">${formatCurrency(proyek.anggaran)}</div></div>
    <div class="field"><div class="label">Nilai Kontrak</div><div class="value">${proyek.nilaiKontrak ? formatCurrency(proyek.nilaiKontrak) : '-'}</div></div>
    <div class="field"><div class="label">Tanggal Mulai</div><div class="value">${formatDate(proyek.tanggalMulai)}</div></div>
    <div class="field"><div class="label">Tanggal Selesai</div><div class="value">${formatDate(proyek.tanggalSelesai)}</div></div>
    <div class="field"><div class="label">Kontraktor</div><div class="value">${proyek.kontraktor || '-'}</div></div>
    <div class="field"><div class="label">PPTK</div><div class="value">${proyek.pptk || '-'}</div></div>
    <div class="field"><div class="label">PPK</div><div class="value">${proyek.ppk || '-'}</div></div>
    <div class="field"><div class="label">Status Health</div>
      <div class="value"><span class="health-badge ${proyek.health === 'on_track' ? 'on-track' : proyek.health}">${proyek.health === 'on_track' ? 'On Track' : proyek.health === 'warning' ? 'Warning' : 'Kritis'}</span></div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Progress Pekerjaan</div>
  <div class="field">
    <div class="label">Progress Fisik</div>
    <div style="display:flex;align-items:center;gap:10px;margin-top:4px">
      <div style="flex:1"><div class="progress-bar"><div class="fill-blue" style="width:${proyek.progressFisik}%"></div></div></div>
      <div style="font-size:16px;font-weight:700;color:#1d6fde">${proyek.progressFisik}%</div>
    </div>
  </div>
  <div class="field" style="margin-top:8px">
    <div class="label">Progress Keuangan</div>
    <div style="display:flex;align-items:center;gap:10px;margin-top:4px">
      <div style="flex:1"><div class="progress-bar"><div class="fill-green" style="width:${proyek.progressKeuangan}%"></div></div></div>
      <div style="font-size:16px;font-weight:700;color:#16a34a">${proyek.progressKeuangan}%</div>
    </div>
  </div>
  <div class="field" style="margin-top:8px">
    <div class="label">Deviasi (Fisik - Keuangan)</div>
    <div class="value ${proyek.deviasi < 0 ? 'deviasi-neg' : 'deviasi-pos'}" style="font-size:16px;margin-top:2px">
      ${proyek.deviasi > 0 ? '+' : ''}${proyek.deviasi}%
    </div>
  </div>
</div>

${proyek.laporanHarian.length > 0 ? `
<div class="section">
  <div class="section-title">Laporan Harian (${proyek.laporanHarian.length} laporan)</div>
  <table>
    <thead>
      <tr>
        <th>No</th>
        <th>Tanggal</th>
        <th>Uraian Singkat</th>
        <th>Progress</th>
        <th>Cuaca</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${proyek.laporanHarian.map((l, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${formatDate(l.tanggal)}</td>
          <td>${l.uraianPekerjaan.substring(0, 60)}${l.uraianPekerjaan.length > 60 ? '...' : ''}</td>
          <td style="text-align:center;font-weight:700;color:#1d6fde">${l.progressFisik}%</td>
          <td>${l.cuaca.replace('_', ' ')}</td>
          <td>${l.disetujui ? '<span style="color:#15803d;font-weight:600">✓ Disetujui</span>' : '<span style="color:#854d0e">Menunggu</span>'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</div>
` : ''}

${proyek.masalah.length > 0 ? `
<div class="section">
  <div class="section-title">Masalah Tercatat (${proyek.masalah.length})</div>
  <table>
    <thead>
      <tr><th>Judul</th><th>Prioritas</th><th>Status</th><th>Tanggal</th></tr>
    </thead>
    <tbody>
      ${proyek.masalah.map(m => `
        <tr>
          <td>${m.judul}</td>
          <td style="text-transform:capitalize;font-weight:600">${m.prioritas}</td>
          <td>${m.status.replace('_', ' ')}</td>
          <td>${formatDate(m.tanggal)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</div>
` : ''}

<div style="margin-top:30px;border-top:1px solid #e5e7eb;padding-top:12px;font-size:11px;color:#6b7280;text-align:center">
  Dokumen ini dicetak dari sistem SIMONPRO · Dinas PU Kota Dumai · ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
</div>

<script>window.print()</script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=794,height=1123')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

// ─── Print Survey ────────────────────────────────────────────────────
export function printSurvey(survey: Survey & { proyekNama: string; proyekKode: string }) {
  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Laporan Survey - ${survey.proyekKode}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 24px; }
  .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1d6fde; padding-bottom: 14px; }
  .logo { font-size: 20px; font-weight: 900; color: #1d6fde; margin-bottom: 4px; }
  h1 { font-size: 15px; font-weight: 700; color: #0f2140; }
  .section { margin: 14px 0; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; 
    letter-spacing: 0.08em; color: #1d6fde; border-bottom: 1px solid #e5e7eb; 
    padding-bottom: 4px; margin-bottom: 8px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .field { margin-bottom: 6px; }
  .label { font-size: 10px; color: #6b7280; font-weight: 600; text-transform: uppercase; }
  .value { font-size: 12px; color: #111827; }
  .box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; line-height: 1.6; }
  .foto-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .foto-item img { width: 100%; height: 110px; object-fit: cover; border-radius: 4px; border: 1px solid #e5e7eb; }
  .foto-cap { font-size: 10px; color: #6b7280; text-align: center; margin-top: 3px; }
  .gps-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 10px; font-family: monospace; font-size: 11px; color: #166534; }
  @media print { @page { margin: 1cm; size: A4; } }
</style>
</head>
<body>
<div class="header">
  <div class="logo">SIMONPRO</div>
  <h1>LAPORAN SURVEY LAPANGAN PRA-KONSTRUKSI</h1>
  <p style="font-size:11px;color:#6b7280">Dinas PU Kota Dumai · ${formatDateTime(new Date().toISOString())}</p>
</div>

<div class="section">
  <div class="section-title">Data Umum</div>
  <div class="grid2">
    <div class="field"><div class="label">Proyek</div><div class="value" style="font-weight:600">${survey.proyekNama}</div></div>
    <div class="field"><div class="label">Kode</div><div class="value">${survey.proyekKode}</div></div>
    <div class="field"><div class="label">Tanggal Survey</div><div class="value">${formatDate(survey.tanggal)}</div></div>
    <div class="field"><div class="label">Tim Surveyor</div><div class="value">${survey.userName}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">Koordinat GPS</div>
  <div class="gps-box">📍 ${survey.koordinat.lat.toFixed(6)}°, ${survey.koordinat.lng.toFixed(6)}° · ±${survey.koordinat.accuracy?.toFixed(0) || '?'}m</div>
</div>

<div class="section">
  <div class="section-title">Dimensi Eksisting</div>
  <div class="grid2">
    <div class="field"><div class="label">Panjang</div><div class="value">${survey.dimensi.panjang} m</div></div>
    <div class="field"><div class="label">Lebar</div><div class="value">${survey.dimensi.lebar} m</div></div>
    <div class="field"><div class="label">Tinggi/Kedalaman</div><div class="value">${survey.dimensi.tinggi} m</div></div>
    <div class="field"><div class="label">Material</div><div class="value">${survey.material || '-'}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">Kondisi Eksisting</div>
  <div class="box">${survey.kondisiEksisting}</div>
</div>

<div class="section">
  <div class="section-title">Permasalahan</div>
  <div class="box" style="border-color:#fca5a5;background:#fff5f5">${survey.permasalahan}</div>
</div>

${survey.rekomendasi ? `
<div class="section">
  <div class="section-title">Rekomendasi</div>
  <div class="box" style="border-color:#93c5fd;background:#eff6ff">${survey.rekomendasi}</div>
</div>
` : ''}

${survey.foto.length > 0 ? `
<div class="section">
  <div class="section-title">Dokumentasi Foto (${survey.foto.length} foto)</div>
  <div class="foto-grid">
    ${survey.foto.map(f => `
      <div>
        <img src="${f.url}" alt="${f.keterangan}" onerror="this.style.display='none'" />
        <div class="foto-cap">${f.keterangan}</div>
      </div>
    `).join('')}
  </div>
</div>
` : ''}

<div style="margin-top:30px;border-top:1px solid #e5e7eb;padding-top:12px;font-size:11px;color:#6b7280;text-align:center">
  Laporan Survey Lapangan · SIMONPRO · Dinas PU Kota Dumai
</div>
<script>window.print()</script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=794,height=1123')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}
