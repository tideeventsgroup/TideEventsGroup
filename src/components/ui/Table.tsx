import React, { useState } from 'react'
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface TableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  searchKeys?: (keyof T)[]
  pageSize?: number
  emptyMessage?: string
  onRowClick?: (row: T) => void
}

export function Table<T extends Record<string, unknown>>({
  data,
  columns,
  searchable,
  searchKeys = [],
  pageSize = 25,
  emptyMessage = 'No records found.',
  onRowClick,
}: TableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)

  const filtered = data.filter(row => {
    if (!search) return true
    return searchKeys.some(k => String(row[k] ?? '').toLowerCase().includes(search.toLowerCase()))
  })

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const av = String(a[sortKey] ?? '')
        const bv = String(b[sortKey] ?? '')
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      })
    : filtered

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize)

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  return (
    <div>
      {searchable && (
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  className={cn('table-header', col.sortable && 'cursor-pointer select-none', col.className)}
                  onClick={() => col.sortable && toggleSort(String(col.key))}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className="text-gray-400">
                        {sortKey === String(col.key) ? (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <ChevronUp size={14} className="opacity-30" />}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.length === 0 ? (
              <tr><td colSpan={columns.length} className="table-cell text-center text-gray-400 py-12">{emptyMessage}</td></tr>
            ) : (
              paginated.map((row, i) => (
                <tr
                  key={i}
                  className={cn('hover:bg-gray-50 transition-colors', onRowClick && 'cursor-pointer')}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map(col => (
                    <td key={String(col.key)} className={cn('table-cell', col.className)}>
                      {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}</span>
          <div className="flex items-center gap-2">
            <button
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
            >
              <ChevronLeft size={16} />
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
