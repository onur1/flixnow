import * as t from 'io-ts'
import { BaseMovie } from './BaseMovie'

export const SearchResult = BaseMovie

export type SearchResult = t.TypeOf<typeof SearchResult>

export const SearchResultSet = t.interface({
  page: t.number,
  total_results: t.number,
  total_pages: t.number,
  results: t.array(SearchResult),
})

export type SearchResultSet = t.TypeOf<typeof SearchResultSet>
