const DEFAULT_HOTEL_FIELDS = [
  'id',
  'location',
  'name',
  'description',
  'contacts',
  'address',
  'currency',
  'images',
  'amenities',
  'updatedAt',
];
const DEFAULT_HOTELS_FIELDS = [
  'id',
  'location',
  'name',
];

const HOTEL_FIELDS = [
  'manager',
];

const DESCRIPTION_FIELDS = [
  'name',
  'description',
  'location',
  'contacts',
  'address',
  'roomTypes',
  'timezone',
  'currency',
  'images',
  'amenities',
  'updatedAt',
  'defaultCancellationAmount',
  'cancellationPolicies',
];

const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 300;
const SUPPORTED_DATA_FORMAT_VERSIONS = ['0.2.0'];
const SCHEMA_PATH = 'docs/swagger.yaml';
const HOTEL_SCHEMA_MODEL = 'HotelDetail';

module.exports = {
  DESCRIPTION_FIELDS,
  HOTEL_FIELDS,
  DEFAULT_HOTELS_FIELDS,
  DEFAULT_HOTEL_FIELDS,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  SUPPORTED_DATA_FORMAT_VERSIONS,
  SCHEMA_PATH,
  HOTEL_SCHEMA_MODEL,
};
