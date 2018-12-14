[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![Greenkeeper badge](https://badges.greenkeeper.io/windingtree/wt-read-api.svg)](https://greenkeeper.io/)
# WT Read API
API written in nodejs to fetch information from the Winding Tree platform.

## Requirements
- Nodejs >=10

### Getting stared
In order to install and run tests, we must:
```
git clone git@github.com:windingtree/wt-read-api.git
nvm install
npm install
npm test
```

### Running dev mode
With all the dependencies installed, you can start the dev server.
First step is starting Ganache (local Ethereum network node). You can skip this
step if you have a different network already running.
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
When using a `local` config, we internally run a script to deploy WT Index. It is not immediate,
so you might experience some errors in a first few seconds. And that's the reason why
it is not used in the same manner in tests.

You can then visit [http://localhost:3000/docs/](http://localhost:3000/docs/) to interact
with the live server. An [OAS](https://github.com/OAI/OpenAPI-Specification) description is published there.

You can tweak with the configuration in `src/config/`.

### Running node against Ropsten testnet contract

- For our deployment on https://playground-api.windingtree.com, we use a Docker image.
- You can use it in your local environment by running the following commands:
```sh
$ docker build -t windingtree/wt-read-api .
$ docker run -p 8080:3000 -e WT_CONFIG=playground windingtree/wt-read-api
```
- After that you can access the wt-read-api on local port `8080`
- This deployment is using a Ropsten configuration that can be found in `src/config/playground.js`

You can run a node with a configuration entirely based on environment variables. Allowed options are:

- `ADAPTER_IN_MEMORY` - Enables [in memory off-chain data adapter](https://github.com/windingtree/off-chain-adapter-in-memory)
- `ADAPTER_SWARM` - Enables [Swarm off-chain data adapter](https://github.com/windingtree/off-chain-adapter-swarm)
- `ADAPTER_SWARM_GATEWAY` - Address of a Swarm HTTP Gateway, for example `https://swarm.windingtree.com` or `https://swarm-gateways.net`
- `ADAPTER_SWARM_READ_TIMEOUT` - Read timeout in milliseconds for Swarm, defaults to 1000
- `ADAPTER_HTTPS` - Enables [HTTP off-chain data adapter](https://github.com/windingtree/off-chain-adapter-http)
- `WT_INDEX_ADDRESS` - On chain address of [Winding Tree index](https://github.com/windingtree/wt-contracts/blob/master/contracts/WTIndex.sol)
- `PORT` - HTTP Port where the API will lsiten, 3000 by default.
- `BASE_URL` - Base URL of this API instance, for example `https://playground-api.windingtree.com`
- `ETH_NETWORK_NAME` - Name of Ethereum network for informational purposes, for example `ropsten` or `mainnet`
- `ETH_NETWORK_PROVIDER` - Address of Ethereum node, for example `https://ropsten.infura.io/`

For example the playground configuration can be emulated with the following command:

```sh
docker run -p 8080:3000 -e WT_CONFIG=envvar -e WT_INDEX_ADDRESS=0x082fa119ffc7427652741456669ce1b306d207e3 -e ETH_NETWORK_PROVIDER=https://ropsten.infura.io/ -e ADAPTER_SWARM_GATEWAY=https://swarm.windingtree.com -e ADAPTER_SWARM=1 -e ADAPTER_HTTPS=1 -e ETH_NETWORK_NAME=ropsten windingtree/wt-read-api
```

## Examples
### Get list of hotels

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
    ...
    { 
      id: '0x585c0771Fe960f99aBdba8dc77e5d31Be2Ada74d',
      error: 'Unsupported data storage type: ipfs' 
    },
    ...
]
```


### Get a hotel

Request to `/hotels/:address` can fetch off-chain data in a single request. By default, included fields are `id`, `location`, 
`name`, `description`, `contacts`, `address`, `currency`, `images`, `amenities`, `updatedAt`.


```javascript
{
  "id": "0x417C3DDae54aB2f5BCd8d5A1750487a1f765a94a",
  "location": { "latitude": 35.89421911, "longitude": 139.94637467 },
  "name": "Winding Tree Hotel",
  "description": "string",
  "contacts": 
   { 
    "general": 
      { 
        "email": "joseph.urban@example.com",
        "phone": 44123456789,
        "url": "string",
        "ethereum": "string",
        "additionalContacts": [] 
      } 
    },
  "roomTypes": [
    {
      "id": "room-type-1111",
      "name": "Room with windows",
      "description": "some fancy room type description",
      "totalQuantity": 0,
      "occupancy": {
        "min": 1,
        "max": 3
      },
      "amenities": [
        "TV"
      ],
      "images": [
        "https://example.com/room-image.jpg"
      ],
      "updatedAt": "2018-06-19T13:19:58.190Z",
      "properties": {
        "nonSmoking": "some"
      }
    }
  ],
  "address": 
   { 
     "line1": "string",
     "line2": "string",
     "postalCode": "string",
     "city": "string",
     "state": "string",
     "country": "string" 
   },
  "currency": "string",
  "images": [ "string" ],
  "amenities": [ "WiFi" ],
  "updatedAt": "2018-06-19T13:19:58.190Z"
}
```

## Publicly available instances

For currently available public instances of wt-read-api, please see [this
page](https://github.com/windingtree/wiki/blob/master/developer-resources.md#publicly-available-wt-deployments).
