import { Server } from 'http'
import * as t from 'io-ts'
import * as E from 'fp-ts/lib/Either'
import * as TE from 'fp-ts/lib/TaskEither'
import { sequenceS } from 'fp-ts/lib/Apply'
import { pipe, flow } from 'fp-ts/lib/function'
import * as S from 'fp-ts/lib/string'
import * as H from 'hyper-ts/lib/Middleware'
import { ResponseEnded, StatusOpen } from 'hyper-ts'
import { destroy } from './middleware/Error'
import { themoviedb, TMDb, Movie, SearchResultSet } from '../tmdb'
import { listen } from './Express'
import { createFromLocation } from './Flixbox'
import { parseLocation } from './Router'
import { Storage } from '../storage/Storage'
import createXacheStorage from '../storage/Xache'

export interface Options {
  tmdb: TMDb
  storage: Storage<CachedObject>
  port: string
  basePath?: string
  corsOrigin: string
}

function printObject(o: unknown): string {
  if (typeof o !== 'object' || o === null) {
    return ''
  }
  return Object.entries(o)
    .map(([k, v]) => [k, v].join('='))
    .join(' ')
}

export const flixbox = <E = never>(
  { tmdb, storage, basePath }: Options,
  onError: (reason: unknown) => E
): H.Middleware<StatusOpen, ResponseEnded, E, void> => {
  return pipe(parseLocation(basePath), H.ichain(createFromLocation(tmdb, storage)), H.orElse(destroy(onError)))
}

const main = <E = never>(
  onError: (reason: unknown) => E
): ((ma: TE.TaskEither<E, Options>) => TE.TaskEither<E, string>) =>
  flow(
    TE.chain<E, Options, Server>(opts => listen(flixbox(opts, onError), opts.port, opts.corsOrigin, onError)),
    TE.map(server => `listening on ${printObject(server.address())}`)
  )

function envOrElse<A>(key: string, expected: t.Type<A>, defaultValue?: A) {
  return pipe(
    expected.decode(process.env[key]),
    E.orElse(() => (defaultValue ? E.right(defaultValue) : E.left(`missing env variable: ${key}`)))
  )
}

const ado = sequenceS(E.either)

type CachedObject = Movie | SearchResultSet /* Document */

const optionsFromEnv: E.Either<string, Options> = pipe(
  ado({
    port: envOrElse('PORT', t.string, '8070'),
    storage: pipe(
      envOrElse('CACHE_MAX_SIZE', t.number, 10),
      E.chain(maxSize =>
        pipe(
          envOrElse('CACHE_MAX_AGE', t.number, 60000),
          E.map(maxAge => ({ maxSize, maxAge }))
        )
      ),
      E.map(xacheOpts => createXacheStorage<CachedObject>(xacheOpts))
    ),
    basePath: envOrElse('BASE_PATH', t.union([t.string, t.undefined]), undefined),
    corsOrigin: envOrElse('CORS_ORIGIN', t.string, '*'),
    tmdb: pipe(envOrElse('THEMOVIEDB_API_KEY', t.string), E.map(themoviedb)),
  })
)

export default main

if (require.main === module) {
  const Sh = E.getShow(S.Show, S.Show)
  // eslint-disable-next-line no-console
  const log = flow(Sh.show, console.log)
  pipe(TE.fromEither(optionsFromEnv), main(String))().then(log).catch(log)
}
