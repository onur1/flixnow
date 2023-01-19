import * as C from 'fp-ts/lib/Console'
import * as TE from 'fp-ts/lib/TaskEither'
import { Kind2, URIS2 } from 'fp-ts/lib/HKT'
import * as LTE from './TaskEither'

export type Level = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  message: string
  level: Level
}

export const logger: LTE.LoggerTaskEither<never, LogEntry> = entry =>
  TE.fromIO(C.log(`${entry.level} ${entry.message}`))

export interface Console<F extends URIS2> {
  readonly warn: <E = never>(message: string) => Kind2<F, E, void>
  readonly info: <E = never>(message: string) => Kind2<F, E, void>
  readonly debug: <E = never>(message: string) => Kind2<F, E, void>
  readonly error: <E = never>(message: string) => Kind2<F, E, void>
}

export const consoleTaskEither: Console<TE.URI> = {
  info: message => logger({ message, level: 'info' }),
  warn: message => logger({ message, level: 'warn' }),
  error: message => logger({ message, level: 'error' }),
  debug: message => logger({ message, level: 'debug' }),
}
