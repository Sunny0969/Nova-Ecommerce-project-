/**
 * Pakistan provinces and major cities for checkout address cascading selects.
 * Cities are grouped by province — selecting Sindh will not show Lahore, etc.
 */
export const PAKISTAN_PROVINCES = [
  { value: 'Punjab', label: 'Punjab' },
  { value: 'Sindh', label: 'Sindh' },
  { value: 'Khyber Pakhtunkhwa', label: 'Khyber Pakhtunkhwa' },
  { value: 'Balochistan', label: 'Balochistan' },
  { value: 'Islamabad Capital Territory', label: 'Islamabad Capital Territory' },
  { value: 'Gilgit-Baltistan', label: 'Gilgit-Baltistan' },
  { value: 'Azad Jammu & Kashmir', label: 'Azad Jammu & Kashmir' }
];

/** @type {Record<string, string[]>} */
export const PAKISTAN_CITIES_BY_PROVINCE = {
  Punjab: [
    'Lahore',
    'Faisalabad',
    'Rawalpindi',
    'Multan',
    'Gujranwala',
    'Sialkot',
    'Bahawalpur',
    'Sargodha',
    'Sheikhupura',
    'Gujrat',
    'Jhelum',
    'Sahiwal',
    'Okara',
    'Kasur',
    'Narowal',
    'Dera Ghazi Khan',
    'Muzaffargarh',
    'Rahim Yar Khan',
    'Khanewal',
    'Wah Cantonment',
    'Hafizabad',
    'Mianwali',
    'Bhakkar',
    'Attock',
    'Chiniot',
    'Vehari',
    'Pakpattan',
    'Lodhran',
    'Chakwal',
    'Toba Tek Singh',
    'Jhang',
    'Mandi Bahauddin',
    'Nankana Sahib',
    'Kamoke',
    'Murree'
  ],
  Sindh: [
    'Karachi',
    'Hyderabad',
    'Sukkur',
    'Larkana',
    'Nawabshah',
    'Mirpur Khas',
    'Jacobabad',
    'Shikarpur',
    'Khairpur',
    'Dadu',
    'Thatta',
    'Badin',
    'Sanghar',
    'Umerkot',
    'Ghotki',
    'Matiari',
    'Tando Allahyar',
    'Tando Muhammad Khan',
    'Jamshoro'
  ],
  'Khyber Pakhtunkhwa': [
    'Peshawar',
    'Mardan',
    'Mingora',
    'Kohat',
    'Abbottabad',
    'Dera Ismail Khan',
    'Mansehra',
    'Swabi',
    'Nowshera',
    'Charsadda',
    'Bannu',
    'Haripur',
    'Timergara',
    'Tank',
    'Hangu',
    'Chitral',
    'Parachinar',
    'Batkhela'
  ],
  Balochistan: [
    'Quetta',
    'Turbat',
    'Khuzdar',
    'Chaman',
    'Hub',
    'Gwadar',
    'Sibi',
    'Loralai',
    'Zhob',
    'Dera Murad Jamali',
    'Usta Muhammad',
    'Kalat',
    'Mastung',
    'Panjgur'
  ],
  'Islamabad Capital Territory': ['Islamabad'],
  'Gilgit-Baltistan': [
    'Gilgit',
    'Skardu',
    'Hunza',
    'Ghizer',
    'Ghanche',
    'Astore',
    'Diamer',
    'Nagar',
    'Shigar',
    'Kharmang'
  ],
  'Azad Jammu & Kashmir': [
    'Muzaffarabad',
    'Mirpur',
    'Kotli',
    'Rawalakot',
    'Bagh',
    'Bhimber',
    'Hattian Bala',
    'Neelum',
    'Haveli',
    'Poonch',
    'Sudhnuti'
  ]
};

const PROVINCE_ALIASES = {
  punjab: 'Punjab',
  pb: 'Punjab',
  sindh: 'Sindh',
  sd: 'Sindh',
  kpk: 'Khyber Pakhtunkhwa',
  kp: 'Khyber Pakhtunkhwa',
  'khyber pakhtunkhwa': 'Khyber Pakhtunkhwa',
  balochistan: 'Balochistan',
  baluchistan: 'Balochistan',
  ict: 'Islamabad Capital Territory',
  islamabad: 'Islamabad Capital Territory',
  'islamabad capital territory': 'Islamabad Capital Territory',
  gb: 'Gilgit-Baltistan',
  'gilgit-baltistan': 'Gilgit-Baltistan',
  'gilgit baltistan': 'Gilgit-Baltistan',
  ajk: 'Azad Jammu & Kashmir',
  'azad kashmir': 'Azad Jammu & Kashmir',
  'azad jammu & kashmir': 'Azad Jammu & Kashmir',
  'azad jammu and kashmir': 'Azad Jammu & Kashmir'
};

/** Normalize free-text or legacy saved province to a known province value. */
export function normalizeProvinceName(input) {
  const raw = String(input || '').trim();
  if (!raw) return '';
  const exact = PAKISTAN_PROVINCES.find((p) => p.value.toLowerCase() === raw.toLowerCase());
  if (exact) return exact.value;
  const alias = PROVINCE_ALIASES[raw.toLowerCase()];
  if (alias) return alias;
  return raw;
}

/** @param {string} province */
export function getCitiesForProvince(province) {
  const key = normalizeProvinceName(province);
  return PAKISTAN_CITIES_BY_PROVINCE[key] ? [...PAKISTAN_CITIES_BY_PROVINCE[key]] : [];
}

/**
 * City options for the form — keeps a previously saved city visible even if not in the static list.
 * @param {string} province
 * @param {string} [selectedCity]
 */
export function getCityOptionsForForm(province, selectedCity = '') {
  const cities = getCitiesForProvince(province);
  const city = String(selectedCity || '').trim();
  if (city && !cities.some((c) => c.toLowerCase() === city.toLowerCase())) {
    return [city, ...cities];
  }
  return cities;
}

/** @param {string} province @param {string} city */
export function isCityInProvince(province, city) {
  const cities = getCitiesForProvince(province);
  const c = String(city || '').trim().toLowerCase();
  return cities.some((item) => item.toLowerCase() === c);
}
