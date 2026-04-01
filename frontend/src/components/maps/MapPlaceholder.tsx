import clsx from 'clsx';

type Marker = {
  id: number;
  label: string;
  status?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

const statusTone: Record<string, string> = {
  moving: 'bg-emerald-500',
  idling: 'bg-amber-500',
  stopped: 'bg-slate-700',
  offline: 'bg-rose-500',
};

function fallbackPosition(index: number): { x: number; y: number } {
  const positions = [
    { x: 22, y: 24 },
    { x: 61, y: 39 },
    { x: 34, y: 58 },
    { x: 76, y: 74 },
    { x: 48, y: 18 },
    { x: 14, y: 68 },
  ];

  return positions[index % positions.length];
}

function normalizeMarkers(markers: Marker[]): Array<Marker & { x: number; y: number }> {
  const validMarkers = markers.filter((marker) => marker.latitude != null && marker.longitude != null);

  if (validMarkers.length < 2) {
    return markers.map((marker, index) => ({
      ...marker,
      ...fallbackPosition(index),
    }));
  }

  const latitudes = validMarkers.map((marker) => marker.latitude as number);
  const longitudes = validMarkers.map((marker) => marker.longitude as number);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latSpan = Math.max(maxLat - minLat, 0.001);
  const lngSpan = Math.max(maxLng - minLng, 0.001);

  return markers.map((marker, index) => {
    if (marker.latitude == null || marker.longitude == null) {
      return {
        ...marker,
        ...fallbackPosition(index),
      };
    }

    return {
      ...marker,
      x: 10 + (((marker.longitude - minLng) / lngSpan) * 80),
      y: 12 + ((1 - ((marker.latitude - minLat) / latSpan)) * 70),
    };
  });
}

export function MapPlaceholder({
  markers,
  selectedMarkerId,
  caption = 'Map provider integration placeholder',
}: {
  markers?: Marker[];
  selectedMarkerId?: number | null;
  caption?: string;
}) {
  const resolvedMarkers = normalizeMarkers(
    markers && markers.length > 0
      ? markers
      : [
          { id: 1, label: 'KN-564', status: 'moving' },
          { id: 2, label: 'FA-5948', status: 'idling' },
          { id: 3, label: 'GG-3341', status: 'offline' },
          { id: 4, label: 'JR-3940', status: 'stopped' },
        ],
  );

  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_45%,#ecfeff_100%)] shadow-panel">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(31,143,99,0.18),transparent_18%),radial-gradient(circle_at_75%_30%,rgba(37,99,235,0.16),transparent_20%),linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px)] bg-[length:auto,auto,48px_48px,48px_48px]" />
      {resolvedMarkers.map((marker) => (
        <div
          key={marker.id}
          className="absolute transition-all"
          style={{ left: `${marker.x}%`, top: `${marker.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div
            className={clsx(
              'rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg ring-4 ring-white/70',
              statusTone[marker.status ?? ''] ?? 'bg-slate-800',
              selectedMarkerId === marker.id ? 'scale-110' : '',
            )}
          >
            {marker.label}
          </div>
        </div>
      ))}
      <div className="absolute bottom-5 left-5 rounded-2xl bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-panel backdrop-blur">
        {caption}
      </div>
    </div>
  );
}
