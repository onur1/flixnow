import { get, Request } from '@onur1/axios-ts/lib/Client'
import { expected } from '@onur1/axios-ts/lib/Expected'
import { Movie, SearchResultSet } from '../tmdb/model'

export type SearchRequest = Request<SearchResultSet>

export type MovieRequest = Request<Movie>

export function getSearchRequest(apiUrl: string): (term: string) => SearchRequest {
  return term => get(`${apiUrl}/results?search_query=${encodeURIComponent(term)}`, expected(SearchResultSet))
}

export function getMovieRequest(apiUrl: string): (id: number) => MovieRequest {
  return id => get(`${apiUrl}/movie/${id}`, expected(Movie))
}

export function getPopularRequest(apiUrl: string): SearchRequest {
  return get(`${apiUrl}/popular`, expected(SearchResultSet))
}
