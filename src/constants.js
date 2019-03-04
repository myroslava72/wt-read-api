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

const HOTEL_DESCRIPTION_FIELDS = [
  'name',
  'description',
  'location',
  'contacts',
  'address',
  'roomTypes',
  'timezone',
  'currency',
  'category',
  'spokenLanguages',
  'operator',
  'images',
  'amenities',
  'updatedAt',
  'defaultCancellationAmount',
  'cancellationPolicies',
];
const DEFAULT_AIRLINE_FIELDS = [
  'id',
  'name',
  'description',
  'code',
  'defaultCancellationAmount',
  'contacts',
  'currency',
];
const DEFAULT_AIRLINES_FIELDS = [
  'id',
  'name',
  'code',
  'defaultCancellationAmount',
  'contacts',
];

const AIRLINE_FIELDS = [
  'manager',
];

const AIRLINE_DESCRIPTION_FIELDS = [
  'name',
  'code',
  'description',
  'contacts',
  'currency',
  'updatedAt',
  'defaultCancellationAmount',
  'cancellationPolicies',
];

const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 300;

const DATA_FORMAT_VERSION = '0.2.0';
const SCHEMA_PATH = 'docs/swagger.yaml';
const HOTEL_SCHEMA_MODEL = 'HotelDetail';
const AIRLINE_SCHEMA_MODEL = 'AirlineDetail';
const ROOM_TYPE_MODEL = 'RoomType';
const RATE_PLAN_MODEL = 'RatePlan';
const AVAILABILITY_MODEL = 'AvailabilityForDay';
const FLIGHT_MODEL = 'Flight';
const FLIGHT_INSTANCE_MODEL = 'FlightInstance';
const VALIDATION_WARNING_HEADER = 'x-data-validation-warning';

const HOTEL_SEGMENT_ID = 'hotels';
const AIRLINE_SEGMENT_ID = 'airlines';
const ACCEPTED_SEGMENTS = [HOTEL_SEGMENT_ID, AIRLINE_SEGMENT_ID];

module.exports = {
  HOTEL_DESCRIPTION_FIELDS,
  HOTEL_FIELDS,
  DEFAULT_HOTELS_FIELDS,
  DEFAULT_HOTEL_FIELDS,
  AIRLINE_DESCRIPTION_FIELDS,
  AIRLINE_FIELDS,
  DEFAULT_AIRLINES_FIELDS,
  DEFAULT_AIRLINE_FIELDS,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  DATA_FORMAT_VERSION,
  SCHEMA_PATH,
  HOTEL_SCHEMA_MODEL,
  AIRLINE_SCHEMA_MODEL,
  ROOM_TYPE_MODEL,
  RATE_PLAN_MODEL,
  AVAILABILITY_MODEL,
  FLIGHT_MODEL,
  FLIGHT_INSTANCE_MODEL,
  VALIDATION_WARNING_HEADER,
  HOTEL_SEGMENT_ID,
  AIRLINE_SEGMENT_ID,
  ACCEPTED_SEGMENTS,
};
