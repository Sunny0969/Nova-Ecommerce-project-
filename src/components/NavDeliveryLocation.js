import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, MapPin, X } from 'lucide-react';
import { DELIVERY_CITIES, DEFAULT_DELIVERY_CITY, isListedDeliveryCity } from '../config/deliveryCities';
import { useDeliveryLocation } from '../context/DeliveryLocationContext';
import './NavDeliveryLocation.css';

export default function NavDeliveryLocation({ className = '' }) {
  const { city, detecting, detectError, setCity, locateMe } = useDeliveryLocation();
  const [open, setOpen] = useState(false);
  const [draftCity, setDraftCity] = useState(city);
  const wrapRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) setDraftCity(city);
  }, [city, open]);

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDoc);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDoc);
    };
  }, [open]);

  const displayCity = detecting ? 'Locating…' : city || DEFAULT_DELIVERY_CITY;
  const selectValue = isListedDeliveryCity(draftCity) ? draftCity : DELIVERY_CITIES[0];

  const handleLocateMe = async () => {
    const detected = await locateMe();
    if (detected) setDraftCity(detected);
  };

  const handleCityChange = (e) => {
    const next = e.target.value;
    setDraftCity(next);
    setCity(next, 'manual');
    setOpen(false);
  };

  return (
    <div className={`nav-location ${open ? 'nav-location--open' : ''} ${className}`.trim()} ref={wrapRef}>
      <button
        type="button"
        className="nav-location__trigger"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="nav-delivery-location-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <MapPin size={15} strokeWidth={2} aria-hidden="true" className="nav-location__pin" />
        <span className="nav-location__label" title={displayCity}>
          {displayCity}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          aria-hidden="true"
          className={`nav-location__chevron ${open ? 'nav-location__chevron--open' : ''}`}
        />
      </button>

      {open ? (
        <div
          id="nav-delivery-location-panel"
          className="nav-location__panel"
          role="dialog"
          aria-labelledby={titleId}
        >
            <div className="nav-location__dialog-head">
              <h2 id={titleId} className="nav-location__dialog-title">
                Delivery address
              </h2>
              <button
                type="button"
                className="nav-location__dialog-close"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p className="nav-location__dialog-lead">
              What&apos;s your exact location?{' '}
              <button
                type="button"
                className="nav-location__locate"
                onClick={handleLocateMe}
                disabled={detecting}
              >
                {detecting ? 'Locating…' : 'Locate Me'}
              </button>
            </p>

            {detectError ? <p className="nav-location__error">{detectError}</p> : null}

            <label className="nav-location__field-label" htmlFor="nav-delivery-city">
              City
            </label>
            <div className="nav-location__select-wrap">
              <select
                id="nav-delivery-city"
                className="nav-location__select"
                value={selectValue}
                onChange={handleCityChange}
              >
                {DELIVERY_CITIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} aria-hidden="true" className="nav-location__select-icon" />
            </div>
        </div>
      ) : null}
    </div>
  );
}
