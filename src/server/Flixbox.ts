import * as TE from 'fp-ts/lib/TaskEither'
import * as O from 'fp-ts/lib/Option'
import { pipe } from 'fp-ts/lib/function'
import * as H from 'hyper-ts/lib/Middleware'
import { HeadersOpen, ResponseEnded, StatusOpen } from 'hyper-ts'
import { GET } from './middleware/Method'
import { destroy } from './middleware/Error'
import { TMDb, SearchResultSet, Movie } from '../tmdb'
import { Location } from './Router'
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

function put<A>(store: Storage<A>, key: string, value: A): H.Middleware<StatusOpen, StatusOpen, AppError, Entry<A>> {
  return H.fromTaskEither(TE.taskEither.mapLeft(store.put(key, value), () => ServerError))
}

function get<A>(store: Storage<A>, key: string): H.Middleware<StatusOpen, StatusOpen, AppError, Entry<A>> {
  return H.fromTaskEither(TE.taskEither.mapLeft(store.get(key), () => NotFoundError))
}

type Document = Movie | SearchResultSet

export function createFromLocation(
  tmdb: TMDb,
  store: Storage<Document>
): (route: Location) => H.Middleware<StatusOpen, ResponseEnded, AppError, void> {
  return route => {
    switch (route._tag) {
      case 'Movie':
        return pipe(
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
                      H.map(node => node.value)
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
      case 'Results': {
        const query = O.toNullable(route.query)

        if (query) {
          return pipe(
            GET,
            H.apSecond(
              pipe(
                get(store, `/results/${query}`),
                H.imap(node => node.value),
                H.orElse(() =>
                  pipe(
                    results(tmdb, query),
                    H.ichain(value =>
                      pipe(
                        put(store, `/results/${query}`, value),
                        H.imap(node => node.value)
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
  }
}
