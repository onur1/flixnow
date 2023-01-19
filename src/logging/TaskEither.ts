import { Predicate } from 'fp-ts/lib/function'
import { Monoid } from 'fp-ts/lib/Monoid'
import { Contravariant2 } from 'fp-ts/lib/Contravariant'
import { pipeable } from 'fp-ts/lib/pipeable'
import * as TE from 'fp-ts/lib/TaskEither'
import { getLoggerM } from 'logging-ts'

const T = getLoggerM(TE.taskEither)

declare module 'fp-ts/lib/HKT' {
  interface URItoKind2<E, A> {
    LoggerTaskEither: LoggerTaskEither<E, A>
  }
}

export const URI = 'LoggerTaskEither'

export type URI = typeof URI

export interface LoggerTaskEither<E, A> {
  (a: A): TE.TaskEither<E, void>
}

export const filter: <E, A>(logger: LoggerTaskEither<E, A>, predicate: Predicate<A>) => LoggerTaskEither<E, A> =
  T.filter

export const getMonoid: <E, A>() => Monoid<LoggerTaskEither<E, A>> = T.getMonoid

export const loggerTaskEither: Contravariant2<URI> = {
  URI,
  contramap: T.contramap,
}

const { contramap } = pipeable(loggerTaskEither)

export { contramap }
