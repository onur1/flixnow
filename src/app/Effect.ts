import * as O from 'fp-ts/lib/Option'
import { none, Cmd } from 'elm-ts/lib/Cmd'
import { push as pushHistory } from 'elm-ts/lib/Navigation'
import { fold } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'
import { Request } from '@tetsuo/axios-ts/lib/Client'
import { toTaskEither } from '@tetsuo/axios-ts/lib/TaskEither'
import { HttpError } from '@tetsuo/axios-ts/lib/Error'
import { attempt } from 'elm-ts/lib/Task'
import { Lens } from 'monocle-ts'
import * as flixbox from './Client'
import {
  Msg,
  Navigate,
  PushUrl,
  pushUrl as pushUrlMsg,
  setHttpError,
  setMovie,
  setPopularResults,
  setSearchResults,
} from './Msg'
import {
  Model,
  routeLens,
  searchTermOptional,
  searchTermLens,
  notificationLens,
  searchResultsLens,
  movieLens,
  popularResultsLens,
} from './Model'
import { hrefs } from './Router'

export type Effect = [Model, Cmd<Msg>]

function withoutNotification(model: Model): Model {
  return notificationLens.set(undefined)(model)
}

function withoutSearchResults(model: Model): Model {
  return searchResultsLens.set([])(model)
}

function withoutMovie(model: Model): Model {
  return movieLens.set(undefined)(model)
}

function navigate(msg: Navigate, model: Model): Effect {
  return [withoutNotification(routeLens.set(msg.route)(model)), none]
}

function pushUrl(msg: PushUrl, model: Model): Effect {
  return [model, pushHistory(msg.url)]
}

function modify<A>(lens: Lens<Model, A>, f: (a: A) => A, model: Model): Effect {
  return [lens.modify(f)(model), none]
}

function request<A>(req: Request<A>, onLeft: (er: HttpError) => Msg, onRight: (a: A) => Msg, model: Model): Effect {
  return [model, attempt(fold(onLeft, onRight))(toTaskEither(req))]
}

export function createEffectHandler(apiUrl: string): (msg: Msg, model: Model) => Effect {
  return (msg, model) => {
    switch (msg._tag) {
      case 'SetMovie': {
        return modify(movieLens, () => msg.movie, model)
      }
      case 'SubmitSearch': {
        const searchTerm = O.toUndefined(searchTermOptional.getOption(model))
        if (!searchTerm || searchTerm.length === 0) {
          return [model, none]
        } else {
          return pushUrl(pushUrlMsg(hrefs.results({ search_query: searchTerm })), withoutNotification(model))
        }
      }
      case 'UpdateSearchTerm':
        return modify(searchTermLens, () => msg.term, model)
      case 'PushUrl':
        return pushUrl(msg, model)
      case 'Navigate': {
        const init = [withoutNotification, withoutMovie].reduce((b, a) => a(b), model)
        if (msg.route._tag === 'Results') {
          const q = O.toUndefined(msg.route.query)
          if (q) {
            return request(
              flixbox.getSearchRequest(apiUrl)(q),
              setHttpError,
              res => pipe(res.results, setSearchResults),
              routeLens.set(msg.route)(searchTermLens.set(q)(init))
            )
          }
        } else if (msg.route._tag === 'Movie') {
          return request(
            flixbox.getMovieRequest(apiUrl)(msg.route.id),
            setHttpError,
            setMovie,
            routeLens.set(msg.route)(withoutSearchResults(init))
          )
        } else if (msg.route._tag === 'Home') {
          return request(
            flixbox.getPopularRequest(apiUrl),
            setHttpError,
            res => pipe(res.results, setPopularResults),
            routeLens.set(msg.route)(withoutSearchResults(searchTermLens.set('')(init)))
          )
        }
        return navigate(msg, withoutSearchResults(searchTermLens.set('')(init)))
      }
      case 'SetNotification':
        return modify(notificationLens, () => ({ severity: msg.severity, text: msg.text }), model)
      case 'SetHttpError':
        return modify(notificationLens, () => ({ severity: 'error' as const, text: msg.error._tag }), model)
      case 'SetSearchResults':
        return modify(searchResultsLens, () => msg.results, model)
      case 'SetPopularResults':
        return modify(popularResultsLens, () => msg.results, model)
    }
  }
}
