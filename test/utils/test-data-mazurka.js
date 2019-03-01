const MAZURKA = {
  'dataFormatVersion': '0.2.0',
  'defaultLocale': 'en',
  'booking': 'https://mazurka-booking.windingtree.com',
  'description': {
    'dataFormatVersion': '0.2.0',
    'name': 'Hotel Mazurka',
    'description': 'Come to our family run hotel with clean and cosy rooms and excellent local food. Historical centre of Dragolm is within walking distance. Upon interest, we can arrange guided tours in Dragolm.',
    'location': {
      'latitude': 46.1929838,
      'longitude': 23.7898341
    },
    'contacts': {
      'general': {
        'email': 'windingtree-hotel-mazurka@mailinator.com',
        'phone': '+40213191564',
        'url': 'https://www.hotel-mazurka.com'
      }
    },
    'address': {
      'road': 'Transylvania Road',
      'houseNumber': '789',
      'postcode': '33312',
      'city': 'Dragolm',
      'countryCode': 'RO'
    },
    'operator': {
      'name': 'Dragolm Hotels Ltd.',
      'address': {
        'road': 'Transylvania Road',
        'houseNumber': '789',
        'postcode': '33312',
        'city': 'Dragolm',
        'countryCode': 'RO'
      },
      'contact': {
        'email': 'windingtree-hotel-mazurka@mailinator.com',
        'phone': '+40213191564',
        'url': 'https://www.hotel-mazurka.com'
      }
    },
    'spokenLanguages': ['en', 'ro'],
    'category': 'hotel',
    'timezone': 'Europe/Bucharest',
    'currency': 'RON',
    'amenities': [
      'restaurant',
      'vending machine',
      'parking'
    ],
    'images': [
      'building.jpg',
      'restaurant.jpg',
      'vending_machine.jpg'
    ],
    'roomTypes': [
      {
        'name': 'Single room - economy',
        'description': 'A small room with a single bed. The bathroom is located in the hallway and is shared with other rooms.',
        'totalQuantity': 6,
        'occupancy': {
          'min': 1,
          'max': 1
        },
        'amenities': [],
        'category': 'single room',
        'images': [
          'single_economy.jpg',
          'public_bathroom.jpg',
          'public_toilet.jpg'
        ],
        'properties': {
          'nonSmoking': 'all'
        },
        'id': 'single-room-economy'
      },
      {
        'name': 'Single room - standard',
        'description': 'Standard single-bed room with a private bathroom.',
        'totalQuantity': 6,
        'occupancy': {
          'min': 1,
          'max': 1
        },
        'amenities': [
          'TV'
        ],
        'category': 'single room',
        'images': [
          'single_bed.jpg',
          'private_bathroom.jpg'
        ],
        'properties': {
          'nonSmoking': 'all'
        },
        'id': 'single-room'
      },
      {
        'name': 'Double room',
        'description': 'Room with a double bed',
        'totalQuantity': 4,
        'occupancy': {
          'min': 1,
          'max': 2
        },
        'amenities': [
          'TV'
        ],
        'category': 'double room',
        'images': [
          'double_bed.jpg',
          'double_bed2.jpg',
          'private_bathroom.jpg'
        ],
        'properties': {
          'nonSmoking': 'all'
        },
        'id': 'double-room'
      },
      {
        'name': 'Family room',
        'description': 'A larger room with one double bed and two separate beds and a private bathroom.',
        'totalQuantity': 4,
        'occupancy': {
          'min': 2,
          'max': 4
        },
        'amenities': [
          'TV'
        ],
        'category': 'quadruple room',
        'images': [
          'double_bed3.jpg',
          'twin_beds.jpg',
          'private_bathroom.jpg'
        ],
        'properties': {
          'nonSmoking': 'all'
        },
        'id': 'family-room'
      }
    ],
    'defaultCancellationAmount': 0,
    'cancellationPolicies': []
  },
  'ratePlans': [
    {
      'name': 'Single room - economy',
      'description': 'Price per night for a single room in the economy variant.',
      'currency': 'RON',
      'price': 169,
      'roomTypeIds': [
        'single-room-economy'
      ],
      'availableForReservation': {
        'from': '2018-12-01',
        'to': '2019-05-02'
      },
      'availableForTravel': {
        'from': '2018-12-01',
        'to': '2019-11-29'
      },
      'id': 'single-room-economy',
      'restrictions': {}
    },
    {
      'name': 'Single room',
      'description': 'Price per night for a standard single room.',
      'currency': 'RON',
      'price': 228,
      'roomTypeIds': [
        'single-room'
      ],
      'availableForReservation': {
        'from': '2018-12-01',
        'to': '2019-11-26'
      },
      'availableForTravel': {
        'from': '2018-12-01',
        'to': '2019-05-22'
      },
      'id': 'single-room',
      'restrictions': {}
    },
    {
      'name': 'Double room',
      'description': 'Price per person per night for a double room.',
      'currency': 'RON',
      'price': 281,
      'roomTypeIds': [
        'double-room'
      ],
      'availableForReservation': {
        'from': '2018-12-01',
        'to': '2019-05-20'
      },
      'availableForTravel': {
        'from': '2018-12-01',
        'to': '2019-09-18'
      },
      'modifiers': [
      ],
      'id': 'double-room',
      'restrictions': {}
    },
    {
      'name': 'Family room',
      'description': 'Price per night for a family room.',
      'currency': 'RON',
      'price': 55,
      'roomTypeIds': [
        'family-room'
      ],
      'availableForReservation': {
        'from': '2018-12-01',
        'to': '2019-09-07'
      },
      'availableForTravel': {
        'from': '2018-12-01',
        'to': '2019-08-04'
      },
      'modifiers': [
        {
          'adjustment': -33,
          'unit': 'percentage',
          'conditions': {
            'minOccupants': 3
          }
        },
        {
          'adjustment': -50,
          'unit': 'percentage',
          'conditions': {
            'minOccupants': 4
          }
        },
        {
          'adjustment': -66.5,
          'unit': 'percentage',
          'conditions': {
            'minOccupants': 3,
            'maxAge': 10
          }
        },
        {
          'adjustment': -75,
          'unit': 'percentage',
          'conditions': {
            'minOccupants': 4,
            'maxAge': 10
          }
        }
      ],
      'id': 'family-room',
    }
  ],
  'availability': {
    'updatedAt': '2019-03-03 12:00:00',
    'roomTypes': [
      {
        'roomTypeId': 'single-room-economy',
        'date': '2019-03-01',
        'quantity': 1,
        'restrictions': {
          'noDeparture': true
        }
      },
      {
        'roomTypeId': 'single-room-economy',
        'date': '2019-03-02',
        'quantity': 3
      },
      {
        'roomTypeId': 'single-room-economy',
        'date': '2019-03-03',
        'quantity': 4
      },
      {
        'roomTypeId': 'single-room-economy',
        'date': '2019-03-04',
        'quantity': 5,
        'restrictions': {
          'noDeparture': true
        }
      },
      {
        'roomTypeId': 'single-room-economy',
        'date': '2019-03-05',
        'quantity': 4
      },
      {
        'roomTypeId': 'single-room-economy',
        'date': '2019-03-06',
        'quantity': 6
      },
      {
        'roomTypeId': 'single-room-economy',
        'date': '2019-03-07',
        'quantity': 2,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'single-room-economy',
        'date': '2019-03-08',
        'quantity': 1
      },
      {
        'roomTypeId': 'single-room-economy',
        'date': '2019-03-09',
        'quantity': 2,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'single-room-economy',
        'date': '2019-03-10',
        'quantity': 0,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'single-room-economy',
        'date': '2019-03-11',
        'quantity': 1
      },
      {
        'roomTypeId': 'single-room-economy',
        'date': '2019-03-12',
        'quantity': 6,
        'restrictions': {
          'noDeparture': true
        }
      },
      {
        'roomTypeId': 'single-room-economy',
        'date': '2019-03-13',
        'quantity': 4
      },
      {
        'roomTypeId': 'single-room-economy',
        'date': '2019-03-14',
        'quantity': 1,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'single-room-economy',
        'date': '2019-03-15',
        'quantity': 3,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'single-room-economy',
        'date': '2019-03-16',
        'quantity': 0,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'single-room-economy',
        'date': '2019-03-17',
        'quantity': 6
      },
      {
        'roomTypeId': 'single-room-economy',
        'date': '2019-03-18',
        'quantity': 4
      },
      {
        'roomTypeId': 'single-room-economy',
        'date': '2019-03-19',
        'quantity': 1
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-01',
        'quantity': 1
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-02',
        'quantity': 0
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-03',
        'quantity': 6
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-04',
        'quantity': 5,
        'restrictions': {
          'noDeparture': true
        }
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-05',
        'quantity': 3,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-06',
        'quantity': 5,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-07',
        'quantity': 0,
        'restrictions': {
          'noDeparture': true
        }
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-08',
        'quantity': 6
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-09',
        'quantity': 5
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-10',
        'quantity': 0,
        'restrictions': {
          'noDeparture': true
        }
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-11',
        'quantity': 5
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-12',
        'quantity': 1
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-13',
        'quantity': 6,
        'restrictions': {
          'noDeparture': true
        }
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-14',
        'quantity': 4,
        'restrictions': {
          'noDeparture': true
        }
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-15',
        'quantity': 3,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-16',
        'quantity': 6,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-17',
        'quantity': 4
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-18',
        'quantity': 2
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-19',
        'quantity': 3
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-20',
        'quantity': 3
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-21',
        'quantity': 4,
        'restrictions': {
          'noDeparture': true
        }
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-22',
        'quantity': 3
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-23',
        'quantity': 4
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-24',
        'quantity': 6
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-25',
        'quantity': 6
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-26',
        'quantity': 4
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-27',
        'quantity': 2
      },
      {
        'roomTypeId': 'single-room',
        'date': '2019-03-28',
        'quantity': 2
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-01',
        'quantity': 0
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-02',
        'quantity': 1
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-03',
        'quantity': 1,
        'restrictions': {
          'noDeparture': true
        }
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-04',
        'quantity': 1,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-05',
        'quantity': 2,
        'restrictions': {
          'noDeparture': true
        }
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-06',
        'quantity': 1
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-07',
        'quantity': 4,
        'restrictions': {
          'noDeparture': true
        }
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-08',
        'quantity': 0,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-09',
        'quantity': 3
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-10',
        'quantity': 1
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-11',
        'quantity': 0,
        'restrictions': {
          'noDeparture': true
        }
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-12',
        'quantity': 3
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-13',
        'quantity': 1
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-14',
        'quantity': 2
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-15',
        'quantity': 0,
        'restrictions': {
          'noDeparture': true
        }
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-16',
        'quantity': 1
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-17',
        'quantity': 1,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-18',
        'quantity': 2,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-19',
        'quantity': 0
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-20',
        'quantity': 2
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-21',
        'quantity': 4,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-22',
        'quantity': 4
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-23',
        'quantity': 4,
        'restrictions': {
          'noDeparture': true
        }
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-24',
        'quantity': 2,
        'restrictions': {
          'noDeparture': true
        }
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-25',
        'quantity': 0,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-26',
        'quantity': 1
      },
      {
        'roomTypeId': 'double-room',
        'date': '2019-03-27',
        'quantity': 2
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-01',
        'quantity': 2
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-02',
        'quantity': 4,
        'restrictions': {
          'noDeparture': true
        }
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-03',
        'quantity': 0
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-04',
        'quantity': 2
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-05',
        'quantity': 2
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-06',
        'quantity': 0
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-07',
        'quantity': 4
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-08',
        'quantity': 0,
        'restrictions': {
          'noDeparture': true
        }
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-09',
        'quantity': 2,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-10',
        'quantity': 2,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-11',
        'quantity': 2,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-12',
        'quantity': 0,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-13',
        'quantity': 3
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-14',
        'quantity': 0,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-15',
        'quantity': 4,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-16',
        'quantity': 3,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-17',
        'quantity': 0
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-18',
        'quantity': 2,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-19',
        'quantity': 0,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-20',
        'quantity': 1
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-21',
        'quantity': 1
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-22',
        'quantity': 3
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-23',
        'quantity': 4
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-24',
        'quantity': 1,
        'restrictions': {
          'noArrival': true
        }
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-25',
        'quantity': 4
      },
      {
        'roomTypeId': 'family-room',
        'date': '2019-03-26',
        'quantity': 0,
        'restrictions': {
          'noArrival': true
        }
      }
    ]
  }
};

const HOTEL_DESCRIPTION = MAZURKA.description;

const RATE_PLANS = MAZURKA.ratePlans;

const AVAILABILITY = MAZURKA.availability;

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
  updatedAt: '2019-03-01 10:00:00',
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
  updatedAt: '2019-03-01 10:00:00',
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
  updatedAt: '2019-03-01 10:00:00',
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
