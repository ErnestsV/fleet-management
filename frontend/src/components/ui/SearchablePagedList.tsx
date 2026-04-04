import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

type SearchablePagedListProps<T> = {
  items: T[];
  query: string;
  onQueryChange: (value: string) => void;
  filterItem: (item: T, query: string) => boolean;
  renderItem: (item: T) => ReactNode;
  getKey: (item: T) => string | number;
  searchPlaceholder: string;
  emptyMessage: string;
  pageSize: number;
  showMoreLabel: string;
  stickySearch?: boolean;
  scrollable?: boolean;
};

export function SearchablePagedList<T>({
  items,
  query,
  onQueryChange,
  filterItem,
  renderItem,
  getKey,
  searchPlaceholder,
  emptyMessage,
  pageSize,
  showMoreLabel,
  stickySearch = false,
  scrollable = false,
}: SearchablePagedListProps<T>) {
  const safePageSize = Math.max(1, pageSize);
  const [visibleCount, setVisibleCount] = useState(safePageSize);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) => filterItem(item, normalizedQuery));
  }, [items, query, filterItem]);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [query, filteredItems.length, safePageSize]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = filteredItems.length > visibleCount;

  return (
    <div className={scrollable ? 'flex h-full min-h-0 flex-col' : 'space-y-4'}>
      <div className={stickySearch ? 'sticky top-0 z-10 bg-white pb-4' : ''}>
        <div className="relative">
          <input
            className="w-full rounded-2xl border border-slate-200 py-2 pl-4 pr-10 text-sm"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          {query ? (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label={`Clear ${searchPlaceholder.toLowerCase()}`}
              onClick={() => onQueryChange('')}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      {filteredItems.length > 0 ? (
        <div className={scrollable ? 'mt-4 flex min-h-0 flex-1 flex-col' : 'space-y-4'}>
          <div className={scrollable ? 'min-h-0 flex-1 overflow-y-auto pr-1' : ''}>
            <div className="space-y-3">
              {visibleItems.map((item) => (
                <div key={getKey(item)}>
                  {renderItem(item)}
                </div>
              ))}
            </div>
          </div>
          {hasMore ? (
            <button
              type="button"
              className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={() => setVisibleCount((current) => current + safePageSize)}
            >
              {showMoreLabel}
            </button>
          ) : null}
        </div>
      ) : (
        <div className={scrollable ? 'mt-4' : ''}>
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">{emptyMessage}</div>
        </div>
      )}
    </div>
  );
}
