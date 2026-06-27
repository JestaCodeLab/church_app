import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyIcon?: React.ReactNode;
  emptyMessage?: string;
  // Multiselect
  selectable?: boolean;
  selectedIds?: string[];
  onSelectChange?: (ids: string[]) => void;
  getRowId?: (row: T) => string;
  // Pagination
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  // Row interaction
  onRowClick?: (row: T) => void;
  rowClassName?: string;
}

export const DataTable = React.forwardRef<HTMLDivElement, DataTableProps<any>>(
  (
    {
      columns,
      data,
      loading = false,
      emptyIcon,
      emptyMessage = 'No data found',
      selectable = false,
      selectedIds = [],
      onSelectChange,
      getRowId = (row) => row._id,
      currentPage,
      totalPages,
      totalItems,
      pageSize = 10,
      onPageChange,
      onRowClick,
      rowClassName,
    },
    ref
  ) => {
    const selectedSet = new Set(selectedIds);

    const handleSelectAll = (checked: boolean) => {
      if (checked) {
        const allIds = data.map(getRowId);
        onSelectChange?.(allIds);
      } else {
        onSelectChange?.([]);
      }
    };

    const handleSelectRow = (id: string, checked: boolean) => {
      if (checked) {
        onSelectChange?.([...selectedIds, id]);
      } else {
        onSelectChange?.(selectedIds.filter((sid) => sid !== id));
      }
    };

    const isAllSelected = data.length > 0 && data.every((row) => selectedSet.has(getRowId(row)));

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
      <div ref={ref} className="flex flex-col gap-4">
        {/* Loading state */}
        {loading && data.length === 0 ? (
          <div className="flex items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : data.length === 0 ? (
          /* Empty state */
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {emptyIcon && <div className="mb-4 flex justify-center">{emptyIcon}</div>}
            <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    {selectable && (
                      <th className="px-4 sm:px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                      </th>
                    )}
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className={`px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide ${col.className || ''}`}
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.map((row) => {
                    const rowId = getRowId(row);
                    const isSelected = selectedSet.has(rowId);

                    return (
                      <tr
                        key={rowId}
                        onClick={() => !selectable && onRowClick?.(row)}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                          onRowClick && !selectable ? 'cursor-pointer' : ''
                        } ${rowClassName || ''} ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                      >
                        {selectable && (
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleSelectRow(rowId, e.target.checked)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 cursor-pointer"
                            />
                          </td>
                        )}
                        {columns.map((col) => (
                          <td key={col.key} className={`px-4 sm:px-6 py-4 ${col.className || ''}`}>
                            {col.render ? col.render(row) : String(row[col.key as keyof typeof row] || '')}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-800 px-4 sm:px-6 py-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                  Showing {startItem} to {endItem} of {totalItems} results
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
);

DataTable.displayName = 'DataTable';
