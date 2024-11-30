import * as t from 'io-ts'
import * as TE from 'fp-ts/lib/TaskEither'
import { toTaskEither } from '@tetsuo/axios-ts/lib/TaskEither'
import { get } from '@tetsuo/axios-ts/lib/Client'
import { expected } from '@tetsuo/axios-ts/lib/Expected'
import { HttpError } from '@tetsuo/axios-ts/lib/Error'
import { SearchResultSet } from './model/SearchResultSet'
import { Movie } from './model/Movie'

const API_URL = 'https://api.themoviedb.org/3'

export interface TMDb {
  popular: TE.TaskEither<HttpError, SearchResultSet>
  search: (term: string) => TE.TaskEither<HttpError, SearchResultSet>
  movie: (id: number) => TE.TaskEither<HttpError, t.TypeOf<typeof Movie>>
}

export function themoviedb(apiKey: string): TMDb {
  return {
    popular: toTaskEither(
      get(`${API_URL}/movie/popular?api_key=${apiKey}&include_adult=false`, expected(SearchResultSet))
    ),
    search: (term: string) =>
      toTaskEither(
        get(
          `${API_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(term)}&include_adult=false`,
          expected(SearchResultSet)
        )
      ),
    movie: (id: number) =>
      toTaskEither(
        get(
          `${API_URL}/movie/${String(id)}?api_key=${apiKey}&append_to_response=videos&include_adult=false`,
          expected(Movie)
        )
      ),
  }
}
