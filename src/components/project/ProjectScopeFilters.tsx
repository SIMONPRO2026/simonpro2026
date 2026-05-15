'use client'

import { PROJECT_CATEGORIES, PROJECT_PACKAGE_TYPES, PROJECT_WORK_STAGES } from '@/lib/reporting'

interface ProjectScopeFiltersProps {
  category: string
  packageType: string
  workStage: string
  onCategoryChange: (value: string) => void
  onPackageTypeChange: (value: string) => void
  onWorkStageChange: (value: string) => void
  total?: number
  itemLabel?: string
  className?: string
}

export function ProjectScopeFilters({
  category,
  packageType,
  workStage,
  onCategoryChange,
  onPackageTypeChange,
  onWorkStageChange,
  total,
  itemLabel = 'proyek',
  className = '',
}: ProjectScopeFiltersProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-100 p-4 ${className}`}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-32 text-xs font-semibold text-slate-500">Metode pengadaan</span>
          <button onClick={() => onCategoryChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${category === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            Semua Jenis
          </button>
          {PROJECT_CATEGORIES.map((item) => (
            <button key={item.value} onClick={() => onCategoryChange(item.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${category === item.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="w-32 text-xs font-semibold text-slate-500">Jenis proyek</span>
          <button onClick={() => onPackageTypeChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${packageType === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            Semua Jenis
          </button>
          {PROJECT_PACKAGE_TYPES.map((item) => (
            <button key={item.value} onClick={() => onPackageTypeChange(item.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${packageType === item.value ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="w-32 text-xs font-semibold text-slate-500">Tahap pekerjaan</span>
          <button onClick={() => onWorkStageChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${workStage === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            Semua Tahap
          </button>
          {PROJECT_WORK_STAGES.map((item) => (
            <button key={item.value} onClick={() => onWorkStageChange(item.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${workStage === item.value ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {item.label}
            </button>
          ))}
          {typeof total === 'number' && (
            <span className="ml-auto text-xs font-medium text-slate-400">{total} {itemLabel}</span>
          )}
        </div>
      </div>
    </div>
  )
}
