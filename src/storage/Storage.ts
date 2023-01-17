import * as TE from 'fp-ts/lib/TaskEither'

export interface Entry<A = unknown> {
  key: string
  value: A
}

export interface StorageBackend<A> {
  get: (key: string, cb: (er: Error | null, a?: Entry<A>) => void) => void
  put: (key: string, value: A, cb: (er: Error | null, a?: Entry<A>) => void) => void
}

export interface Storage<A> {
  get: (key: string) => TE.TaskEither<Error, Entry<A>>
  put: (key: string, value: A) => TE.TaskEither<Error, Entry<A>>
}

export function createStorage<A>(be: StorageBackend<A>): Storage<A> {
  return {
    get: TE.taskify(be.get),
    put: TE.taskify(be.put),
  }
}
