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

const resultsMatcher = lit('results').then(query(SearchQuery))

const popularMatcher = lit('popular')

const movieMatcher = lit('movie').then(int('id'))

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

export const popularLocation = { _tag: 'Popular' } as const

export type Popular = typeof popularLocation

export type Location = Movie | Results | Popular

function createLocationParser(basePath: string) {
  const baseMatcher = lit(basePath)
  const getParser: (m: P.Match<any>) => P.Parser<any> = basePath.length
    ? match => baseMatcher.then(match).parser
    : match => match.parser
  return zero<Location>()
    .alt(
      getParser(movieMatcher).map(({ id }) => ({
        _tag: 'Movie',
        id,
      }))
    )
    .alt(
      getParser(resultsMatcher).map(q => ({
        _tag: 'Results',
        query: O.fromNullable(q.search_query),
      }))
    )
    .alt(getParser(popularMatcher).map(() => popularLocation))
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
