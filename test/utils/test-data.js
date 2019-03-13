const HOTEL_DESCRIPTION = {
  'location': {
    'latitude': 35.89421911,
    'longitude': 139.94637467,
  },
  'name': 'string',
  'description': 'string',
  'category': 'hotel',
  'roomTypes': [
    {
      'id': 'room-type-1111',
      'name': 'room-type-1111 name',
      'description': 'room-type-1111 desc',
      'totalQuantity': 0,
      'occupancy': {
        'min': 1,
        'max': 3,
      },
      'amenities': [
        'tv',
      ],
      'images': [
        'string',
      ],
      'updatedAt': '2018-06-19T13:19:58.190Z',
      'properties': {
        'nonSmoking': 'some',
      },
    },
    {
      'id': 'room-type-2222',
      'name': 'room-type-2222 name',
      'description': 'room-type-2222 desc',
      'totalQuantity': 0,
      'occupancy': {
        'min': 1,
        'max': 3,
      },
      'amenities': [
        'tv',
      ],
      'images': [
        'string',
      ],
      'updatedAt': '2018-06-19T13:19:58.190Z',
      'properties': {
        'nonSmoking': 'some',
      },
    },
    {
      'id': 'room-type-3333',
      'name': 'string',
      'description': 'string',
      'totalQuantity': 0,
      'occupancy': {
        'min': 1,
        'max': 3,
      },
      'amenities': [
        'tv',
      ],
      'images': [
        'string',
      ],
      'updatedAt': '2018-06-19T13:19:58.190Z',
      'properties': {
        'nonSmoking': 'some',
      },
    },
  ],
  'contacts': {
    'general': {
      'email': 'joseph.urban@example.com',
      'phone': '44123456789',
      'url': 'string',
      'ethereum': 'string',
      'additionalContacts': [
        {
          'title': 'string',
          'value': 'string',
        },
      ],
    },
  },
  'address': {
    'road': 'string',
    'houseNumber': '1',
    'postcode': 'string',
    'city': 'string',
    'countryCode': 'CZ',
  },
  'timezone': 'string',
  'currency': 'usd',
  'images': [
    'string',
  ],
  'amenities': [
    'free wi-fi',
  ],
  'updatedAt': '2018-06-19T13:19:58.190Z',
  'defaultCancellationAmount': 0,
  'cancellationPolicies': [
    {
      'amount': 100,
    },
  ],
};

const RATE_PLANS = [
  {
    'id': 'rate-plan-1',
    'name': 'rate plan 1',
    'description': 'string',
    'currency': 'string',
    'price': 123,
    'roomTypeIds': [
      'room-type-1111',
    ],
    'updatedAt': '2018-07-09T09:22:54.548Z',
    'availableForReservation': {
      'from': '2018-07-08',
      'to': '2019-07-09',
    },
    'availableForTravel': {
      'from': '2018-07-09',
      'to': '2019-07-09',
    },
    'modifiers': [
      {
        'adjustment': -3.1,
        'unit': 'percentage',
        'conditions': {
          'from': '2018-01-30',
          'to': '2018-02-20',
          'minLengthOfStay': 2,
          'maxAge': 0,
        },
      },
    ],
    'restrictions': {
      'bookingCutOff': {
        'min': 0,
        'max': 5,
      },
      'lengthOfStay': {
        'min': 0,
        'max': 5,
      },
    },
  },
  {
    'id': 'rate-plan-2',
    'name': 'rate plan 2',
    'description': 'string',
    'currency': 'string',
    'price': 123,
    'roomTypeIds': [
      'room-type-3333',
    ],
    'updatedAt': '2018-07-09T09:22:54.548Z',
    'availableForReservation': {
      'from': '2018-07-08',
      'to': '2019-07-09',
    },
    'availableForTravel': {
      'from': '2018-07-09',
      'to': '2019-07-09',
    },
    'modifiers': [
      {
        'adjustment': -3.1,
        'unit': 'percentage',
        'conditions': {
          'from': '2018-01-30',
          'to': '2018-02-20',
          'minLengthOfStay': 2,
          'maxAge': 0,
        },
      },
    ],
    'restrictions': {
      'bookingCutOff': {
        'min': 0,
        'max': 5,
      },
      'lengthOfStay': {
        'min': 0,
        'max': 5,
      },
    },
  },
];

const AVAILABILITY = {
  'updatedAt': '2018-07-09T09:22:54.548Z',
  'roomTypes':
    [
      {
        'roomTypeId': 'room-type-1111',
        'date': '2018-07-07',
        'quantity': 8,
        'restrictions': {
          'noArrival': true,
        },
      },
      {
        'roomTypeId': 'room-type-1111',
        'date': '2018-07-08',
        'quantity': 7,
        'restrictions': {
          'noDeparture': true,
        },
      },
      {
        'roomTypeId': 'room-type-1111',
        'date': '2018-07-09',
        'quantity': 1,
      },
      {
        'roomTypeId': 'room-type-1111',
        'date': '2018-07-10',
        'quantity': 5,
      },
      {
        'roomTypeId': 'room-type-1111',
        'date': '2018-07-11',
        'quantity': 4,
      },
      {
        'roomTypeId': 'room-type-1111',
        'date': '2018-07-12',
        'quantity': 10,
      },
      {
        'roomTypeId': 'room-type-1111',
        'date': '2018-07-13',
        'quantity': 11,
      },
      {
        'roomTypeId': 'room-type-1111',
        'date': '2018-07-14',
        'quantity': 6,
        'restrictions': {
          'noArrival': true,
        },
      },
      {
        'roomTypeId': 'room-type-1111',
        'date': '2018-07-15',
        'quantity': 7,
        'restrictions': {
          'noDeparture': true,
        },
      },
      {
        'roomTypeId': 'room-type-2222',
        'date': '2018-07-07',
        'quantity': 2,
        'restrictions': {
          'noArrival': true,
        },
      },
      {
        'roomTypeId': 'room-type-2222',
        'date': '2018-07-08',
        'quantity': 2,
        'restrictions': {
          'noDeparture': true,
        },
      },
      {
        'roomTypeId': 'room-type-2222',
        'date': '2018-07-09',
        'quantity': 2,
      },
      {
        'roomTypeId': 'room-type-2222',
        'date': '2018-07-10',
        'quantity': 1,
      },
      {
        'roomTypeId': 'room-type-2222',
        'date': '2018-07-11',
        'quantity': 0,
      },
      {
        'roomTypeId': 'room-type-2222',
        'date': '2018-07-12',
        'quantity': 0,
      },
      {
        'roomTypeId': 'room-type-2222',
        'date': '2018-07-13',
        'quantity': 0,
      },
      {
        'roomTypeId': 'room-type-2222',
        'date': '2018-07-14',
        'quantity': 0,
        'restrictions': {
          'noArrival': true,
        },
      },
      {
        'roomTypeId': 'room-type-2222',
        'date': '2018-07-15',
        'quantity': 0,
        'restrictions': {
          'noDeparture': true,
        },
      },
    ],
};

const AIRLINE_DESCRIPTION = {
  name: 'Mazurka Airlines',
  code: 'MA',
  contacts: {
    general: {
      email: 'info@airline-mazurka.com',
      phone: '004078965423',
      url: 'https://www.airline-mazurka.com',
    },
  },
  id: '0xD8b8aF90986174d5c5558aAC0905AA1DB2Ee41ce',
  updatedAt: '2019-02-01 10:00:00',
  defaultCancellationAmount: 0,
};

const AIRLINE_FLIGHTS = {
  updatedAt: '2019-01-01 12:00:00',
  items: [
    {
      id: 'IeKeix6G',
      origin: 'PRG',
      destination: 'LAX',
      segments: [
        {
          id: 'segment1',
          departureAirport: 'PRG',
          arrivalAirport: 'CDG',
        },
        {
          id: 'segment2',
          departureAirport: 'CDG',
          arrivalAirport: 'LAX',
        },
      ],
      flightInstancesUri: 'in-memory://airline.com/flightinstancesone',
    },
    {
      id: 'IeKeix7H',
      origin: 'LON',
      destination: 'CAP',
      segments: [
        {
          id: 'segment1',
          departureAirport: 'LON',
          arrivalAirport: 'CAP',
        },
      ],
      flightInstancesUri: 'in-memory://airline.com/flightinstancestwo',
    },
  ],
};

const FLIGHT_INSTANCES = [{
  id: 'IeKeix6G-1',
  departureDateTime: '2018-12-10 12:00:00',
  updatedAt: '2019-02-01 10:00:00',
  bookingClasses: [
    { id: 'economy', availabilityCount: 100, fare: [{ amount: 50, currency: 'CZK' }], name: 'Economy' },
    { id: 'business', availabilityCount: 20, fare: [{ amount: 150, currency: 'CZK' }], name: 'Business' },
  ],
  segments: {
    'segment1': { departureDateTime: '2018-12-10 12:00:00', arrivalDateTime: '2018-12-10 15:00:00' },
    'segment2': { departureDateTime: '2018-12-10 20:00:00', arrivalDateTime: '2018-12-11 02:00:00' },
  },
}, {
  id: 'IeKeix6G-2',
  departureDateTime: '2018-12-24 12:00:00',
  updatedAt: '2019-02-01 10:00:00',
  bookingClasses: [
    { id: 'economy', availabilityCount: 100, fare: [{ amount: 50, currency: 'CZK' }], name: 'Economy' },
  ],
  segments: {
    'segment1': { departureDateTime: '2018-12-24 12:00:00', arrivalDateTime: '2018-12-24 15:00:00' },
    'segment2': { departureDateTime: '2018-12-24 20:00:00', arrivalDateTime: '2018-12-25 02:00:00' },
  },
}];

module.exports = {
  HOTEL_DESCRIPTION,
  RATE_PLANS,
  AVAILABILITY,
  AIRLINE_DESCRIPTION,
  AIRLINE_FLIGHTS,
  FLIGHT_INSTANCES,
};
