import { pipe } from 'fp-ts/lib/function'
import { ResponseEnded, Status, StatusOpen } from 'hyper-ts'
import * as H from 'hyper-ts/lib/Middleware'
import { AppError, ProviderError } from '../Error'

function sendError<E = never>(
  code: Status,
  er: AppError,
  onError: (reason: unknown) => E
): H.Middleware<StatusOpen, ResponseEnded, E, void> {
  return pipe(
    H.status(code),
    H.ichain(() => H.json(er, onError))
  )
}

export function destroy<E = never>(
  onError: (reason: unknown) => E
): (er: AppError) => H.Middleware<StatusOpen, ResponseEnded, E, void> {
  return er => {
    switch (er._tag) {
      case 'ProviderError':
        return sendError(
          Status.InternalServerError,
          {
            ...er,
            ...{ error: { _tag: er.error._tag, value: 'tmdb' } },
          } as ProviderError,
          onError
        )
      case 'ValidationError':
        return sendError(Status.BadRequest, er, onError)
      case 'ServerError':
        return sendError(Status.InternalServerError, er, onError)
      case 'NotFoundError':
        return sendError(Status.NotFound, er, onError)
      case 'MethodError':
        return sendError(Status.MethodNotAllowed, er, onError)
    }
  }
}
