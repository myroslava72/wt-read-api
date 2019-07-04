const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 300;

const SCHEMA_PATH = 'docs/swagger.yaml';
const VALIDATION_WARNING_HEADER = 'x-data-validation-warning';

const HOTEL_SCHEMA_MODEL = 'HotelDetail';
const AIRLINE_SCHEMA_MODEL = 'AirlineDetail';
const ANCILLARY_SCHEMA_MODEL = 'AncillaryDetail';
const ROOM_TYPE_MODEL = 'windingtree-wt-hotel-schemas-RoomType';
const RATE_PLAN_MODEL = 'windingtree-wt-hotel-schemas-RatePlan';
const AVAILABILITY_MODEL = 'windingtree-wt-hotel-schemas-AvailabilityForDay';
const FLIGHT_MODEL = 'windingtree-wt-airline-schemas-Flight';
const FLIGHT_INSTANCE_MODEL = 'windingtree-wt-airline-schemas-FlightInstance';
// const ANCILLARY_MODEL = 'windingtree-wt-ancillary-schemas-Ancillary';
// const ANCILLARY_INSTANCE_MODEL = 'windingtree-wt-ancillary-schemas-AncillariesInstance';

const HOTEL_SEGMENT_ID = 'hotels';
const AIRLINE_SEGMENT_ID = 'airlines';
const ANCILLARY_SEGMENT_ID = 'ancillaries';
const ACCEPTED_SEGMENTS = [HOTEL_SEGMENT_ID, AIRLINE_SEGMENT_ID, ANCILLARY_SEGMENT_ID];

module.exports = {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  SCHEMA_PATH,
  HOTEL_SCHEMA_MODEL,
  AIRLINE_SCHEMA_MODEL,
  ANCILLARY_SCHEMA_MODEL,
  ROOM_TYPE_MODEL,
  RATE_PLAN_MODEL,
  AVAILABILITY_MODEL,
  FLIGHT_MODEL,
  FLIGHT_INSTANCE_MODEL,
  VALIDATION_WARNING_HEADER,
  HOTEL_SEGMENT_ID,
  AIRLINE_SEGMENT_ID,
  ANCILLARY_SEGMENT_ID,
  ACCEPTED_SEGMENTS,
};
