'use client'
import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Topbar } from '@/components/layout/Topbar'
import { Proyek } from '@/types'
import { formatCurrency, getHealthBadge, getStatusLabel } from '@/lib/utils'
import { PROJECT_CATEGORIES, PROJECT_PACKAGE_TYPES, PROJECT_WORK_STAGES, filterProjectsByScope, getProjectCategoryLabel, getProjectPackageType, getProjectPackageTypeLabel, getProjectWorkStage, getProjectWorkStageLabel } from '@/lib/reporting'
import { X, MapPin, TrendingDown, TrendingUp, Camera, MessageSquare, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function PetaPage() {
  const { projects } = useAppStore()
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [selected, setSelected] = useState<Proyek | null>(null)
  const [filter, setFilter] = useState<'all' | 'on_track' | 'warning' | 'kritis'>('all')
  const [filterKategori, setFilterKategori] = useState('all')
  const [filterJenisProyek, setFilterJenisProyek] = useState('all')
  const [filterTahap, setFilterTahap] = useState('all')
  const [mapReady, setMapReady] = useState(false)
  const visibleProjects = filterProjectsByScope(projects, filterKategori, filterJenisProyek, filterTahap)

  const stats = {
    total: visibleProjects.length,
    onTrack: visibleProjects.filter(p => p.health === 'on_track').length,
    warning: visibleProjects.filter(p => p.health === 'warning').length,
    kritis: visibleProjects.filter(p => p.health === 'kritis').length,
  }

  useEffect(() => {
    if (typeof window === 'undefined' || leafletMap.current || !mapRef.current) return

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default
        // Fix leaflet marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })

        // Inject leaflet CSS
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link')
          link.id = 'leaflet-css'
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          document.head.appendChild(link)
        }

        if (!mapRef.current || leafletMap.current) return

        const map = L.map(mapRef.current, {
          center: [1.67, 101.44],
          zoom: 12,
          zoomControl: true,
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map)

        leafletMap.current = map

        projects.forEach(p => {
          const color = { on_track: '#16a34a', warning: '#d97706', kritis: '#dc2626' }[p.health]
          const icon = L.divIcon({
            className: '',
            html: `<div style="
              width:40px;height:40px;border-radius:50%;
              background:${color};border:3px solid white;
              box-shadow:0 2px 8px rgba(0,0,0,0.35);
              display:flex;align-items:center;justify-content:center;
              cursor:pointer;font-weight:700;font-size:11px;color:white;
              transition:transform 0.15s;
            ">${p.progressFisik}%</div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          })

          const marker = L.marker([p.koordinat.lat, p.koordinat.lng], { icon })
            .addTo(map)
            .on('click', () => setSelected(p))

          markersRef.current.push({ marker, project: p })
        })

        setMapReady(true)
      } catch (err) {
        console.error('Map init error:', err)
      }
    }

    initMap()

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove()
        leafletMap.current = null
        markersRef.current = []
      }
    }
  }, [])

  useEffect(() => {
    if (!mapReady) return
    markersRef.current.forEach(({ marker, project }) => {
      const matchHealth = filter === 'all' || project.health === filter
      const matchCategory = filterKategori === 'all' || (project as any).kategoriPekerjaan === filterKategori
      const matchPackageType = filterJenisProyek === 'all' || getProjectPackageType(project) === filterJenisProyek
      const matchWorkStage = filterTahap === 'all' || getProjectWorkStage(project) === filterTahap
      marker.setOpacity(matchHealth && matchCategory && matchPackageType && matchWorkStage ? 1 : 0.12)
    })
  }, [filter, filterKategori, filterJenisProyek, filterTahap, mapReady])

  const filtered = filter === 'all' ? visibleProjects : visibleProjects.filter(p => p.health === filter)

  return (
    <>
      <Topbar title="Peta Monitoring Proyek" subtitle="Pantau semua proyek secara real-time" />
      <div className="flex flex-col h-[calc(100vh-56px)]">

        {/* KPI strip */}
        <div className="bg-white border-b border-slate-100 px-5 py-2.5 flex items-center gap-6 flex-shrink-0">
          {[
            { label: 'Total', val: stats.total, color: 'text-slate-800' },
            { label: 'On Track', val: stats.onTrack, color: 'text-green-600' },
            { label: 'Warning', val: stats.warning, color: 'text-amber-600' },
            { label: 'Kritis', val: stats.kritis, color: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className={`text-xl font-bold ${s.color}`}>{s.val}</span>
              <span className="text-xs text-slate-400">{s.label}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <select value={filterKategori} onChange={e => setFilterKategori(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-600">
              <option value="all">Semua Pengadaan</option>
              {PROJECT_CATEGORIES.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
            <select value={filterJenisProyek} onChange={e => setFilterJenisProyek(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-600">
              <option value="all">Semua Jenis Proyek</option>
              {PROJECT_PACKAGE_TYPES.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
            <select value={filterTahap} onChange={e => setFilterTahap(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-600">
              <option value="all">Semua Tahap</option>
              {PROJECT_WORK_STAGES.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
            <span className="text-xs text-slate-500">Filter:</span>
            {(['all', 'on_track', 'warning', 'kritis'] as const).map(f => {
              const labels = { all: 'Semua', on_track: 'On Track', warning: 'Warning', kritis: 'Kritis' }
              const active: Record<string, string> = {
                all: 'bg-slate-200 text-slate-800',
                on_track: 'bg-green-100 text-green-700',
                warning: 'bg-amber-100 text-amber-700',
                kritis: 'bg-red-100 text-red-700',
              }
              return (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                    filter === f
                      ? active[f] + ' border-current/30 shadow-sm'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}>
                  {labels[f]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Map + panel */}
        <div className="flex flex-1 min-h-0 relative">
          <div ref={mapRef} className="flex-1 min-h-0 z-0" />

          {/* Legend */}
          <div className="absolute bottom-16 left-3 bg-white rounded-xl shadow-lg border border-slate-100 p-3 z-[1000]">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Keterangan</div>
            {[
              { color: '#16a34a', label: 'On Track' },
              { color: '#d97706', label: 'Warning (< -10%)' },
              { color: '#dc2626', label: 'Kritis (< -20%)' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2 mb-1 text-xs text-slate-600">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
            <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400">
              Angka = % progress fisik
            </div>
          </div>

          {/* Selected project panel */}
          {selected && (
            <div className="absolute top-0 right-0 bottom-0 w-72 bg-white border-l border-slate-100 flex flex-col z-[1000] shadow-xl overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500">Detail Proyek</div>
                  <div className={`mt-1 inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border
                    ${getHealthBadge(selected.health).bg} ${getHealthBadge(selected.health).text} ${getHealthBadge(selected.health).border}`}>
                    {getHealthBadge(selected.health).label}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">{getProjectCategoryLabel((selected as any).kategoriPekerjaan)}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">{getProjectPackageTypeLabel(getProjectPackageType(selected))}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">{getProjectWorkStageLabel(getProjectWorkStage(selected))}</span>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Ilustrasi proyek */}
              <div className="h-32 bg-gradient-to-br from-slate-700 to-slate-900 relative overflow-hidden flex-shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 288 128" className="w-full h-full opacity-40">
                  <rect width="288" height="128" fill="#334155"/>
                  <rect x="20" y="45" width="248" height="38" rx="4" fill="#64748b"/>
                  <line x1="40" y1="64" x2="248" y2="64" stroke="#94a3b8" strokeWidth="2" strokeDasharray="10,6"/>
                  <path d="M0 95 Q72 85 144 95 Q216 105 288 90" fill="none" stroke="#7dd3fc" strokeWidth="2.5"/>
                  <path d="M0 108 Q72 98 144 108 Q216 118 288 103" fill="none" stroke="#7dd3fc" strokeWidth="1.5" opacity="0.5"/>
                </svg>
                <div className="absolute bottom-2 left-0 right-0 text-center">
                  <span className="text-white/60 text-xs">{selected.kecamatan}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-sm font-bold text-slate-800 leading-snug mb-1">{selected.nama}</h3>
                <div className="flex items-center gap-1 text-xs text-slate-500 mb-4">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="line-clamp-1">{selected.lokasi}</span>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Progress Fisik</span>
                      <span className="font-bold text-blue-600">{selected.progressFisik}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${selected.progressFisik}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Progress Keuangan</span>
                      <span className="font-bold text-green-600">{selected.progressKeuangan}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${selected.progressKeuangan}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-2.5 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Deviasi</span>
                    <div className="flex items-center gap-1">
                      {selected.deviasi < 0
                        ? <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                        : <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
                      <span className={`text-sm font-bold ${selected.deviasi < -10 ? 'text-red-600' : selected.deviasi < 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        {selected.deviasi > 0 ? '+' : ''}{selected.deviasi}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 flex-shrink-0">Kategori</span>
                    <span className="font-medium">{getProjectCategoryLabel((selected as any).kategoriPekerjaan)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 flex-shrink-0">Anggaran</span>
                    <span className="font-medium text-right">{formatCurrency(selected.anggaran)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 flex-shrink-0">Kontraktor</span>
                    <span className="font-medium text-right truncate max-w-[55%]">{selected.kontraktor || '-'}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 flex-shrink-0">Status</span>
                    <span className="font-medium">{getStatusLabel(selected.status)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 flex-shrink-0">Selesai</span>
                    <span className="font-medium">{selected.tanggalSelesai}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 flex-shrink-0">Masalah</span>
                    <span className={`font-bold ${selected.masalah.filter(m=>m.status==='open').length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {selected.masalah.filter(m=>m.status==='open').length} open
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 grid grid-cols-2 gap-2 flex-shrink-0">
                <Link href={`/proyek/${selected.id}`}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Detail
                </Link>
                <Link href={`/chat?proyek=${selected.id}`}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Chat
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Bottom scrollable project chips */}
        <div className="bg-white border-t border-slate-100 px-4 py-2.5 flex-shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            {filtered.map(p => {
              const badge = getHealthBadge(p.health)
              return (
                <button key={p.id} onClick={() => setSelected(p)}
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all hover:shadow-sm cursor-pointer ${
                    selected?.id === p.id
                      ? 'border-blue-300 bg-blue-50 shadow-sm'
                      : 'border-slate-100 bg-white hover:bg-slate-50'
                  }`}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: { on_track: '#16a34a', warning: '#d97706', kritis: '#dc2626' }[p.health] }} />
                  <span className="font-medium text-slate-700 max-w-[120px] truncate">
                    {p.nama.split(' ').slice(0, 3).join(' ')}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${badge.bg} ${badge.text}`}>
                    {p.progressFisik}%
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
