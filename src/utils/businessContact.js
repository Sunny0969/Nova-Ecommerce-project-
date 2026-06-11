/**
 * Public business identity — keep in sync with footer and Organization JSON-LD.
 */
export const businessDisplayName = 'Bazaar';

export const businessStreetAddress = 'Al Meeran Town, Citizen Colony';

export const businessAddressLocality = 'Hyderabad';

export const businessAddressRegion = 'Sindh';

export const businessAddressCountry = 'PK';

/** Local format shown in UI */
export const businessPhoneDisplay = '0348 3510584';

/** E.164 for tel:, wa.me, and WhatsApp links */
export const businessPhoneE164 = '+923483510584';

export function formatBusinessAddressLine() {
  return `${businessStreetAddress}, ${businessAddressLocality}`;
}
