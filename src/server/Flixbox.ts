import * as TE from 'fp-ts/lib/TaskEither'
import * as O from 'fp-ts/lib/Option'
import { pipe } from 'fp-ts/lib/function'
import * as H from 'hyper-ts/lib/Middleware'
import { HeadersOpen, ResponseEnded, StatusOpen } from 'hyper-ts'
import { GET } from './middleware/Method'
import { destroy } from './middleware/Error'
import { TMDb, SearchResultSet, Movie } from '../tmdb'
import { Location, Movie as MovieRoute, Results as SearchResultsRoute } from './Router'
import { ServerError, AppError, providerError, NotFoundError, validationError } from './Error'
import { Entry, Storage } from '../storage/Storage'

function sendJSON(body: unknown): H.Middleware<HeadersOpen, ResponseEnded, AppError, void> {
  return H.json(body, () => ServerError)
}

function results(tmdb: TMDb, query: string): H.Middleware<StatusOpen, StatusOpen, AppError, SearchResultSet> {
  return H.fromTaskEither(TE.taskEither.mapLeft(tmdb.search(query), providerError))
}

function movie(tmdb: TMDb, id: number): H.Middleware<StatusOpen, StatusOpen, AppError, Movie> {
  return H.fromTaskEither(TE.taskEither.mapLeft(tmdb.movie(id), providerError))
}

function popular(tmdb: TMDb): H.Middleware<StatusOpen, StatusOpen, AppError, SearchResultSet> {
  return H.fromTaskEither(TE.taskEither.mapLeft(tmdb.popular, providerError))
}

function put<A>(store: Storage<A>, key: string, value: A): H.Middleware<StatusOpen, StatusOpen, AppError, Entry<A>> {
  return H.fromTaskEither(TE.taskEither.mapLeft(store.put(key, value), () => ServerError))
}

function get<A>(store: Storage<A>, key: string): H.Middleware<StatusOpen, StatusOpen, AppError, Entry<A>> {
  return H.fromTaskEither(TE.taskEither.mapLeft(store.get(key), () => NotFoundError))
}

type Document = Movie | SearchResultSet

function getSearchResultsMiddleware(
  tmdb: TMDb,
  store: Storage<Document>
): (route: SearchResultsRoute) => H.Middleware<StatusOpen, ResponseEnded, AppError, void> {
  return route => {
    const query = O.toNullable(route.query)

    if (query) {
      return pipe(
        GET,
        H.apSecond(
          pipe(
            get(store, `/results/${query}`),
            H.imap(entry => entry.value),
            H.orElse(() =>
              pipe(
                results(tmdb, query),
                H.ichain(value =>
                  pipe(
                    put(store, `/results/${query}`, value),
                    H.imap(entry => entry.value)
                  )
                )
              )
            )
          )
        ),
        H.ichain(res =>
          pipe(
            H.status(200),
            H.ichain(() => sendJSON(res))
          )
        )
      )
    } else {
      return pipe(
        GET,
        H.ichain(() =>
          pipe(
            validationError(new Error('empty search_query')),
            destroy(_reason => ServerError as AppError)
          )
        )
      )
    }
  }
}

function getMovieMiddleware(
  tmdb: TMDb,
  store: Storage<Document>
): (route: MovieRoute) => H.Middleware<StatusOpen, ResponseEnded, AppError, void> {
  return route =>
    pipe(
      GET,
      H.apSecond(
        pipe(
          get(store, `/movies/${String(route.id)}`),
          H.imap(entry => entry.value),
          H.orElse(() =>
            pipe(
              movie(tmdb, route.id),
              H.ichain(value =>
                pipe(
                  put(store, `/movies/${String(route.id)}`, value),
                  H.map(entry => entry.value)
                )
              )
            )
          )
        )
      ),
      H.ichain(res =>
        pipe(
          H.status<AppError>(200),
          H.ichain(() => sendJSON(res))
        )
      )
    )
}

function getPopularMiddleware(
  tmdb: TMDb,
  store: Storage<Document>
): H.Middleware<StatusOpen, ResponseEnded, AppError, void> {
  const go = popular(tmdb)
  return pipe(
    GET,
    H.apSecond(
      pipe(
        get(store, '/popular'),
        H.imap(entry => entry.value),
        H.orElse(() =>
          pipe(
            go,
            H.ichain(value =>
              pipe(
                put(store, `/popular`, value),
                H.map(entry => entry.value)
              )
            )
          )
        )
      )
    ),
    H.ichain(res =>
      pipe(
        H.status<AppError>(200),
        H.ichain(() => sendJSON(res))
      )
    )
  )
}

export function createFromLocation(
  tmdb: TMDb,
  store: Storage<Document>
): (route: Location) => H.Middleware<StatusOpen, ResponseEnded, AppError, void> {
  const movieMiddleware = getMovieMiddleware(tmdb, store)
  const searchResultsMiddleware = getSearchResultsMiddleware(tmdb, store)
  const popularMiddleware = getPopularMiddleware(tmdb, store)
  return route => {
    switch (route._tag) {
      case 'Movie':
        return movieMiddleware(route)
      case 'Results':
        return searchResultsMiddleware(route)
      case 'Popular':
        return popularMiddleware
    }
  }
}
