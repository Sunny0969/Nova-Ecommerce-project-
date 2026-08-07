import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react';
import {
  DEFAULT_DELIVERY_CITY,
  matchDeliveryCity
} from '../config/deliveryCities';

const DeliveryLocationContext = createContext(null);

const STORAGE_KEY = 'nova_shop_delivery_city_v1';
const STORAGE_SOURCE_KEY = 'nova_shop_delivery_city_source_v1';

function loadStoredCity() {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function loadStoredSource() {
  try {
    const value = localStorage.getItem(STORAGE_SOURCE_KEY);
    return value === 'gps' || value === 'manual' ? value : 'manual';
  } catch {
    return 'manual';
  }
}

function persistCity(city, source) {
  try {
    localStorage.setItem(STORAGE_KEY, city);
    localStorage.setItem(STORAGE_SOURCE_KEY, source);
  } catch {
    // ignore
  }
}

async function reverseGeocodeCity(lat, lon) {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en'
    }
  });

  if (!res.ok) throw new Error('Reverse geocode failed');

  const data = await res.json();
  const address = data?.address || {};
  const candidate =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.state_district ||
    address.county ||
    address.state ||
    '';

  return matchDeliveryCity(candidate);
}

export function DeliveryLocationProvider({ children }) {
  const [city, setCityState] = useState(() => loadStoredCity());
  const [source, setSource] = useState(() => loadStoredSource());
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState('');

  const setCity = useCallback((next, nextSource = 'manual') => {
    const value = matchDeliveryCity(next);
    setCityState(value);
    setSource(nextSource);
    setDetectError('');
    persistCity(value, nextSource);
  }, []);

  const locateMe = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setDetectError('Location is not supported on this device.');
      return city;
    }

    setDetecting(true);
    setDetectError('');

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 300000
        });
      });

      const detected = await reverseGeocodeCity(
        position.coords.latitude,
        position.coords.longitude
      );

      setCity(detected, 'gps');
      return detected;
    } catch {
      setDetectError('Could not detect your location. Please choose a city.');
      if (!city) {
        setCity(DEFAULT_DELIVERY_CITY, 'manual');
      }
      return city || DEFAULT_DELIVERY_CITY;
    } finally {
      setDetecting(false);
    }
  }, [city, setCity]);

  const value = useMemo(
    () => ({
      city,
      source,
      detecting,
      detectError,
      setCity,
      locateMe
    }),
    [city, source, detecting, detectError, setCity, locateMe]
  );

  return (
    <DeliveryLocationContext.Provider value={value}>{children}</DeliveryLocationContext.Provider>
  );
}

export function useDeliveryLocation() {
  const ctx = useContext(DeliveryLocationContext);
  if (!ctx) {
    throw new Error('useDeliveryLocation must be used within DeliveryLocationProvider');
  }
  return ctx;
}
