export type AiCopilotContext =
  | 'dashboard'
  | 'driver_insights'
  | 'fuel_insights'
  | 'telemetry_health'
  | 'geofence_analytics';

export type AiCopilotUiConfig = {
  context: AiCopilotContext;
  label: string;
  intro: string;
  placeholder: string;
  prompts: string[];
};

export function getAiCopilotUiConfig(pathname: string, search: string): AiCopilotUiConfig | null {
  if (pathname === '/') {
    return {
      context: 'dashboard',
      label: 'Fleet Copilot',
      intro: 'Ask about fleet risk, dashboard KPIs, alerts, or what needs attention first.',
      placeholder: 'Ask about dashboard risk, alerts, utilization, or driver insights...',
      prompts: [
        'Summarize the current dashboard.',
        'What should I focus on first today?',
        'Why is fleet risk high right now?',
        'Explain the active alerts in plain English.',
      ],
    };
  }

  if (pathname === '/driver-insights') {
    return {
      context: 'driver_insights',
      label: 'Driver Copilot',
      intro: 'Ask about driver scores, coaching candidates, top performers, and changes in the current insight window.',
      placeholder: 'Ask about coaching needs, score trends, or top drivers...',
      prompts: [
        'Which drivers need coaching this week?',
        'Who are the top drivers right now?',
        'Explain what is dragging driver scores down.',
        'Who improved the most in this window?',
      ],
    };
  }

  if (pathname === '/fuel-insights') {
    return {
      context: 'fuel_insights',
      label: 'Fuel Copilot',
      intro: 'Ask about active fuel anomalies, suspicious vehicles, and how to read the fuel thresholds on this page.',
      placeholder: 'Ask about suspicious fuel behavior or anomaly thresholds...',
      prompts: [
        'Which vehicles have the most suspicious fuel signals?',
        'Explain the active fuel anomalies.',
        'What do the fuel anomaly thresholds mean?',
        'Which anomaly type is most common right now?',
      ],
    };
  }

  if (pathname === '/telemetry-health') {
    return {
      context: 'telemetry_health',
      label: 'Telemetry Copilot',
      intro: 'Ask about freshness rate, stale devices, missing fields, and which vehicles need telemetry follow-up first.',
      placeholder: 'Ask about stale telemetry, missing data, or urgent devices...',
      prompts: [
        'Why is telemetry freshness low?',
        'Which vehicles need telemetry follow-up first?',
        'Explain the telemetry health statuses.',
        'What is causing low telemetry quality?',
      ],
    };
  }

  if (pathname === '/geofences' && new URLSearchParams(search).get('tab') === 'analytics') {
    return {
      context: 'geofence_analytics',
      label: 'Geofence Copilot',
      intro: 'Ask about visit counts, dwell time, and which geofences are currently the busiest or most operationally significant.',
      placeholder: 'Ask about dwell time, entries, exits, or active locations...',
      prompts: [
        'Which geofences had the longest dwell time?',
        'Which locations are visited most often?',
        'Summarize the geofence analytics.',
        'What geofence activity should I pay attention to?',
      ],
    };
  }

  return null;
}
