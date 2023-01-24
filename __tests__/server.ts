import * as t from 'io-ts'
import * as E from 'fp-ts/lib/Either'
import * as TE from 'fp-ts/lib/TaskEither'
import * as assert from 'assert'
import * as H from 'hyper-ts/lib/Middleware'
import { Action, ExpressConnection } from 'hyper-ts/lib/express'
import * as L from 'fp-ts-contrib/lib/List'
import { pipe } from 'fp-ts/lib/function'
import { HttpError } from '@onur1/axios-ts/lib/Error'
import { TMDb, Movie, SearchResultSet } from '../src/tmdb'
import { flixbox } from '../src/server'
import createXacheStorage from '../src/storage/Xache'

class MockRequest {
  constructor(
    readonly originalUrl: string = '',
    readonly body?: unknown,
    readonly headers: Record<string, string> = {},
    readonly method: string = 'GET'
  ) {}
  header(name: string) {
    return this.headers[name]
  }
}

class MockConnection<S> extends ExpressConnection<S> {
  constructor(req: MockRequest) {
    super(req as any, null as any)
  }
}

function assertSuccess<S, A>(m: H.Middleware<any, any, any, A>, cin: MockConnection<S>, actions: Array<Action>) {
  return m(cin)().then(
    E.map(e =>
      assert.deepStrictEqual(
        pipe(e, ([a, cout]) => [a, L.toArray((cout as MockConnection<S>).actions)]),
        [undefined, actions]
      )
    )
  )
}

const testData = {
  hello: require('../test-data/results-hello.json') as SearchResultSet,
  dulevande: require('../test-data/movie-5817.json') as Movie,
}

function createTMDb(
  search: (term: string) => TE.TaskEither<HttpError, SearchResultSet>,
  movie: (id: number) => TE.TaskEither<HttpError, t.TypeOf<typeof Movie>>
): TMDb {
  return { search, movie, popular: reject() }
}

const reject = <A = never>() =>
  TE.left<HttpError, A>({
    _tag: 'BadUrl',
    value: 'beep',
  })

const throwError = (er: unknown) => {
  throw er
}

describe('flixbox', () => {
  it('should hit cache', () => {
    const tmdb = createTMDb(reject, id => TE.right({ ...testData.dulevande, ...{ id } }))
    const db = createXacheStorage<Movie | SearchResultSet>({ maxAge: 1000, maxSize: 10 })
    const m = flixbox({ tmdb, storage: db, port: '0' }, throwError)
    return assertSuccess(m, new MockConnection(new MockRequest('/movie/42')), [
      { body: JSON.stringify({ ...testData.dulevande, ...{ id: 42 } }), type: 'setBody' },
      { name: 'Content-Type', type: 'setHeader', value: 'application/json' },
      { type: 'setStatus', status: 200 },
    ])
      .then(() => db.get('/movies/42')())
      .then(E.map(({ value }) => assert.deepStrictEqual(value, { ...testData.dulevande, ...{ id: 42 } })))
      .then(() => db.put('/movies/42', 'beepboop' as any)())
      .then(() =>
        assertSuccess(m, new MockConnection(new MockRequest('/movie/42')), [
          { body: JSON.stringify('beepboop'), type: 'setBody' },
          { name: 'Content-Type', type: 'setHeader', value: 'application/json' },
          { type: 'setStatus', status: 200 },
        ])
      )
  })
  it('should return 404 on invalid route', () => {
    const tmdb = createTMDb(reject, reject)
    const db = createXacheStorage<Movie | SearchResultSet>({ maxAge: 1000, maxSize: 10 })
    const m = flixbox({ tmdb, storage: db, port: '0' }, throwError)
    return assertSuccess(m, new MockConnection(new MockRequest('/movie/stringsnotaccepted')), [
      { body: '{"_tag":"NotFoundError"}', type: 'setBody' },
      { name: 'Content-Type', type: 'setHeader', value: 'application/json' },
      { status: 404, type: 'setStatus' },
    ])
  })
  it('should raise 500 and forward provider error', () => {
    const tmdb = createTMDb(reject, reject)
    const db = createXacheStorage<Movie | SearchResultSet>({ maxAge: 1000, maxSize: 1000 })
    const m = flixbox({ tmdb, storage: db, port: '0' }, throwError)
    return assertSuccess(m, new MockConnection(new MockRequest('/movie/42')), [
      { body: '{"_tag":"ProviderError","error":{"_tag":"BadUrl","value":"TMDb"}}', type: 'setBody' },
      { name: 'Content-Type', type: 'setHeader', value: 'application/json' },
      { status: 500, type: 'setStatus' },
    ])
  })
  it('should not respond to empty search_query', () => {
    const tmdb = createTMDb(reject, reject)
    const db = createXacheStorage<Movie | SearchResultSet>({ maxAge: 1000, maxSize: 1000 })
    const m = flixbox({ tmdb, storage: db, port: '0' }, throwError)
    return assertSuccess(m, new MockConnection(new MockRequest('/results')), [
      { body: '{"_tag":"ValidationError","messages":["empty search_query"]}', type: 'setBody' },
      { name: 'Content-Type', type: 'setHeader', value: 'application/json' },
      { status: 400, type: 'setStatus' },
    ])
  })
})
