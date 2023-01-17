import express from 'express'
import * as TE from 'fp-ts/lib/TaskEither'
import { toRequestHandler } from 'hyper-ts/lib/Express'
import { Middleware } from 'hyper-ts/lib/Middleware'
import { Server } from 'http'
import cors from 'cors'

export function listen<I, O, E = never>(
  ma: Middleware<I, O, E, void>,
  port: string,
  onError: (reason: unknown) => E
): TE.TaskEither<E, Server> {
  return TE.tryCatch<E, Server>(() => {
    return new Promise(resolve => {
      const app = express().use(cors()).use(toRequestHandler(ma))
      const server: Server = app.listen(port, () => {
        resolve(server)
      })
    })
  }, onError)
}
