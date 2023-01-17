# flixnow

## API

#### Requests and data formats

All requests to the flixnow API are HTTP GET requests. API responses are only available in JSON format. No authentication required.

#### Errors

When something goes wrong, flixnow will respond with the appropriate HTTP status code and an `AppError`. This can be one of:

- `ValidationError`: Thrown when user input can't be validated
- `ProviderError`: Thrown when TMDb fails to respond with valid payload
- `NotFoundError`: Requested resource not found on this server
- `ServerError`: Generic server error
- `MethodError`: Method not allowed

See [server/Error.ts](./src/server/Error.ts) file for details.

### Search movies

```
GET /results?search_query=QUERY
```

Responds with a [`SearchResultSet`](./src/tmdb/model/SearchResultSet.ts) object.

### Retrieve a movie

```
GET /movie/ID
```

Responds with a [`Movie`](./src/tmdb/model/Movie.ts) object.

## Development

### Building server

Build server

```
npm run build-server
```

Start TypeScript compiler in watch mode

```
npm run watch-server
```

### Running server

Start a server on port `8000`

```
THEMOVIEDB_API_KEY=yourkey \
PORT=8000 \
  npm run start
```

#### Environment variables

- `PORT` is by default `8070`
- `THEMOVIEDB_API_KEY` should be set to your [themoviedb.org](https://www.themoviedb.org) API key and has no default. You can obtain your key from [this page](https://www.themoviedb.org/settings/api).
- `CACHE_MAX_SIZE` Max number of items in cache.
- `CACHE_MAX_AGE` Max cache age.

### Building app

Run webpack

```
npm run webpack
```

Run webpack in watch mode

```
npm run webpack -- --watch
```

Get build stats

```
npm run webpack-stats
```

### Serving app

Use any static server to serve files under `public`

python27

```py
cd public && \
 python -m SimpleHTTPServer 8090 .
```

python3

```py
cd public && \
 python3 -m http.server 8090
```

### Running tests

To run Jest, type

```
npm run jest
```

Run Jest in watch mode

```
npm run jest -- --watch --runInBand
```

### Linting & formatting

Run linter

```
npm run lint
```

Run code formatter

```
npm run prettier
```

To run everything in one go, type `npm test`.
