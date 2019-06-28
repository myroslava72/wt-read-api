[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![Greenkeeper badge](https://badges.greenkeeper.io/windingtree/wt-read-api.svg)](https://greenkeeper.io/)
# WT Read API
API written in nodejs to fetch information from the Winding Tree platform.

## Requirements
- Nodejs >=10

## Development
In order to install and run tests, we must:
```
git clone git@github.com:windingtree/wt-read-api.git
nvm install
npm install
npm run resolve-swagger-references
npm test
```

### Running in dev mode
With all the dependencies installed, you can start the dev server.
First step is starting [Ganache](https://github.com/trufflesuite/ganache)
(local Ethereum network node). You can skip this step if you have a different
network already running.
```bash
npm run dev-net
```

If you need to interact (for example add some testing hotels) with the running dev-net
in any way, you can use the Winding Tree demo wallet protected by password `windingtree`.
It is initialized with enough ether. For sample interaction scripts, check out our
[Developer guides](https://github.com/windingtree/wiki/tree/master/developer-guides).

**!!!NEVER USE THIS WALLET FOR ANYTHING IN PRODUCTION!!!** Anyone has access to it.

```js
{"version":3,"id":"7fe84016-4686-4622-97c9-dc7b47f5f5c6","address":"d037ab9025d43f60a31b32a82e10936f07484246","crypto":{"ciphertext":"ef9dcce915eeb0c4f7aa2bb16b9ae6ce5a4444b4ed8be45d94e6b7fe7f4f9b47","cipherparams":{"iv":"31b12ef1d308ea1edacc4ab00de80d55"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"d06ccd5d9c5d75e1a66a81d2076628f5716a3161ca204d92d04a42c057562541","n":8192,"r":8,"p":1},"mac":"2c30bc373c19c5b41385b85ffde14b9ea9f0f609c7812a10fdcb0a565034d9db"}};
```

Now we can run our dev server.
```bash
npm run dev
```
When using a `dev` config, we internally run a script to deploy
contracts. It is not immediate, so you might experience some errors in a
first few seconds. And that's the reason why it is not used in the same
manner in tests.

You can then visit [http://localhost:3000/docs/](http://localhost:3000/docs/) to interact
with the live server. An [OAS](https://github.com/OAI/OpenAPI-Specification) description is published there.

You can tweak with the configuration in `src/config/`.

## Running this server

### Docker

You can run the whole API in a docker container, and you can
control which config will be used by passing an appropriate value
to WT_CONFIG variable at runtime.

```sh
$ docker build -t windingtree/wt-read-api .
$ docker run -p 8080:3000 -e ETH_NETWORK_PROVIDER=address_to_node -e WT_CONFIG=playground windingtree/wt-read-api
```
After that you can access the wt-read-api on local port `8080`. This deployment
is using a Ropsten configuration that can be found in `src/config/playground.js`.

### NPM

You can install and run this from NPM as well:

```sh
$ npm install -g @windingtree/wt-read-api
$ ETH_NETWORK_PROVIDER=address_to_node WT_CONFIG=playground wt-read-api
```

Probably the easiest way of getting an Ethereum Node API is to register with
[Infura](https://infura.io/).

### Running in production

You can customize the behaviour of the instance by many environment
variables which get applied if you run the API with `WT_CONFIG=envvar`.
These are:

- `WT_CONFIG` - Which config will be used. Defaults to `dev`.
- `WT_SEGMENTS` - Which segments will be enabled. Defaults to `hotels,airlines`.
- `ADAPTER_IN_MEMORY` - Enables [in memory off-chain data adapter](https://github.com/windingtree/off-chain-adapter-in-memory). Defaults to `false`.
- `ADAPTER_SWARM` - Enables [Swarm off-chain data adapter](https://github.com/windingtree/off-chain-adapter-swarm). Defaults to `true`.
- `ADAPTER_SWARM_GATEWAY` - Address of a Swarm HTTP Gateway, for example `https://swarm.windingtree.com` or `https://swarm-gateways.net`
- `ADAPTER_SWARM_READ_TIMEOUT` - Read timeout in milliseconds for Swarm, defaults to 1000
- `ADAPTER_HTTPS` - Enables [HTTP off-chain data adapter](https://github.com/windingtree/off-chain-adapter-http). Defaults to `true`.
- `WT_HOTEL_DIRECTORY_ADDRESS` - On chain address of [Segment Directory](https://github.com/windingtree/wt-contracts/blob/master/contracts/SegmentDirectory.sol)
- `WT_AIRLINE_DIRECTORY_ADDRESS` - On chain address of [Segment Directory](https://github.com/windingtree/wt-contracts/blob/master/contracts/SegmentDirectory.sol)
- `WT_HOTEL_FACTORY_ADDRESS` - On chain address of [Organization Factory](https://github.com/windingtree/wt-contracts/blob/master/contracts/OrganizationFactory.sol)
- `WT_AIRLINE_FACTORY_ADDRESS` - On chain address of [Organization Factory](https://github.com/windingtree/wt-contracts/blob/master/contracts/OrganizationFactory.sol)
- `PORT` - HTTP Port where the API will listen, defaults to 3000.
- `BASE_URL` - Base URL of this API instance, for example `https://playground-api.windingtree.com`
- `ETH_NETWORK_NAME` - Name of Ethereum network for informational purposes, for example `ropsten` or `mainnet`
- `ETH_NETWORK_PROVIDER` - Address of Ethereum node, for example `https://ropsten.infura.io/v3/my-project-id`
- `TRUST_CLUES_CHECK` - If trust clues should be evaluated for hotels. This may affect which data will be returned by the API. Defaults to `true`.
- `TRUST_CLUES_CURATED_LIST_ADDRESS` - ETH Address of an instance of [Curated List Trust clue](https://github.com/windingtree/trust-clue-curated-list) if used as a trust clue.
- `TRUST_CLUES_LIF_DEPOSIT_ADDRESS` - ETH Address of an instance of [Líf Deposit Trust clue](https://github.com/windingtree/trust-clue-lif-deposit) if used as a trust clue.
A local instance is automatically deployed if a `dev` config is used.

For example the playground configuration can be emulated with the following command (the actual values will differ, check `src/config/playground.js` for current ones):

```sh
docker run -p 8080:3000 \
  -e WT_CONFIG=envvar \
  -e WT_SEGMENTS=hotels,airlines \
  -e WT_HOTEL_DIRECTORY_ADDRESS=0xfb562057d613175c850df65e435bb0824b65d319 \
  -e WT_AIRLINE_DIRECTORY_ADDRESS=0xai562057d613175c850df65e435bb0824b65d333 \
  -e ADAPTER_SWARM_GATEWAY=https://swarm.windingtree.com \
  -e ADAPTER_SWARM=1 \
  -e ADAPTER_HTTPS=1 \
  -e ETH_NETWORK_NAME=ropsten \
  -e ETH_NETWORK_PROVIDER=https://ropsten.infura.io/v3/my-project-id \
  -e TRUST_CLUES_CHECK=0 \
  windingtree/wt-read-api
```

## Examples

See [API definition](docs/source.yaml) for full details or in a more [readable form here](https://developers.windingtree.com/apis/wt-read-api.html).

### Hotels
#### Get list of hotels

Calling `GET /hotels` will retrieve an array of hotels. By default fields are `id`, `name` and `location`, which
means that at least some off-chain stored data is retrieved.

You can use a query attribute `fields` to specify which fields you want to be included in the response.
Hotel ID is included by default in every request. Ex. `GET /hotels?fields=name`. You can also choose to include
only ids (e. g. `GET /hotels?fields=id`) which will *not* fetch any off-chain data, so the response will be much faster.

```javascript
items: [
  ...
  {
    id: '0x585c0771Fe960f99aBdba8dc77e5d31Be2Ada74d',
    name: 'WT Hotel'
  },
  ...
]
```

If an error is produced for a hotel, the response will look like this
```javascript
items: [
  {
    id: '0x417C3DDae54aB2f5BCd8d5A1750487a1f765a94a',
    name: 'WT Hotel'
  }
],
warnings: [],
errors: [
  {
    error: 'Unsupported data storage type: ipfs',
    originalError: 'Unsupported data storage type: ipfs',
    data: { id: '0x585c0771Fe960f99aBdba8dc77e5d31Be2Ada74d' }
  }
]
```

#### Get a hotel

Request to `/hotels/:address` can fetch off-chain data in a single request. By default, included fields are `id`, `location`, 
`name`, `description`, `contacts`, `address`, `currency`, `images`, `amenities`, `updatedAt`.


```javascript
id: "0x417C3DDae54aB2f5BCd8d5A1750487a1f765a94a",
location: { "latitude": 35.89421911, "longitude": 139.94637467 },
name: "Winding Tree Hotel",
dataFormatVersion: "0.6.0",
description: "string",
contacts:
 {
  general:
    {
      email: "joseph.urban@example.com",
      phone: 44123456789,
      url: "string",
      ethereum: "string",
      additionalContacts: []
    }
  },
roomTypes: [
  {
    id: "room-type-1111",
    name: "Room with windows",
    description: "some fancy room type description",
    totalQuantity: 0,
    occupancy: {
      min: 1,
      max: 3
    },
    amenities: [
      "tv"
    ],
    images: [
      "https://example.com/room-image.jpg"
    ],
    updatedAt: "2018-06-19T13:19:58.190Z"
  }
],
address:
 {
   road: "string",
   houseNumber: "string",
   postcode: "string",
   city: "string",
   countryCode: "US"
 },
currency: "string",
images: [ "string" ],
amenities: [ "free wi-fi" ],
updatedAt: "2018-06-19T13:19:58.190Z"
```

### Airlines

The airline endpoints work basically the same way as hotels. The default fields for airline list (`/airlines`) are `id`, `name` and `code`.
You can use a query parameter `fields` to specify fields to be included in the response. See the [airline data specification](https://github.com/windingtree/wiki/blob/a85cef934adee0bd816fea180bb02e6d39b27360/airline-data-swagger.yaml#L35) and [endpoint specification](https://github.com/windingtree/wt-read-api/blob/feat/airline-platform/docs/swagger.yaml#L437) for full list.

#### Get a list of airlines

A simple `GET /airlines` may return:
```javascript
items: [
  {
    name: 'Mazurka Airlines',
    code: 'MA',
    id: '0xa8c4cbB500da540D9fEd05BE7Bef0f0f5df3e2cc'
  }, {
    name: 'Falco Airlines',
    code: 'FA',
    id: '0x972422ce30AAC491Fa24a5287C40eAf85b0b9dC4'
  },
],
...
```

Or in case an error occurs while fetching upstream data:
```javascript
items: [
  {
    name: 'Mazurka Airlines',
    code: 'MA',
    id: '0xa8c4cbB500da540D9fEd05BE7Bef0f0f5df3e2cc'
  }
],
warnings: [],
errors: [
  {
    error: 'Cannot access on-chain data, maybe the deployed smart contract is broken',
    originalError: 'VM Exception while processing transaction: revert',
    data: {
        id: '0x972422ce30AAC491Fa24a5287C40eAf85b0b9dC4'
    }
  }
]
```

#### Get an airline

Request to `/airlines/:address` can fetch off-chain data in a single request. By default, included fields are `id`,
`name`, `description`, `contacts`, `currency`, `updatedAt`.

```javascript
name: 'Mazurka Airlines',
description: 'Small but flexible',
dataFormatVersion: "0.6.0",
contacts: {
  general: {
    email: 'info@airline-mazurka.com',
    phone: '004078965423',
    url: 'https://www.airline-mazurka.com'
  }
},
currency: 'EUR',
updatedAt: '2019-02-01 10:00:00',
id: '0x0f7aDd75c09E2F8F5e4444fcde917267257471bD'
```

#### Get a flight
Use GET at `/airlines/:address/flights/:id`. Use `fields` query param to get instances data as well.

```javascript
id: "IeKeix6G",
origin: "PRG",
destination: "LAX",
segments: [
  {
    id: "segment1",
    departureAirport: "PRG",
    arrivalAirport: "CDG"
  },
  {
    id: "segment2",
    departureAirport: "CDG",
    arrivalAirport: "LAX"
  }
]
```
#### Get a flight instance
Use GET at `/airlines/:address/flights/:flightId/instances/:instanceId`.

```javascript
id: 'IeKeix6G-1',
departureDateTime: '2018-12-10 12:00:00',
bookingClasses: [
  { id: 'economy', availabilityCount: 100 },
  { id: 'business', availabilityCount: 20 }
]
segments: {
  segment1: {
    departureDateTime: "2018-12-10 12:00:00",
    arrivalDateTime: "2018-12-10 15:00:00"
  },
  segment2: {
    departureDateTime: "2018-12-10 20:00:00",
    arrivalDateTime: "2018-12-11 02:00:00"
  }
}
```

## Publicly available instances

For currently available public instances of wt-read-api, please see [this
page](https://github.com/windingtree/wiki/blob/master/developer-resources.md#publicly-available-wt-deployments).


## Data validation
This API serves upstream data and has no control over the content. To ensure basic semantic compatibility,
data is validated against [model definition](docs/swagger.yaml) and returned as an error when validation fails.
(Detail endpoints will return 422 HTTP code, lists will contain the data in [`errors` array](docs/swagger.yaml#L127).)

In case the validation succeeds but the declared data format version is different than the version supported by the API,
it is returned with a warning. This usually means there was a non-breaking change in the data format but may have consequences
in case of a semantic change. (Warnings are returned in `x-data-validation-warning` header for detail endpoints, [`warnings` array](docs/swagger.yaml#L122) for a list.)
