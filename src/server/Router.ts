import * as t from 'io-ts'
import * as O from 'fp-ts/lib/Option'
import * as P from 'fp-ts-routing'
import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'
import { lit, query, int, zero } from 'fp-ts-routing'
import { StatusOpen } from 'hyper-ts'
import * as H from 'hyper-ts/lib/Middleware'
import { NotFoundError, AppError } from './Error'

export const SearchQuery = t.interface({
  search_query: t.union([t.string, t.undefined]),
})

export function createResultsMatcher(basePath: string) {
  const m = lit('results').then(query(SearchQuery))
  if (basePath.length) {
    return lit(basePath).then(m)
  }
  return m
}

export function createMovieMatcher(basePath: string) {
  const m = lit('movie').then(int('id'))
  if (basePath.length) {
    return lit(basePath).then(m)
  }
  return m
}

export type Movie = {
  _tag: 'Movie'
  id: number
}

export type Results = {
  _tag: 'Results'
  query: O.Option<string>
}

export function movieLocation(id: number): Movie {
  return { _tag: 'Movie', id }
}

export function resultsLocation(query: O.Option<string>): Results {
  return { _tag: 'Results', query }
}

export type Location = Movie | Results

function createLocationParser(basePath: string) {
  return zero<Location>()
    .alt(
      createMovieMatcher(basePath).parser.map(({ id }) => ({
        _tag: 'Movie',
        id,
      }))
    )
    .alt(
      createResultsMatcher(basePath).parser.map(q => ({
        _tag: 'Results',
        query: O.fromNullable(q.search_query),
      }))
    )
}

export function fromParser<L, A extends object>(
  parser: P.Parser<A>,
  error: L
): H.Middleware<StatusOpen, StatusOpen, L, A> {
  const e = E.left<L, A>(error)
  return H.fromConnection(c =>
    pipe(
      O.tryCatch(() => P.Route.parse(c.getOriginalUrl())),
      O.chain(x => parser.run(x)),
      O.map(([a]) => E.right<L, A>(a)),
      O.getOrElse(() => e)
    )
  )
}

export const parseLocation = (basePath = '') =>
  fromParser<AppError, Location>(createLocationParser(basePath), NotFoundError)
