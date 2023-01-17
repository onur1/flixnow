import * as t from 'io-ts'
import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString'
import { date } from 'io-ts-types/lib/date'

export const BaseMovie = t.interface({
  popularity: t.number,
  id: t.number,
  video: t.boolean,
  vote_average: t.number,
  vote_count: t.number,
  original_language: t.string,
  original_title: t.string,
  title: t.string,
  release_date: t.union([date, t.undefined, DateFromISOString, t.string]),
  backdrop_path: t.union([t.null, t.string]),
  poster_path: t.union([t.null, t.string]),
  adult: t.boolean,
  overview: t.string,
})
