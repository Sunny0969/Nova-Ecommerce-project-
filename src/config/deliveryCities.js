export const DELIVERY_CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi'];

export const DEFAULT_DELIVERY_CITY = 'Karachi';

export function matchDeliveryCity(name) {
  if (!name) return DEFAULT_DELIVERY_CITY;
  const raw = String(name).trim();
  if (!raw) return DEFAULT_DELIVERY_CITY;
  const hit = DELIVERY_CITIES.find((city) => raw.toLowerCase().includes(city.toLowerCase()));
  return hit || raw;
}

export function isListedDeliveryCity(name) {
  return DELIVERY_CITIES.includes(name);
}
