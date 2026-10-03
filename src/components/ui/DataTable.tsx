import { type ReactNode } from "react";
import { classNames } from "@/utils/helpers";

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  render?: (item: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
  isLoading?: boolean;
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = "No data available",
  className,
}: DataTableProps<T>) {
  return (
    <div className={classNames("overflow-x-auto rounded-xl border border-app/80 shadow-2xs bg-surface", className)}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-app/80 bg-surface-muted/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={classNames(
                  "text-left text-[11px] font-semibold text-app-muted uppercase tracking-wider px-4 py-3.5",
                  col.className
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-app/60">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-12 text-sm text-app-muted font-medium"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={classNames(
                  "transition-colors duration-150 hover:bg-surface-muted/60",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={classNames("px-4 py-3.5 text-sm text-app font-normal align-middle", col.className)}>
                    {col.render
                      ? col.render(item, index)
                      : String((item as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
