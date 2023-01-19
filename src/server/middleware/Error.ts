import { pipe } from 'fp-ts/lib/function'
import { ResponseEnded, Status, StatusOpen } from 'hyper-ts'
import * as H from 'hyper-ts/lib/Middleware'
import { AppError, printAppError, ProviderError } from '../Error'
import * as C from '../../logging/Console'

function sendError<E = never>(
  code: Status,
  actualEr: AppError,
  er: AppError,
  onError: (reason: unknown) => E
): H.Middleware<StatusOpen, ResponseEnded, E, void> {
  return pipe(
    H.fromTaskEither(C.consoleTaskEither.error(printAppError(actualEr))),
    H.ichain(() => H.status(code)),
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
          er,
          {
            ...er,
            ...{ error: { _tag: er.error._tag, value: 'TMDb' } },
          } as ProviderError,
          onError
        )
      case 'ValidationError':
        return sendError(Status.BadRequest, er, er, onError)
      case 'ServerError':
        return sendError(Status.InternalServerError, er, er, onError)
      case 'NotFoundError':
        return sendError(Status.NotFound, er, er, onError)
      case 'MethodError':
        return sendError(Status.MethodNotAllowed, er, er, onError)
    }
  }
}
