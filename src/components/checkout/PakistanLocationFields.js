import React, { useMemo } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import {
  PAKISTAN_PROVINCES,
  getCityOptionsForForm,
  normalizeProvinceName
} from '../../data/pakistanLocations';

/**
 * Cascading Pakistan province → city selects for checkout.
 * @param {{ control: import('react-hook-form').Control, setValue: import('react-hook-form').UseFormSetValue, errors: object }} props
 */
export default function PakistanLocationFields({ control, setValue, errors }) {
  const selectedState = useWatch({ control, name: 'state' });
  const selectedCity = useWatch({ control, name: 'city' });
  const normalizedState = normalizeProvinceName(selectedState);

  const cityOptions = useMemo(
    () => getCityOptionsForForm(normalizedState, selectedCity),
    [normalizedState, selectedCity]
  );

  return (
    <div className="checkout-location-fields">
      <div className="form-group">
        <label className="form-label" htmlFor="ship-state">
          Province / State
        </label>
        <Controller
          name="state"
          control={control}
          render={({ field }) => (
            <select
              id="ship-state"
              className={`form-control checkout-location-select${
                !field.value ? ' checkout-location-select--placeholder' : ''
              }`}
              autoComplete="address-level1"
              value={field.value || ''}
              onChange={(e) => {
                const next = e.target.value;
                field.onChange(next);
                setValue('city', '', { shouldValidate: true, shouldDirty: true });
              }}
            >
              <option value="" disabled>
                Select province
              </option>
              {PAKISTAN_PROVINCES.map((province) => (
                <option key={province.value} value={province.value}>
                  {province.label}
                </option>
              ))}
            </select>
          )}
        />
        {errors.state ? <p className="form-error">{errors.state.message}</p> : null}
        <p className="checkout-location-hint">Choose your province first — cities will update automatically.</p>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="ship-city">
          City
        </label>
        <Controller
          name="city"
          control={control}
          render={({ field }) => (
            <select
              id="ship-city"
              className={`form-control checkout-location-select${
                !field.value ? ' checkout-location-select--placeholder' : ''
              }`}
              autoComplete="address-level2"
              value={field.value || ''}
              disabled={!normalizedState}
              onChange={(e) => field.onChange(e.target.value)}
            >
              <option value="" disabled>
                {normalizedState ? 'Select city' : 'Select province first'}
              </option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          )}
        />
        {errors.city ? <p className="form-error">{errors.city.message}</p> : null}
        {normalizedState && cityOptions.length ? (
          <p className="checkout-location-hint">
            Showing cities in <strong>{normalizedState}</strong> only.
          </p>
        ) : null}
      </div>
    </div>
  );
}
