// En dev (vite dev) viene de VITE_API_URL (puerto del backend).
// En prod (servido bajo el mismo dominio) cae a "/api" y nginx hace proxy_pass.
const API = import.meta.env.VITE_API_URL || '/api';

export async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const palette = {
  bg:        '#FFF0F5',
  surface:   '#FFFFFF',
  border:    '#FFE0EC',
  primary:   '#C71585',
  accent:    '#FF69B4',
  soft:      '#FFB6C1',
  text:      '#4A1031',
  textSoft:  '#8E2C5C',
  errorBg:   '#FFE0E9',
  errorBd:   '#F8B4C8',
};
