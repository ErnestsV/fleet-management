export type AiCopilotContext =
  | 'dashboard'
  | 'driver_insights'
  | 'fuel_insights'
  | 'telemetry_health'
  | 'geofence_analytics'
  | 'alerts'
  | 'maintenance'
  | 'trips';

export type AiCopilotUiConfig = {
  context: AiCopilotContext;
  label: string;
  launcherLabel: string;
  scopeLabel: string;
  intro: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  placeholder: string;
  prompts: string[];
  suggestedActions: string[];
  followUps: string[];
};

export function getAiCopilotUiConfig(pathname: string, search: string): AiCopilotUiConfig | null {
  if (pathname === '/dashboard') {
    return {
      context: 'dashboard',
      label: 'Fleet Copilot',
      launcherLabel: 'Review fleet priorities',
      scopeLabel: 'Dashboard overview',
      intro: 'Ask about fleet risk, dashboard KPIs, alerts, or what needs attention first.',
      emptyStateTitle: 'Start with an operational summary',
      emptyStateDescription: 'Use the current dashboard KPIs, risk indicators, and active fleet signals to understand what needs attention first.',
      placeholder: 'Ask about dashboard risk, alerts, utilization, or driver insights...',
      prompts: [
        'Summarize the current dashboard.',
        'What should I focus on first today?',
        'Why is fleet risk high right now?',
        'Explain the active alerts in plain English.',
      ],
      suggestedActions: [
        'Give me the top 3 priorities from the dashboard.',
        'Summarize fleet risk in plain English.',
        'Explain what is hurting fleet efficiency right now.',
      ],
      followUps: [
        'Which vehicles or drivers need follow-up first?',
        'What should I review next after this?',
        'Turn that into a short operator checklist.',
      ],
    };
  }

  if (pathname === '/driver-insights') {
    return {
      context: 'driver_insights',
      label: 'Driver Copilot',
      launcherLabel: 'Review driver coaching',
      scopeLabel: 'Driver performance',
      intro: 'Ask about driver scores, coaching candidates, top performers, and changes in the current insight window.',
      emptyStateTitle: 'Turn scores into coaching actions',
      emptyStateDescription: 'Use the current driving behaviour data to identify coaching needs, strongest performers, and the metrics behind score movement.',
      placeholder: 'Ask about coaching needs, score trends, or top drivers...',
      prompts: [
        'Which drivers need coaching this week?',
        'Who are the top drivers right now?',
        'Explain what is dragging driver scores down.',
        'Who improved the most in this window?',
      ],
      suggestedActions: [
        'List the top coaching candidates and why.',
        'Summarize the strongest drivers in this window.',
        'Explain the main reasons scores are falling.',
      ],
      followUps: [
        'Which coaching action would have the biggest impact?',
        'Who should I recognize for strong performance?',
        'Give me a short coaching summary for dispatch.',
      ],
    };
  }

  if (pathname === '/fuel-insights') {
    return {
      context: 'fuel_insights',
      label: 'Fuel Copilot',
      launcherLabel: 'Review fuel anomalies',
      scopeLabel: 'Fuel anomaly analysis',
      intro: 'Ask about active fuel anomalies, suspicious vehicles, and how to read the fuel thresholds on this page.',
      emptyStateTitle: 'Inspect suspicious fuel behaviour',
      emptyStateDescription: 'Use current anomaly history and suspicious-vehicle signals to understand what looks abnormal and what should be investigated first.',
      placeholder: 'Ask about suspicious fuel behavior or anomaly thresholds...',
      prompts: [
        'Which vehicles have the most suspicious fuel signals?',
        'Explain the active fuel anomalies.',
        'What do the fuel anomaly thresholds mean?',
        'Which anomaly type is most common right now?',
      ],
      suggestedActions: [
        'Summarize the vehicles with the highest fuel risk.',
        'Explain the current active fuel anomalies.',
        'Tell me what should be investigated first.',
      ],
      followUps: [
        'Which anomalies look operationally urgent?',
        'What evidence supports those anomalies?',
        'Give me a short follow-up plan for fuel issues.',
      ],
    };
  }

  if (pathname === '/telemetry-health') {
    return {
      context: 'telemetry_health',
      label: 'Telemetry Copilot',
      launcherLabel: 'Review telemetry issues',
      scopeLabel: 'Telemetry health',
      intro: 'Ask about freshness rate, stale devices, missing fields, and which vehicles need telemetry follow-up first.',
      emptyStateTitle: 'Find devices that need telemetry follow-up',
      emptyStateDescription: 'Use freshness, missing-field, and reporting-quality signals to find which vehicles need technical attention first.',
      placeholder: 'Ask about stale telemetry, missing data, or urgent devices...',
      prompts: [
        'Why is telemetry freshness low?',
        'Which vehicles need telemetry follow-up first?',
        'Explain the telemetry health statuses.',
        'What is causing low telemetry quality?',
      ],
      suggestedActions: [
        'Tell me why telemetry freshness is low.',
        'List the most urgent telemetry follow-ups.',
        'Explain the current telemetry health picture.',
      ],
      followUps: [
        'Which issue is affecting the most vehicles?',
        'What should operations check first?',
        'Turn that into a short troubleshooting list.',
      ],
    };
  }

  if (pathname === '/alerts') {
    return {
      context: 'alerts',
      label: 'Alerts Copilot',
      launcherLabel: 'Review alert queue',
      scopeLabel: 'Alerts queue',
      intro: 'Ask about alert pressure, recent incidents, and which issues should be reviewed first.',
      emptyStateTitle: 'Prioritize the alert queue',
      emptyStateDescription: 'Use current alert counts, severities, and recent incidents to understand what is noise and what needs operator action first.',
      placeholder: 'Ask about active alerts, severity, or follow-up priorities...',
      prompts: [
        'What alert types need attention first right now?',
        'Summarize the current active alerts.',
        'Which recent alerts look most operationally important?',
        'What should an operator review first from this alert queue?',
      ],
      suggestedActions: [
        'Summarize the active alert queue.',
        'Tell me which alert types should be reviewed first.',
        'Give me a short operator priority list.',
      ],
      followUps: [
        'Which alerts look repetitive or noisy?',
        'What would you escalate first?',
        'Convert that into a shift handoff note.',
      ],
    };
  }

  if (pathname === '/maintenance') {
    return {
      context: 'maintenance',
      label: 'Maintenance Copilot',
      launcherLabel: 'Review maintenance pressure',
      scopeLabel: 'Maintenance backlog',
      intro: 'Ask about overdue schedules, upcoming service pressure, recent maintenance activity, and what should be prioritized.',
      emptyStateTitle: 'Turn service backlog into a plan',
      emptyStateDescription: 'Use overdue schedules, upcoming service load, and recent maintenance activity to identify which vehicles need service attention first.',
      placeholder: 'Ask about overdue maintenance, service backlog, or maintenance priorities...',
      prompts: [
        'Which maintenance items should be prioritized first?',
        'Summarize the maintenance backlog.',
        'What vehicles look most at risk from overdue service?',
        'Explain the current maintenance pressure in plain English.',
      ],
      suggestedActions: [
        'Summarize the maintenance backlog.',
        'Tell me which service items should be prioritized first.',
        'Explain the maintenance pressure in plain English.',
      ],
      followUps: [
        'Which overdue items create the most risk?',
        'What should the maintenance team do next?',
        'Give me a short action list for today.',
      ],
    };
  }

  if (pathname === '/trips') {
    return {
      context: 'trips',
      label: 'Trips Copilot',
      launcherLabel: 'Review trip activity',
      scopeLabel: 'Trip patterns',
      intro: 'Ask about recent trip activity, after-hours movement, notable long trips, and what the trip pattern suggests operationally.',
      emptyStateTitle: 'Interpret recent trip behaviour',
      emptyStateDescription: 'Use the latest trip activity to identify unusual movement, after-hours travel, and vehicles driving the highest operational load.',
      placeholder: 'Ask about trip volume, after-hours activity, or notable trips...',
      prompts: [
        'Summarize recent trip activity.',
        'Are there any concerning after-hours trip patterns?',
        'Which vehicles covered the most distance recently?',
        'What should I follow up on from recent trip behavior?',
      ],
      suggestedActions: [
        'Summarize recent trip activity.',
        'Tell me whether after-hours movement looks concerning.',
        'List the vehicles driving the most recent activity.',
      ],
      followUps: [
        'Which trips deserve operator follow-up?',
        'What looks unusual in this trip window?',
        'Turn that into a dispatch note.',
      ],
    };
  }

  if (pathname === '/geofences' && new URLSearchParams(search).get('tab') === 'analytics') {
    return {
      context: 'geofence_analytics',
      label: 'Geofence Copilot',
      launcherLabel: 'Review location activity',
      scopeLabel: 'Geofence analytics',
      intro: 'Ask about visit counts, dwell time, and which geofences are currently the busiest or most operationally significant.',
      emptyStateTitle: 'Interpret location and dwell patterns',
      emptyStateDescription: 'Use geofence entries, exits, and dwell time to identify busy locations, long stops, and sites that may need operational attention.',
      placeholder: 'Ask about dwell time, entries, exits, or active locations...',
      prompts: [
        'Which geofences had the longest dwell time?',
        'Which locations are visited most often?',
        'Summarize the geofence analytics.',
        'What geofence activity should I pay attention to?',
      ],
      suggestedActions: [
        'Summarize the current geofence analytics.',
        'Tell me which locations are busiest.',
        'Explain which dwell patterns need attention.',
      ],
      followUps: [
        'Which locations deserve investigation?',
        'What follow-up would you recommend?',
        'Turn that into a short site review summary.',
      ],
    };
  }

  return null;
}
