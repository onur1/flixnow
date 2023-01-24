import { right, left } from 'fp-ts/lib/Either'
import { StatusOpen } from 'hyper-ts'
import { decodeMethod, Middleware } from 'hyper-ts/lib/Middleware'
import { MethodError, AppError } from '../Error'

function method<A>(name: string): Middleware<StatusOpen, StatusOpen, AppError, A> {
  const lowercaseName = name.toLowerCase()
  const uppercaseName = name.toUpperCase()
  return decodeMethod(s =>
    s.toLowerCase() === lowercaseName ? right<AppError, A>(uppercaseName as A) : left(MethodError)
  )
}

export const GET = method<'GET'>('GET')

export const POST = method<'POST'>('POST')

export const OPTIONS = method<'OPTIONS'>('OPTIONS')

export const PATCH = method<'PATCH'>('PATCH')

export const HEAD = method<'HEAD'>('HEAD')

export const DELETE = method<'DELETE'>('DELETE')

export const PUT = method<'PUT'>('PUT')
