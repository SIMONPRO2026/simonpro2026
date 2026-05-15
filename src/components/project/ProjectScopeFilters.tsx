'use client'

import { PROJECT_CATEGORIES, PROJECT_PACKAGE_TYPES, PROJECT_WORK_STAGES } from '@/lib/reporting'

interface ProjectScopeFiltersProps {
  category: string
  packageType: string
  workStage: string
  budgetYear?: string
  budgetYears?: number[]
  program?: string
  programs?: string[]
  subKegiatan?: string
  subKegiatanOptions?: string[]
  onCategoryChange: (value: string) => void
  onPackageTypeChange: (value: string) => void
  onWorkStageChange: (value: string) => void
  onBudgetYearChange?: (value: string) => void
  onProgramChange?: (value: string) => void
  onSubKegiatanChange?: (value: string) => void
  total?: number
  itemLabel?: string
  className?: string
}

export function ProjectScopeFilters({
  category,
  packageType,
  workStage,
  budgetYear = 'all',
  budgetYears = [],
  program = 'all',
  programs = [],
  subKegiatan = 'all',
  subKegiatanOptions = [],
  onCategoryChange,
  onPackageTypeChange,
  onWorkStageChange,
  onBudgetYearChange,
  onProgramChange,
  onSubKegiatanChange,
  total,
  itemLabel = 'proyek',
  className = '',
}: ProjectScopeFiltersProps) {
  const selectClass = 'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
  const fieldClass = 'min-w-0'
  const labelClass = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500'

  return (
    <div className={`bg-white rounded-xl border border-slate-100 p-3 md:p-4 ${className}`}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className={fieldClass}>
          <label className={labelClass}>Metode pengadaan</label>
          <select value={category} onChange={(event) => onCategoryChange(event.target.value)} className={selectClass}>
            <option value="all">Semua Jenis</option>
            {PROJECT_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>

        <div className={fieldClass}>
          <label className={labelClass}>Jenis proyek</label>
          <select value={packageType} onChange={(event) => onPackageTypeChange(event.target.value)} className={selectClass}>
            <option value="all">Semua Jenis</option>
            {PROJECT_PACKAGE_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>

        <div className={fieldClass}>
          <label className={labelClass}>Tahap pekerjaan</label>
          <select value={workStage} onChange={(event) => onWorkStageChange(event.target.value)} className={selectClass}>
            <option value="all">Semua Tahap</option>
            {PROJECT_WORK_STAGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>

        <div className={fieldClass}>
          <label className={labelClass}>Tahun anggaran</label>
          <select value={budgetYear} onChange={(event) => onBudgetYearChange?.(event.target.value)} className={selectClass}>
            <option value="all">Semua Tahun</option>
            {budgetYears.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>

        <div className={fieldClass}>
          <label className={labelClass}>Program</label>
          <select value={program} onChange={(event) => onProgramChange?.(event.target.value)} className={selectClass}>
            <option value="all">Semua Program</option>
            {programs.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div className={fieldClass}>
          <label className={labelClass}>Sub kegiatan</label>
          <select value={subKegiatan} onChange={(event) => onSubKegiatanChange?.(event.target.value)} className={selectClass}>
            <option value="all">Semua Sub Kegiatan</option>
            {subKegiatanOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </div>

      {typeof total === 'number' && (
        <div className="mt-3 text-right text-xs font-semibold text-slate-400">{total} {itemLabel}</div>
      )}
    </div>
  )
}
