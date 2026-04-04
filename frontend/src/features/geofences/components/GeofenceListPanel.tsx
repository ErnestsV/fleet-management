import { useState } from 'react';
import { Panel } from '@/components/ui/Panel';
import { SearchablePagedList } from '@/components/ui/SearchablePagedList';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Geofence } from '@/types/domain';

const GEOFENCE_PAGE_SIZE = 5;

type GeofenceListPanelProps = {
  geofences: Geofence[];
  isLoading: boolean;
  isError: boolean;
  onEdit: (geofence: Geofence) => void;
  onToggleActive: (geofence: Geofence) => void;
  onDelete: (geofenceId: number) => void;
  framed?: boolean;
  stickySearch?: boolean;
  scrollable?: boolean;
};

export function GeofenceListPanel({
  geofences,
  isLoading,
  isError,
  onEdit,
  onToggleActive,
  onDelete,
  framed = true,
  stickySearch = false,
  scrollable = false,
}: GeofenceListPanelProps) {
  const [search, setSearch] = useState('');

  const content = (
    <>
      {isLoading ? <div className="text-sm text-slate-500">Loading geofences...</div> : null}
      {isError ? <div className="text-sm text-rose-600">Failed to load geofences.</div> : null}
      {!isLoading && !isError ? (
        <SearchablePagedList
          items={geofences}
          query={search}
          onQueryChange={setSearch}
          filterItem={(geofence, query) => geofence.name.toLowerCase().includes(query)}
          renderItem={(geofence) => (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4">
              <button type="button" className="text-left" onClick={() => onEdit(geofence)}>
                <div className="font-semibold">{geofence.name}</div>
                <div className="text-sm text-slate-500">{geofence.geometry.radius_m} m radius</div>
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={geofence.is_active ? 'active' : 'offline'} />
                <button type="button" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold" onClick={() => onEdit(geofence)}>
                  Edit
                </button>
                <button type="button" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold" onClick={() => onToggleActive(geofence)}>
                  {geofence.is_active ? 'Disable' : 'Enable'}
                </button>
                <button type="button" className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => onDelete(geofence.id)}>
                  Delete
                </button>
              </div>
            </div>
          )}
          getKey={(geofence) => geofence.id}
          searchPlaceholder="Search geofences"
          emptyMessage="No geofences match the current search."
          pageSize={GEOFENCE_PAGE_SIZE}
          showMoreLabel="Show 5 more geofences"
          stickySearch={stickySearch}
          scrollable={scrollable}
        />
      ) : null}
    </>
  );

  if (!framed) {
    return content;
  }

  return (
    <Panel title="Geofence list" description="Entry and exit alerts are generated from current vehicle position against active circle geofences.">
      {content}
    </Panel>
  );
}
