/**
 * Public business identity — keep in sync with footer and Organization JSON-LD.
 */
export const businessDisplayName = 'Souvenir Handicraft Shop';

export const businessStreetAddress = 'Al Meeran Town, Citizen Colony';

export const businessAddressLocality = 'Hyderabad';

export const businessAddressRegion = 'Sindh';

export const businessAddressCountry = 'PK';

/** Local format shown in UI */
export const businessPhoneDisplay = '0334 2651544';

/** Digits only (for tel: and schema) */
export const businessPhoneE164 = '+923342651544';

export function formatBusinessAddressLine() {
  return `${businessStreetAddress}, ${businessAddressLocality}`;
}
