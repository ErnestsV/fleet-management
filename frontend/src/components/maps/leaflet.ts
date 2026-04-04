declare global {
  interface Window {
    L?: any;
    __leafletLoadPromise?: Promise<any>;
  }
}

const LEAFLET_SCRIPT_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const LEAFLET_STYLE_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

function ensureLeafletStylesheet() {
  if (document.querySelector('link[data-leaflet-styles]')) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = LEAFLET_STYLE_URL;
  link.setAttribute('data-leaflet-styles', 'true');
  document.head.appendChild(link);
}

export function loadLeaflet() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Leaflet requires a browser environment.'));
  }

  if (window.L) {
    return Promise.resolve(window.L);
  }

  if (window.__leafletLoadPromise) {
    return window.__leafletLoadPromise;
  }

  ensureLeafletStylesheet();

  window.__leafletLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-leaflet-script]');

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.L));
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Leaflet script.')));
      return;
    }

    const script = document.createElement('script');
    script.src = LEAFLET_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-leaflet-script', 'true');
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('Failed to load Leaflet script.'));
    document.head.appendChild(script);
  });

  return window.__leafletLoadPromise;
}
