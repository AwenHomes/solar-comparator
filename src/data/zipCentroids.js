// ZIP3-prefix centroids for approximate lat/long lookup.
//
// Covers the ~930 active US ZIP3 prefixes is too large to bundle inline here,
// so this module takes a hybrid approach:
//
//   1. Per-state default centroid (usually the capital or a geographic midpoint)
//      is used when the ZIP3 is not known.
//   2. A curated set of high-volume metro ZIP3 prefixes is listed explicitly
//      where they differ materially from the state centroid (e.g. NYC vs
//      Albany for NY, LA vs Sacramento for CA).
//
// The backend `location-solar` Edge Function falls through to Nominatim for
// exact geocoding when higher precision is needed. This file exists so the
// browser can show a "approx. lat/long" preview before the round-trip.

// [lat, long] pairs — kept as arrays to reduce bundle size.
export const STATE_CENTROIDS = {
  AL: [32.806, -86.791, "Montgomery, AL"],
  AK: [63.588, -154.493, "Juneau, AK"],
  AZ: [33.729, -111.431, "Phoenix, AZ"],
  AR: [34.970, -92.373, "Little Rock, AR"],
  CA: [36.116, -119.682, "Sacramento, CA"],
  CO: [39.059, -105.311, "Denver, CO"],
  CT: [41.597, -72.755, "Hartford, CT"],
  DE: [39.318, -75.507, "Dover, DE"],
  FL: [27.766, -81.686, "Tallahassee, FL"],
  GA: [33.040, -83.643, "Atlanta, GA"],
  HI: [21.094, -157.498, "Honolulu, HI"],
  ID: [44.240, -114.479, "Boise, ID"],
  IL: [40.349, -88.986, "Springfield, IL"],
  IN: [39.849, -86.258, "Indianapolis, IN"],
  IA: [42.011, -93.210, "Des Moines, IA"],
  KS: [38.526, -96.726, "Topeka, KS"],
  KY: [37.668, -84.670, "Frankfort, KY"],
  LA: [31.169, -91.867, "Baton Rouge, LA"],
  ME: [44.693, -69.381, "Augusta, ME"],
  MD: [39.063, -76.802, "Annapolis, MD"],
  MA: [42.231, -71.530, "Boston, MA"],
  MI: [43.326, -84.536, "Lansing, MI"],
  MN: [45.694, -93.900, "St. Paul, MN"],
  MS: [32.741, -89.679, "Jackson, MS"],
  MO: [38.456, -92.288, "Jefferson City, MO"],
  MT: [46.921, -110.454, "Helena, MT"],
  NE: [41.125, -98.268, "Lincoln, NE"],
  NV: [38.313, -117.055, "Carson City, NV"],
  NH: [43.452, -71.563, "Concord, NH"],
  NJ: [40.298, -74.521, "Trenton, NJ"],
  NM: [34.840, -106.248, "Santa Fe, NM"],
  NY: [42.165, -74.948, "Albany, NY"],
  NC: [35.630, -79.806, "Raleigh, NC"],
  ND: [47.528, -99.784, "Bismarck, ND"],
  OH: [40.388, -82.764, "Columbus, OH"],
  OK: [35.565, -96.928, "Oklahoma City, OK"],
  OR: [44.572, -122.070, "Salem, OR"],
  PA: [40.590, -77.209, "Harrisburg, PA"],
  RI: [41.680, -71.511, "Providence, RI"],
  SC: [33.856, -80.945, "Columbia, SC"],
  SD: [44.299, -99.439, "Pierre, SD"],
  TN: [35.747, -86.692, "Nashville, TN"],
  TX: [31.054, -97.563, "Austin, TX"],
  UT: [40.150, -111.862, "Salt Lake City, UT"],
  VT: [44.045, -72.710, "Montpelier, VT"],
  VA: [37.769, -78.170, "Richmond, VA"],
  WA: [47.400, -121.490, "Olympia, WA"],
  WV: [38.491, -80.954, "Charleston, WV"],
  WI: [44.268, -89.616, "Madison, WI"],
  WY: [42.756, -107.302, "Cheyenne, WY"],
  DC: [38.907, -77.037, "Washington, DC"],
};

// High-volume metro ZIP3 overrides where the state centroid misleads.
// Keyed by 3-digit string.
export const ZIP3_OVERRIDES = {
  // California
  "900": [34.052, -118.244, "Los Angeles, CA"],
  "901": [34.052, -118.244, "Los Angeles, CA"],
  "902": [34.052, -118.244, "Los Angeles, CA"],
  "903": [33.814, -118.066, "Long Beach, CA"],
  "904": [34.011, -118.491, "Santa Monica, CA"],
  "905": [33.814, -118.066, "Long Beach, CA"],
  "906": [33.814, -118.066, "Long Beach, CA"],
  "907": [33.814, -118.066, "Long Beach, CA"],
  "908": [33.814, -118.066, "Long Beach, CA"],
  "910": [34.100, -118.150, "Pasadena, CA"],
  "917": [34.056, -117.752, "San Dimas, CA"],
  "918": [34.056, -117.752, "Pomona, CA"],
  "920": [32.716, -117.165, "San Diego, CA"],
  "921": [32.716, -117.165, "San Diego, CA"],
  "922": [33.743, -116.301, "Palm Springs, CA"],
  "923": [34.108, -117.289, "San Bernardino, CA"],
  "924": [34.108, -117.289, "San Bernardino, CA"],
  "925": [33.953, -117.396, "Riverside, CA"],
  "926": [33.745, -117.867, "Santa Ana, CA"],
  "927": [33.745, -117.867, "Santa Ana, CA"],
  "928": [33.745, -117.867, "Santa Ana, CA"],
  "930": [34.420, -119.696, "Santa Barbara, CA"],
  "931": [34.420, -119.696, "Santa Barbara, CA"],
  "932": [35.374, -119.019, "Bakersfield, CA"],
  "933": [35.374, -119.019, "Bakersfield, CA"],
  "934": [34.420, -119.696, "Santa Barbara, CA"],
  "935": [35.140, -118.440, "Mojave, CA"],
  "936": [36.746, -119.773, "Fresno, CA"],
  "937": [36.746, -119.773, "Fresno, CA"],
  "938": [36.746, -119.773, "Fresno, CA"],
  "939": [36.677, -121.655, "Salinas, CA"],
  "940": [37.775, -122.419, "San Francisco, CA"],
  "941": [37.775, -122.419, "San Francisco, CA"],
  "942": [37.775, -122.419, "San Francisco, CA"],
  "943": [37.429, -122.138, "Palo Alto, CA"],
  "944": [37.556, -122.272, "San Mateo, CA"],
  "945": [37.804, -122.271, "Oakland, CA"],
  "946": [37.804, -122.271, "Oakland, CA"],
  "947": [37.871, -122.272, "Berkeley, CA"],
  "948": [37.804, -122.271, "Richmond, CA"],
  "949": [38.104, -122.257, "Vallejo, CA"],
  "950": [37.338, -121.886, "San Jose, CA"],
  "951": [37.338, -121.886, "San Jose, CA"],
  "952": [37.974, -121.307, "Stockton, CA"],
  "953": [37.974, -121.307, "Stockton, CA"],
  "954": [38.440, -122.715, "Santa Rosa, CA"],
  "955": [40.801, -124.163, "Eureka, CA"],
  "956": [38.581, -121.493, "Sacramento, CA"],
  "957": [38.581, -121.493, "Sacramento, CA"],
  "958": [38.581, -121.493, "Sacramento, CA"],
  "959": [39.529, -121.555, "Marysville, CA"],
  "960": [40.586, -122.391, "Redding, CA"],
  "961": [39.164, -119.767, "South Lake Tahoe, CA"],

  // New York
  "100": [40.713, -74.006, "New York, NY"],
  "101": [40.713, -74.006, "New York, NY"],
  "102": [40.713, -74.006, "New York, NY"],
  "103": [40.579, -74.150, "Staten Island, NY"],
  "104": [40.837, -73.865, "Bronx, NY"],
  "110": [40.728, -73.795, "Queens, NY"],
  "111": [40.728, -73.795, "Queens, NY"],
  "112": [40.650, -73.950, "Brooklyn, NY"],
  "113": [40.728, -73.795, "Flushing, NY"],
  "114": [40.728, -73.795, "Jamaica, NY"],
  "115": [40.789, -73.135, "Long Island, NY"],
  "116": [40.789, -73.135, "Long Island, NY"],
  "117": [40.789, -73.135, "Long Island, NY"],
  "118": [40.789, -73.135, "Long Island, NY"],
  "119": [40.789, -73.135, "Long Island, NY"],
  "120": [42.653, -73.757, "Albany, NY"],
  "140": [42.886, -78.879, "Buffalo, NY"],
  "141": [42.886, -78.879, "Buffalo, NY"],
  "142": [42.886, -78.879, "Buffalo, NY"],
  "144": [43.156, -77.616, "Rochester, NY"],
  "145": [43.156, -77.616, "Rochester, NY"],
  "146": [43.156, -77.616, "Rochester, NY"],

  // Texas
  "750": [32.776, -96.797, "Dallas, TX"],
  "751": [32.776, -96.797, "Dallas, TX"],
  "752": [32.776, -96.797, "Dallas, TX"],
  "760": [32.756, -97.331, "Fort Worth, TX"],
  "761": [32.756, -97.331, "Fort Worth, TX"],
  "770": [29.760, -95.369, "Houston, TX"],
  "771": [29.760, -95.369, "Houston, TX"],
  "772": [29.760, -95.369, "Houston, TX"],
  "773": [29.760, -95.369, "Houston, TX"],
  "774": [29.760, -95.369, "Houston, TX"],
  "775": [29.760, -95.369, "Houston, TX"],
  "776": [30.078, -94.126, "Beaumont, TX"],
  "777": [30.078, -94.126, "Beaumont, TX"],
  "778": [30.628, -96.334, "Bryan, TX"],
  "780": [29.424, -98.494, "San Antonio, TX"],
  "781": [29.424, -98.494, "San Antonio, TX"],
  "782": [29.424, -98.494, "San Antonio, TX"],
  "787": [30.267, -97.743, "Austin, TX"],
  "788": [30.267, -97.743, "Austin, TX"],
  "789": [30.267, -97.743, "Austin, TX"],
  "790": [35.222, -101.831, "Amarillo, TX"],
  "791": [35.222, -101.831, "Amarillo, TX"],
  "792": [33.578, -101.855, "Lubbock, TX"],
  "793": [33.578, -101.855, "Lubbock, TX"],
  "794": [33.578, -101.855, "Lubbock, TX"],
  "795": [31.998, -102.078, "Midland, TX"],
  "796": [31.998, -102.078, "Midland, TX"],
  "797": [31.750, -106.488, "El Paso, TX"],
  "798": [31.750, -106.488, "El Paso, TX"],
  "799": [31.750, -106.488, "El Paso, TX"],

  // Florida
  "320": [30.332, -81.656, "Jacksonville, FL"],
  "321": [28.391, -80.605, "Cocoa Beach, FL"],
  "322": [30.332, -81.656, "Jacksonville, FL"],
  "323": [30.438, -84.281, "Tallahassee, FL"],
  "324": [30.438, -84.281, "Tallahassee, FL"],
  "325": [30.420, -87.217, "Pensacola, FL"],
  "326": [29.652, -82.325, "Gainesville, FL"],
  "327": [28.538, -81.379, "Orlando, FL"],
  "328": [28.538, -81.379, "Orlando, FL"],
  "329": [28.538, -81.379, "Orlando, FL"],
  "330": [25.761, -80.192, "Miami, FL"],
  "331": [25.761, -80.192, "Miami, FL"],
  "332": [25.761, -80.192, "Miami, FL"],
  "333": [26.122, -80.137, "Fort Lauderdale, FL"],
  "334": [26.709, -80.064, "West Palm Beach, FL"],
  "335": [27.950, -82.457, "Tampa, FL"],
  "336": [27.950, -82.457, "Tampa, FL"],
  "337": [27.950, -82.457, "Tampa, FL"],
  "338": [28.039, -81.949, "Lakeland, FL"],
  "339": [26.640, -81.872, "Fort Myers, FL"],
  "342": [27.336, -82.531, "Sarasota, FL"],
  "346": [27.336, -82.531, "Port Charlotte, FL"],
  "347": [28.538, -81.379, "Ocala, FL"],
  "349": [27.178, -80.253, "Stuart, FL"],

  // Illinois
  "600": [41.878, -87.630, "Chicago, IL"],
  "601": [41.878, -87.630, "Chicago, IL"],
  "602": [41.878, -87.630, "Chicago, IL"],
  "603": [41.878, -87.630, "Chicago, IL"],
  "604": [41.878, -87.630, "Chicago, IL"],
  "605": [41.878, -87.630, "Chicago, IL"],
  "606": [41.878, -87.630, "Chicago, IL"],
  "617": [40.115, -88.273, "Champaign, IL"],
  "619": [38.540, -89.984, "Belleville, IL"],
  "625": [39.802, -89.644, "Springfield, IL"],

  // Massachusetts
  "021": [42.360, -71.058, "Boston, MA"],
  "022": [42.360, -71.058, "Boston, MA"],
  "023": [42.250, -71.805, "Worcester, MA"],
  "024": [42.360, -71.058, "Boston, MA"],

  // Washington
  "980": [47.606, -122.332, "Seattle, WA"],
  "981": [47.606, -122.332, "Seattle, WA"],
  "982": [47.606, -122.332, "Seattle, WA"],
  "983": [47.253, -122.442, "Tacoma, WA"],
  "984": [47.253, -122.442, "Tacoma, WA"],
  "985": [47.037, -122.901, "Olympia, WA"],
  "986": [45.588, -122.594, "Vancouver, WA"],
  "990": [47.659, -117.425, "Spokane, WA"],
  "991": [47.659, -117.425, "Spokane, WA"],
  "992": [47.659, -117.425, "Spokane, WA"],

  // Arizona
  "850": [33.448, -112.074, "Phoenix, AZ"],
  "851": [33.448, -112.074, "Phoenix, AZ"],
  "852": [33.448, -112.074, "Phoenix, AZ"],
  "853": [33.448, -112.074, "Phoenix, AZ"],
  "855": [33.448, -112.074, "Phoenix, AZ"],
  "856": [32.222, -110.967, "Tucson, AZ"],
  "857": [32.222, -110.967, "Tucson, AZ"],
  "859": [35.199, -111.651, "Flagstaff, AZ"],

  // Colorado
  "800": [39.739, -104.990, "Denver, CO"],
  "801": [39.739, -104.990, "Denver, CO"],
  "802": [39.739, -104.990, "Denver, CO"],
  "803": [40.015, -105.270, "Boulder, CO"],
  "805": [40.584, -105.084, "Fort Collins, CO"],
  "808": [38.834, -104.821, "Colorado Springs, CO"],
  "809": [38.254, -104.609, "Pueblo, CO"],

  // Georgia
  "300": [33.749, -84.388, "Atlanta, GA"],
  "301": [33.749, -84.388, "Atlanta, GA"],
  "302": [33.749, -84.388, "Atlanta, GA"],
  "303": [33.749, -84.388, "Atlanta, GA"],
  "304": [32.081, -81.091, "Savannah, GA"],
  "305": [32.478, -84.946, "Columbus, GA"],
  "306": [31.578, -84.156, "Albany, GA"],

  // New Jersey
  "070": [40.736, -74.172, "Newark, NJ"],
  "071": [40.736, -74.172, "Newark, NJ"],
  "072": [40.736, -74.172, "Newark, NJ"],
  "073": [40.736, -74.172, "Jersey City, NJ"],
  "074": [40.736, -74.172, "Newark, NJ"],
  "080": [39.940, -74.995, "Camden, NJ"],
  "085": [40.217, -74.743, "Trenton, NJ"],

  // Pennsylvania
  "190": [39.952, -75.165, "Philadelphia, PA"],
  "191": [39.952, -75.165, "Philadelphia, PA"],
  "192": [39.952, -75.165, "Philadelphia, PA"],
  "150": [40.441, -79.996, "Pittsburgh, PA"],
  "151": [40.441, -79.996, "Pittsburgh, PA"],
  "152": [40.441, -79.996, "Pittsburgh, PA"],

  // Nevada
  "890": [36.172, -115.139, "Las Vegas, NV"],
  "891": [36.172, -115.139, "Las Vegas, NV"],
  "894": [39.529, -119.813, "Reno, NV"],
  "895": [39.529, -119.813, "Reno, NV"],

  // Oregon
  "970": [45.523, -122.676, "Portland, OR"],
  "971": [45.523, -122.676, "Portland, OR"],
  "972": [45.523, -122.676, "Portland, OR"],
  "973": [44.942, -123.035, "Salem, OR"],
  "974": [44.052, -123.087, "Eugene, OR"],

  // Hawaii
  "967": [21.307, -157.858, "Honolulu, HI"],
  "968": [21.307, -157.858, "Honolulu, HI"],
};

// Resolve a ZIP code to approximate [lat, long, label]. Falls through from
// ZIP3 override → state centroid → null.
export function resolveZip(zip, state) {
  if (zip && zip.length >= 3) {
    const key = zip.slice(0, 3);
    if (ZIP3_OVERRIDES[key]) return ZIP3_OVERRIDES[key];
  }
  if (state && STATE_CENTROIDS[state]) return STATE_CENTROIDS[state];
  return null;
}
