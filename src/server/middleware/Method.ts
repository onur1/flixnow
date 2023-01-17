import { right, left } from 'fp-ts/lib/Either'
import { decodeMethod } from 'hyper-ts/lib/Middleware'
import { MethodError, AppError } from '../Error'

function method<T>(name: string) {
  return decodeMethod(s =>
    s.toLowerCase() === name.toLowerCase() ? right<AppError, T>(name.toUpperCase() as any) : left(MethodError)
  )
}

export const GET = method<'GET'>('GET')

export const POST = method<'POST'>('POST')

export const OPTIONS = method<'OPTIONS'>('OPTIONS')

export const PATCH = method<'PATCH'>('PATCH')

export const HEAD = method<'HEAD'>('HEAD')

export const DELETE = method<'DELETE'>('DELETE')

export const PUT = method<'PUT'>('PUT')
