import { PropsWithChildren, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useAuthStore } from '@/app/store/authStore';

type FleetUpdatedEvent = {
  topics?: string[];
};

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

const topicQueryKeys: Record<string, string[][]> = {
  alerts: [['alerts'], ['dashboard-summary']],
  assignments: [['assignments'], ['drivers'], ['vehicles']],
  'dashboard-summary': [['dashboard-summary']],
  'driver-insights': [['driver-insights'], ['dashboard-summary']],
  drivers: [['drivers'], ['driver']],
  'fuel-insights': [['fuel-insights'], ['alerts'], ['dashboard-summary']],
  'geofence-analytics': [['geofence-analytics'], ['dashboard-summary']],
  geofences: [['geofences'], ['geofence-analytics'], ['dashboard-summary']],
  maintenance: [['maintenance-records'], ['maintenance-schedules'], ['maintenance-upcoming'], ['alerts'], ['dashboard-summary']],
  'telemetry-health': [['telemetry-health'], ['dashboard-summary']],
  trips: [['trips'], ['trip'], ['vehicle-trips'], ['dashboard-summary']],
  vehicles: [['vehicles'], ['vehicle'], ['dashboard-summary']],
};

function resolveApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:8000/api/v1' : '/api/v1');
}

function resolveBroadcastAuthEndpoint(): string {
  const apiBaseUrl = resolveApiBaseUrl();

  try {
    const url = new URL(apiBaseUrl, window.location.origin);
    url.pathname = url.pathname.replace(/\/api\/v1\/?$/, '/broadcasting/auth');
    url.search = '';

    return url.toString();
  } catch {
    return '/broadcasting/auth';
  }
}

function resolveSocketConfig() {
  const scheme = import.meta.env.VITE_REVERB_SCHEME ?? (window.location.protocol === 'https:' ? 'https' : 'http');
  const isSecure = scheme === 'https';
  const fallbackPort = isSecure ? '443' : '80';

  return {
    authEndpoint: resolveBroadcastAuthEndpoint(),
    forceTLS: isSecure,
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? fallbackPort),
  };
}

export function FleetRealtimeProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? user?.company_id ?? null;
  const flushTimeoutRef = useRef<number | null>(null);
  const pendingTopicsRef = useRef<Set<string>>(new Set());
  const echoRef = useRef<Echo<'reverb'> | null>(null);
  const isRealtimeEnabled = useMemo(
    () => Boolean(token && user && user.role !== 'super_admin' && companyId && import.meta.env.VITE_REVERB_APP_KEY),
    [companyId, token, user],
  );

  useEffect(() => {
    window.Pusher = Pusher;
  }, []);

  useEffect(() => {
    return () => {
      if (flushTimeoutRef.current !== null) {
        window.clearTimeout(flushTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (! isRealtimeEnabled || ! companyId || ! token) {
      echoRef.current?.disconnect();
      echoRef.current = null;
      pendingTopicsRef.current.clear();

      if (flushTimeoutRef.current !== null) {
        window.clearTimeout(flushTimeoutRef.current);
        flushTimeoutRef.current = null;
      }

      return;
    }

    const config = resolveSocketConfig();

    if (! config.key) {
      return;
    }

    const flush = () => {
      const topics = Array.from(pendingTopicsRef.current);

      pendingTopicsRef.current.clear();
      flushTimeoutRef.current = null;

      if (topics.length === 0) {
        return;
      }

      const queryKeys = new Map<string, string[]>();

      topics.forEach((topic) => {
        (topicQueryKeys[topic] ?? []).forEach((queryKey) => {
          queryKeys.set(queryKey.join(':'), queryKey);
        });
      });

      queryKeys.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    };

    const queueTopics = (event: FleetUpdatedEvent) => {
      (event.topics ?? []).forEach((topic) => pendingTopicsRef.current.add(topic));

      if (flushTimeoutRef.current !== null) {
        return;
      }

      flushTimeoutRef.current = window.setTimeout(flush, 750);
    };

    const echo = new Echo({
      broadcaster: 'reverb',
      key: config.key,
      wsHost: config.wsHost,
      wsPort: config.wsPort,
      wssPort: config.wsPort,
      forceTLS: config.forceTLS,
      enabledTransports: ['ws', 'wss'],
      authEndpoint: config.authEndpoint,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    echo.private(`company.${companyId}`).listen('.fleet.updated', queueTopics);
    echoRef.current = echo;

    return () => {
      if (flushTimeoutRef.current !== null) {
        window.clearTimeout(flushTimeoutRef.current);
        flushTimeoutRef.current = null;
      }

      pendingTopicsRef.current.clear();
      echo.leave(`company.${companyId}`);
      echo.disconnect();

      if (echoRef.current === echo) {
        echoRef.current = null;
      }
    };
  }, [companyId, isRealtimeEnabled, queryClient, token]);

  return children;
}
