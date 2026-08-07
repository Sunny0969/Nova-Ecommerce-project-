import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, MapPin, X } from 'lucide-react';
import { DELIVERY_CITIES, DEFAULT_DELIVERY_CITY, isListedDeliveryCity } from '../config/deliveryCities';
import { useDeliveryLocation } from '../context/DeliveryLocationContext';
import './NavDeliveryLocation.css';

function useMobileSheet() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return isMobile;
}

export default function NavDeliveryLocation({ className = '', tabIndex }) {
  const { city, detecting, detectError, setCity, locateMe } = useDeliveryLocation();
  const [open, setOpen] = useState(false);
  const [draftCity, setDraftCity] = useState(city);
  const wrapRef = useRef(null);
  const titleId = useId();
  const isMobileSheet = useMobileSheet();

  useEffect(() => {
    if (!open) setDraftCity(city);
  }, [city, open]);

  useEffect(() => {
    if (!open || !isMobileSheet) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isMobileSheet]);

  useEffect(() => {
    if (!open || isMobileSheet) return undefined;

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
  }, [open, isMobileSheet]);

  useEffect(() => {
    if (!open || !isMobileSheet) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, isMobileSheet]);

  const displayCity = detecting ? 'Locating…' : city || DEFAULT_DELIVERY_CITY;
  const selectValue = isListedDeliveryCity(draftCity) ? draftCity : DELIVERY_CITIES[0];

  const handleLocateMe = async () => {
    const detected = await locateMe();
    if (detected) setDraftCity(detected);
  };

  const handleCityPick = useCallback(
    (next) => {
      setDraftCity(next);
      setCity(next, 'manual');
      setOpen(false);
    },
    [setCity]
  );

  const panel = (
    <div
      id="nav-delivery-location-panel"
      className={`nav-location__panel${isMobileSheet ? ' nav-location__panel--sheet' : ''}`}
      role="dialog"
      aria-modal={isMobileSheet ? 'true' : undefined}
      aria-labelledby={titleId}
    >
      {isMobileSheet ? <div className="nav-location__sheet-handle" aria-hidden="true" /> : null}

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

      <p className="nav-location__field-label" id="nav-delivery-city-label">
        Select your city
      </p>
      <div className="nav-location__city-list" role="listbox" aria-labelledby="nav-delivery-city-label">
        {DELIVERY_CITIES.map((option) => {
          const selected = selectValue === option;
          return (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={selected}
              className={`nav-location__city-option${selected ? ' is-selected' : ''}`}
              onClick={() => handleCityPick(option)}
            >
              <span>{option}</span>
              {selected ? <Check size={18} strokeWidth={2.25} aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`nav-location ${open ? 'nav-location--open' : ''} ${className}`.trim()} ref={wrapRef}>
      <button
        type="button"
        className="nav-location__trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="nav-delivery-location-panel"
        tabIndex={tabIndex}
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

      {open && isMobileSheet
        ? createPortal(
            <>
              <button
                type="button"
                className="nav-location__backdrop"
                aria-label="Close delivery location"
                onClick={() => setOpen(false)}
              />
              {panel}
            </>,
            document.body
          )
        : null}

      {open && !isMobileSheet ? panel : null}
    </div>
  );
}
