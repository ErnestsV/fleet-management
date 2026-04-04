import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Expand, LoaderCircle, Shrink } from 'lucide-react';
import clsx from 'clsx';
import { loadLeaflet } from '@/components/maps/leaflet';

export type MapVehicleMarker = {
  id: number | string;
  label: string;
  status?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  details?: string | null;
};

export type MapGeofenceCircle = {
  id: number | string;
  label: string;
  latitude: number;
  longitude: number;
  radiusM: number;
  isActive?: boolean;
};

export type MapFocusCircle = {
  latitude: number;
  longitude: number;
  radiusM: number;
};

type OperationsMapProps = {
  vehicleMarkers?: MapVehicleMarker[];
  geofenceCircles?: MapGeofenceCircle[];
  selectedVehicleId?: number | string | null;
  selectedGeofenceId?: number | string | null;
  vehicleFocusKey?: string | null;
  geofenceFocusKey?: string | null;
  focusedGeofenceCircle?: MapFocusCircle | null;
  caption?: string;
  emptyMessage?: string;
  heightClassName?: string;
  allowFullscreen?: boolean;
  fullscreenSidebar?: ReactNode;
  fullscreenSidebarTitle?: string;
  onVehicleSelect?: (vehicleId: number | string) => void;
  onGeofenceSelect?: (geofenceId: number | string) => void;
  onMapClick?: (coords: { latitude: number; longitude: number }) => void;
};

type MapCanvasProps = {
  vehicleMarkers: MapVehicleMarker[];
  geofenceCircles: MapGeofenceCircle[];
  selectedVehicleId: number | string | null;
  selectedGeofenceId: number | string | null;
  vehicleFocusKey: string | null;
  geofenceFocusKey: string | null;
  focusedGeofenceCircle: MapFocusCircle | null;
  caption: string;
  emptyMessage: string;
  heightClassName: string;
  onVehicleSelect?: (vehicleId: number | string) => void;
  onGeofenceSelect?: (geofenceId: number | string) => void;
  onMapClick?: (coords: { latitude: number; longitude: number }) => void;
  expandButton?: ReactNode;
};

const markerTone: Record<string, string> = {
  moving: '#16a34a',
  idling: '#d97706',
  stopped: '#0f172a',
  offline: '#dc2626',
};

function getGeofenceStyle(circle: MapGeofenceCircle, selectedGeofenceId: number | string | null) {
  const isSelected = circle.id === selectedGeofenceId;

  return {
    radius: circle.radiusM,
    color: isSelected ? '#2563eb' : circle.isActive === false ? '#94a3b8' : '#0f766e',
    weight: isSelected ? 3 : 2,
    fillColor: isSelected ? '#60a5fa' : circle.isActive === false ? '#cbd5e1' : '#2dd4bf',
    fillOpacity: circle.isActive === false ? 0.08 : 0.14,
  };
}

function buildVehicleMarkerHtml(marker: MapVehicleMarker, isSelected: boolean) {
  const tone = markerTone[marker.status ?? ''] ?? '#334155';
  const safeLabel = escapeLeafletHtml(marker.label);

  return `
    <div style="display:flex;align-items:center;gap:8px;transform:translate(-16px, -46px);">
      <div style="position:relative;width:26px;height:36px;filter:drop-shadow(0 10px 18px rgba(15,23,42,0.22));">
        <svg width="26" height="36" viewBox="0 0 26 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block">
          <path d="M13 35C13 35 24 23.4 24 13C24 6.92487 19.0751 2 13 2C6.92487 2 2 6.92487 2 13C2 23.4 13 35 13 35Z" fill="#ef4444" stroke="white" stroke-width="2"/>
          <circle cx="13" cy="13" r="4.5" fill="white"/>
        </svg>
        <div style="position:absolute;right:-2px;bottom:5px;width:8px;height:8px;border-radius:9999px;background:${tone};border:2px solid white;"></div>
      </div>
      <div style="padding:6px 10px;border-radius:9999px;background:${isSelected ? '#0f172a' : 'rgba(255,255,255,0.96)'};color:${isSelected ? 'white' : '#0f172a'};font-size:12px;font-weight:700;box-shadow:0 10px 24px rgba(15,23,42,0.12);white-space:nowrap;">
        ${safeLabel}
      </div>
    </div>
  `;
}

function isFiniteCoordinate(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function escapeLeafletHtml(value: string | null | undefined): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function MapCanvas({
  vehicleMarkers,
  geofenceCircles,
  selectedVehicleId,
  selectedGeofenceId,
  vehicleFocusKey,
  geofenceFocusKey,
  focusedGeofenceCircle,
  caption,
  emptyMessage,
  heightClassName,
  onVehicleSelect,
  onGeofenceSelect,
  onMapClick,
  expandButton,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const vehicleLayerRef = useRef<any>(null);
  const geofenceLayerRef = useRef<any>(null);
  const clickHandlerRef = useRef<any>(null);
  const vehicleMarkerRefs = useRef(new Map<number | string, any>());
  const geofenceCircleRefs = useRef(new Map<number | string, any>());
  const [mapState, setMapState] = useState<'loading' | 'ready' | 'error'>('loading');
  const hasFitBoundsRef = useRef(false);

  const validVehicleMarkers = useMemo(
    () => vehicleMarkers.filter((marker) => isFiniteCoordinate(marker.latitude) && isFiniteCoordinate(marker.longitude)),
    [vehicleMarkers],
  );
  const validGeofenceCircles = useMemo(
    () => geofenceCircles.filter((circle) => isFiniteCoordinate(circle.latitude) && isFiniteCoordinate(circle.longitude) && circle.radiusM > 0),
    [geofenceCircles],
  );
  const boundsKey = useMemo(
    () => [
      ...validVehicleMarkers.map((marker) => `v:${marker.id}`),
      ...validGeofenceCircles.map((circle) => `g:${circle.id}`),
    ].sort().join('|'),
    [validVehicleMarkers, validGeofenceCircles],
  );
  const selectedVehicleMarker = useMemo(
    () => validVehicleMarkers.find((marker) => marker.id === selectedVehicleId) ?? null,
    [selectedVehicleId, validVehicleMarkers],
  );
  const hasFocusedVehicleLocation = Boolean(
    vehicleFocusKey
    && selectedVehicleMarker
    && isFiniteCoordinate(selectedVehicleMarker.latitude)
    && isFiniteCoordinate(selectedVehicleMarker.longitude),
  );
  const hasFocusedGeofenceLocation = Boolean(
    geofenceFocusKey
    && focusedGeofenceCircle
    && isFiniteCoordinate(focusedGeofenceCircle.latitude)
    && isFiniteCoordinate(focusedGeofenceCircle.longitude)
    && focusedGeofenceCircle.radiusM > 0,
  );
  const fillsParentHeight = heightClassName.includes('h-full');

  const focusVehicle = () => {
    if (!mapRef.current || !selectedVehicleMarker || !isFiniteCoordinate(selectedVehicleMarker.latitude) || !isFiniteCoordinate(selectedVehicleMarker.longitude)) {
      return false;
    }

    mapRef.current.flyTo([selectedVehicleMarker.latitude, selectedVehicleMarker.longitude], Math.max(mapRef.current.getZoom(), 15), {
      animate: true,
      duration: 0.6,
    });

    return true;
  };

  const focusGeofence = () => {
    if (
      !mapRef.current
      || !focusedGeofenceCircle
      || !isFiniteCoordinate(focusedGeofenceCircle.latitude)
      || !isFiniteCoordinate(focusedGeofenceCircle.longitude)
      || focusedGeofenceCircle.radiusM <= 0
    ) {
      return false;
    }

    const L = window.L;

    if (!L) {
      return false;
    }

    const paddedRadius = Math.max(focusedGeofenceCircle.radiusM * 1.35, 250);
    const bounds = L.latLng(focusedGeofenceCircle.latitude, focusedGeofenceCircle.longitude).toBounds(paddedRadius * 2);

    mapRef.current.fitBounds(bounds, {
      maxZoom: 15,
      padding: [48, 48],
    });

    return true;
  };

  useEffect(() => {
    let cancelled = false;

    setMapState('loading');

    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) {
          return;
        }

        leafletRef.current = L;
        const map = L.map(containerRef.current, {
          zoomControl: true,
          attributionControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        vehicleLayerRef.current = L.layerGroup().addTo(map);
        geofenceLayerRef.current = L.layerGroup().addTo(map);
        map.setView([56.9496, 24.1052], 7);
        mapRef.current = map;
        setMapState('ready');
      })
      .catch(() => {
        if (!cancelled) {
          setMapState('error');
        }
      });

    return () => {
      cancelled = true;

      if (clickHandlerRef.current && mapRef.current) {
        mapRef.current.off('click', clickHandlerRef.current);
      }

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      vehicleMarkerRefs.current.clear();
      geofenceCircleRefs.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapState !== 'ready') {
      return;
    }

    const invalidateMap = () => {
      if (!mapRef.current) {
        return;
      }

      mapRef.current.invalidateSize(true);
      mapRef.current.setView(mapRef.current.getCenter(), mapRef.current.getZoom(), { animate: false });
    };

    const rafId = window.requestAnimationFrame(invalidateMap);
    const timeoutId = window.setTimeout(invalidateMap, 180);
    const lateTimeoutId = window.setTimeout(invalidateMap, 420);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
      window.clearTimeout(lateTimeoutId);
    };
  }, [mapState]);

  useEffect(() => {
    hasFitBoundsRef.current = false;
  }, [boundsKey]);

  useEffect(() => {
    if (!mapRef.current || !vehicleLayerRef.current || !geofenceLayerRef.current || mapState !== 'ready') {
      return;
    }

    loadLeaflet().then((L) => {
      leafletRef.current = L;
      vehicleLayerRef.current.clearLayers();
      geofenceLayerRef.current.clearLayers();
      vehicleMarkerRefs.current.clear();
      geofenceCircleRefs.current.clear();

      const latLngs: Array<[number, number]> = [];

      validGeofenceCircles.forEach((circle) => {
        latLngs.push([circle.latitude, circle.longitude]);

        const leafletCircle = L.circle([circle.latitude, circle.longitude], getGeofenceStyle(circle, selectedGeofenceId));

        leafletCircle.bindTooltip(escapeLeafletHtml(circle.label), { sticky: true });

        if (onGeofenceSelect) {
          leafletCircle.on('click', (event: any) => {
            event.originalEvent?.stopPropagation?.();
            onGeofenceSelect(circle.id);
          });
        }

        leafletCircle.addTo(geofenceLayerRef.current);
        geofenceCircleRefs.current.set(circle.id, leafletCircle);
      });

      validVehicleMarkers.forEach((marker) => {
        latLngs.push([marker.latitude as number, marker.longitude as number]);

        const leafletMarker = L.marker([marker.latitude, marker.longitude], {
          icon: L.divIcon({
            className: '',
            html: buildVehicleMarkerHtml(marker, selectedVehicleId === marker.id),
            iconSize: [0, 0],
          }),
        });

        leafletMarker.bindPopup(`
          <div style="min-width:160px">
            <div style="font-weight:700;margin-bottom:4px">${escapeLeafletHtml(marker.label)}</div>
            <div style="font-size:12px;color:#475569">${escapeLeafletHtml(marker.details ?? marker.status ?? 'Vehicle location')}</div>
          </div>
        `);

        if (onVehicleSelect) {
          leafletMarker.on('click', () => onVehicleSelect(marker.id));
        }

        leafletMarker.addTo(vehicleLayerRef.current);
        vehicleMarkerRefs.current.set(marker.id, leafletMarker);
      });

      if (clickHandlerRef.current) {
        mapRef.current.off('click', clickHandlerRef.current);
      }

      if (onMapClick) {
        clickHandlerRef.current = (event: any) => {
          onMapClick({
            latitude: event.latlng.lat,
            longitude: event.latlng.lng,
          });
        };
        mapRef.current.on('click', clickHandlerRef.current);
      } else {
        clickHandlerRef.current = null;
      }

      window.requestAnimationFrame(() => {
        if (!mapRef.current) {
          return;
        }

        if (hasFocusedVehicleLocation || hasFocusedGeofenceLocation) {
          return;
        }

        if (latLngs.length > 0 && !hasFitBoundsRef.current) {
          mapRef.current.fitBounds(latLngs, {
            padding: [36, 36],
            maxZoom: latLngs.length === 1 ? 14 : 15,
          });
          hasFitBoundsRef.current = true;
        }
      });
    });
  }, [
    validVehicleMarkers,
    validGeofenceCircles,
    mapState,
    onVehicleSelect,
    onGeofenceSelect,
    onMapClick,
  ]);

  useEffect(() => {
    if (!leafletRef.current || mapState !== 'ready') {
      return;
    }

    validVehicleMarkers.forEach((marker) => {
      const leafletMarker = vehicleMarkerRefs.current.get(marker.id);

      if (!leafletMarker) {
        return;
      }

      leafletMarker.setIcon(leafletRef.current.divIcon({
        className: '',
        html: buildVehicleMarkerHtml(marker, selectedVehicleId === marker.id),
        iconSize: [0, 0],
      }));
    });
  }, [mapState, selectedVehicleId, validVehicleMarkers]);

  useEffect(() => {
    validGeofenceCircles.forEach((circle) => {
      const leafletCircle = geofenceCircleRefs.current.get(circle.id);

      if (!leafletCircle) {
        return;
      }

      leafletCircle.setStyle(getGeofenceStyle(circle, selectedGeofenceId));
    });
  }, [selectedGeofenceId, validGeofenceCircles]);

  useEffect(() => {
    if (!mapRef.current || mapState !== 'ready' || !vehicleFocusKey || !hasFocusedVehicleLocation) {
      return;
    }

    focusVehicle();
  }, [mapState, vehicleFocusKey, hasFocusedVehicleLocation, selectedVehicleMarker]);

  useEffect(() => {
    if (!mapRef.current || mapState !== 'ready' || !geofenceFocusKey || !hasFocusedGeofenceLocation) {
      return;
    }

    focusGeofence();
  }, [mapState, geofenceFocusKey, hasFocusedGeofenceLocation, focusedGeofenceCircle]);

  return (
    <div className={clsx('relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-panel', fillsParentHeight ? 'h-full' : '')}>
      {expandButton ? <div className="absolute right-4 top-4 z-[1000]">{expandButton}</div> : null}

      <div ref={containerRef} className={clsx('w-full bg-slate-100', heightClassName)} />

      {mapState === 'loading' ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/78 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading map tiles...
          </div>
        </div>
      ) : null}

      {mapState === 'error' ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="max-w-sm rounded-3xl border border-rose-200 bg-rose-50 p-5 text-center text-sm text-rose-700">
            The map provider could not be loaded right now.
          </div>
        </div>
      ) : null}

      {mapState === 'ready' && validVehicleMarkers.length === 0 && validGeofenceCircles.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/82 backdrop-blur-[1px]">
          <div className="max-w-sm rounded-3xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-600 shadow-sm">
            {emptyMessage}
          </div>
        </div>
      ) : null}

      <div className="absolute bottom-5 left-5 right-5 z-[900] flex items-end justify-between gap-4">
        <div className="rounded-2xl bg-white/94 px-4 py-3 text-sm text-slate-600 shadow-sm backdrop-blur">
          {caption}
        </div>
      </div>
    </div>
  );
}

export function OperationsMap({
  vehicleMarkers = [],
  geofenceCircles = [],
  selectedVehicleId = null,
  selectedGeofenceId = null,
  vehicleFocusKey = null,
  geofenceFocusKey = null,
  focusedGeofenceCircle = null,
  caption = 'Operational map',
  emptyMessage = 'No map positions are available yet.',
  heightClassName = 'min-h-[360px]',
  allowFullscreen = false,
  fullscreenSidebar = null,
  fullscreenSidebarTitle,
  onVehicleSelect,
  onGeofenceSelect,
  onMapClick,
}: OperationsMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen]);

  const commonProps = {
    vehicleMarkers,
    geofenceCircles,
    selectedVehicleId,
    selectedGeofenceId,
    vehicleFocusKey,
    geofenceFocusKey,
    focusedGeofenceCircle,
    caption,
    emptyMessage,
    onVehicleSelect,
    onGeofenceSelect,
    onMapClick,
  };

  return (
    <>
      {!isFullscreen ? (
        <MapCanvas
          {...commonProps}
          heightClassName={heightClassName}
          expandButton={allowFullscreen ? (
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white/95 p-2 text-slate-700 shadow-sm backdrop-blur transition hover:bg-slate-50"
              onClick={() => setIsFullscreen(true)}
              aria-label="Expand map to full screen"
            >
              <Expand className="h-4 w-4" />
            </button>
          ) : null}
        />
      ) : null}

      {isFullscreen ? createPortal(
        <div className="fixed inset-0 z-50 bg-slate-100 p-4">
          <div className={clsx('grid h-full min-w-0 gap-4', fullscreenSidebar ? 'xl:grid-cols-[360px_minmax(0,1fr)]' : '')}>
            {fullscreenSidebar ? (
              <aside className="hidden min-h-0 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-panel xl:block">
                <div className="flex h-full min-h-0 flex-col overflow-hidden p-6">
                  {fullscreenSidebarTitle ? <div className="mb-4 text-lg font-semibold text-slate-950">{fullscreenSidebarTitle}</div> : null}
                  {fullscreenSidebar}
                </div>
              </aside>
            ) : null}

            <div className="min-w-0 h-full">
              <MapCanvas
                {...commonProps}
                heightClassName="h-full"
                expandButton={allowFullscreen ? (
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white/95 p-2 text-slate-700 shadow-sm backdrop-blur transition hover:bg-slate-50"
                    onClick={() => setIsFullscreen(false)}
                    aria-label="Exit full screen map"
                  >
                    <Shrink className="h-4 w-4" />
                  </button>
                ) : null}
              />
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
