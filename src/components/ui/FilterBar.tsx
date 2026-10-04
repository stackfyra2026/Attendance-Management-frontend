import React from "react";
import Input from "./Input";
import Button from "./Button";

interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (val: string) => void;
}

interface FilterBarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  onReset?: () => void;
  extraActions?: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  onReset,
  extraActions,
  className = "",
}) => {
  const hasActiveFilters =
    Boolean(searchQuery) || filters.some((f) => Boolean(f.value));

  return (
    <div
      className={`p-4 bg-app-card rounded-xl border border-app-border space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4 ${className}`}
    >
      <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {onSearchChange !== undefined && (
          <div className="w-full sm:w-64 md:w-80">
            <Input
              type="search"
              value={searchQuery ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
            />
          </div>
        )}

        {filters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
              <select
                key={filter.key}
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="px-3 py-2 text-sm bg-app-card text-app border border-app-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="">All {filter.label}</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ))}

            {hasActiveFilters && onReset && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="text-app-muted hover:text-app text-xs"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {extraActions && (
        <div className="flex items-center space-x-2 shrink-0">{extraActions}</div>
      )}
    </div>
  );
};

export default FilterBar;
