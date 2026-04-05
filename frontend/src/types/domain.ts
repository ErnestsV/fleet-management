export type UserRole = 'super_admin' | 'owner' | 'admin' | 'dispatcher' | 'viewer';

export type AuthUser = {
  id: number;
  company_id: number | null;
  name: string;
  email: string;
  role: UserRole;
  timezone: string;
  is_active: boolean;
  company?: {
    id: number;
    name: string;
    timezone: string;
  } | null;
};

export type Company = {
  id: number;
  name: string;
  slug: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
};

export type DashboardSummary = {
  total_vehicles: number;
  moving_vehicles: number;
  idling_vehicles: number;
  active_alerts: number;
  trips_today: number;
  distance_today_km: number;
  alerts_by_type: { type: string; count: number }[];
  distance_by_vehicle: { vehicle_id: number; label: string; distance_km: number }[];
  trips_over_time: { day: string; trip_count: number }[];
  fleet_efficiency: {
    selected_average_score: number;
    breakdown: { label: string; score: number }[];
  };
  fleet_utilization: {
    active_today: {
      count: number;
      percentage: number;
    };
    unused_over_3_days: {
      count: number;
      percentage: number;
    };
    idling_over_threshold: {
      count: number;
      percentage: number;
      threshold_hours: number;
    };
    no_trips_today: {
      count: number;
      percentage: number;
    };
    short_trips_only_today: {
      count: number;
      percentage: number;
      max_trip_km: number;
    };
  };
  driving_behaviour: {
    has_data: boolean;
    minimum_trip_samples: number;
    insufficient_vehicle_count: number;
    average_score: number | null;
    vehicle_scores: { vehicle_id: number; label: string; name: string; score: number }[];
    best_vehicles: { vehicle_id: number; label: string; name: string; score: number }[];
    worst_vehicles: { vehicle_id: number; label: string; name: string; score: number }[];
  };
  mileage: {
    yesterday_distance_km: number;
    previous_distance_km: number;
    delta_pct: number | null;
  };
  fuel: {
    trend: {
      day: string;
      avg_fuel_level_pct: number | null;
      distance_km: number | null;
      estimated_fuel_used_l: number | null;
      estimated_consumption_l_per_100km: number | null;
    }[];
    estimated_fuel_used_yesterday_l: number | null;
    estimated_fuel_used_previous_day_l: number | null;
    estimated_avg_consumption_yesterday_l_per_100km: number | null;
    estimated_avg_consumption_previous_day_l_per_100km: number | null;
    average_fuel_level_yesterday_pct: number | null;
    expected_consumption_l_per_100km: number;
    delta_used_pct: number | null;
  };
  working_time: {
    earliest_start: { label: string; time: string | null }[];
    latest_start: { label: string; time: string | null }[];
    earliest_end: { label: string; time: string | null }[];
    latest_end: { label: string; time: string | null }[];
  };
  fleet: {
    id: number;
    name: string;
    plate_number: string;
    make: string | null;
    model: string | null;
    status: string | null;
    latitude: number | null;
    longitude: number | null;
    heading: number | null;
    speed_kmh: number | null;
    fuel_level: number | null;
    engine_on: boolean | null;
    last_event_at: string | null;
    driver: string | null;
  }[];
};

export type DriverInsightsSummary = {
  window: {
    label: string;
    start: string;
    end: string;
  };
  headline: {
    active_drivers: number;
    total_distance_km: number;
    total_trips: number;
    average_trip_distance_km: number | null;
    average_trip_duration_minutes: number | null;
    total_drive_hours: number;
    after_hours_trip_count: number;
    average_score: number | null;
  };
  leaderboards: {
    top_drivers: { driver_id: number; label: string; score: number }[];
    needs_coaching: { driver_id: number; label: string; score: number }[];
    most_improved: { driver_id: number; label: string; score: number }[];
  };
  drivers: {
    driver_id: number;
    name: string;
    is_active: boolean;
    trip_count: number;
    distance_km: number;
    avg_trip_distance_km: number;
    avg_trip_duration_minutes: number;
    total_drive_hours: number;
    after_hours_trip_count: number;
    speeding_alerts: number;
    idling_alerts: number;
    score: number | null;
    previous_score: number | null;
    score_delta: number | null;
    has_activity: boolean;
  }[];
};

export type PaginatedResponse<T> = {
  data: T[];
  summary?: {
    trip_count: number;
    total_distance_km: number;
    average_trip_distance_km: number | null;
    average_trip_duration_minutes: number | null;
    total_drive_hours: number;
    after_hours_trip_count: number;
  };
  links?: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
  meta?: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
};

export type Vehicle = {
  id: number;
  company_id: number;
  name: string;
  plate_number: string;
  make: string | null;
  model: string | null;
  year: number | null;
  vin?: string | null;
  device_identifier: string | null;
  device_token?: {
    id: number;
    name: string;
    is_active: boolean;
    last_used_at: string | null;
  } | null;
  is_active: boolean;
  deleted_at?: string | null;
  state?: {
    status: string | null;
    latitude?: number | null;
    longitude?: number | null;
    speed_kmh: number | null;
    fuel_level?: number | null;
    heading?: number | null;
    engine_on: boolean | null;
    last_event_at: string | null;
  } | null;
  assigned_driver?: {
    id: number;
    name: string;
    assigned_from: string;
  } | null;
};

export type Driver = {
  id: number;
  company_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  license_number: string | null;
  license_expires_at: string | null;
  is_active: boolean;
  deleted_at?: string | null;
  assigned_vehicle?: {
    id: number;
    name: string;
    plate_number: string;
    assigned_from: string;
  } | null;
};

export type AlertItem = {
  id: number;
  company_id: number;
  type: string;
  severity: string;
  message: string;
  triggered_at: string;
  resolved_at: string | null;
  status: 'active' | 'resolved';
  vehicle?: {
    id: number;
    name: string;
    plate_number: string;
  } | null;
  rule?: {
    id: number;
    name: string;
  } | null;
  context?: Record<string, unknown> | null;
};

export type Trip = {
  id: number;
  company_id: number;
  vehicle_id: number;
  start_time: string;
  end_time: string | null;
  start_snapshot: Record<string, unknown> | null;
  end_snapshot: Record<string, unknown> | null;
  distance_km: number;
  duration_seconds: number;
  average_speed_kmh: number;
  vehicle?: {
    id: number;
    name: string;
    plate_number: string;
  } | null;
};

export type Assignment = {
  id: number;
  vehicle_id: number;
  driver_id: number;
  assigned_from: string;
  assigned_until: string | null;
  vehicle?: {
    id: number;
    name: string;
    plate_number: string;
  } | null;
  driver?: {
    id: number;
    name: string;
  } | null;
};

export type Geofence = {
  id: number;
  company_id: number;
  name: string;
  type: 'circle' | 'polygon';
  geometry: {
    center?: {
      lat: number;
      lng: number;
    };
    radius_m?: number;
    points?: { lat: number; lng: number }[];
  };
  is_active: boolean;
};

export type MaintenanceSchedule = {
  id: number;
  company_id: number;
  vehicle_id: number;
  name: string;
  interval_days: number | null;
  interval_km: number | null;
  next_due_date: string | null;
  next_due_odometer_km: number | null;
  is_active: boolean;
  vehicle?: {
    id: number;
    name: string;
    plate_number: string;
  } | null;
};

export type MaintenanceRecord = {
  id: number;
  company_id: number;
  vehicle_id: number;
  maintenance_schedule_id: number | null;
  title: string;
  service_date: string;
  odometer_km: number | null;
  cost_amount: number | null;
  currency: string;
  notes: string | null;
  vehicle?: {
    id: number;
    name: string;
    plate_number: string;
  } | null;
};
