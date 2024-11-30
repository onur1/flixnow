import * as t from 'io-ts'
import { failure } from 'io-ts/lib/PathReporter'
import { HttpError } from '@tetsuo/axios-ts/lib/Error'

export const MethodError = { _tag: 'MethodError' } as const

export interface ValidationError {
  _tag: 'ValidationError'
  messages: Array<string>
}

export interface ProviderError {
  _tag: 'ProviderError'
  error: HttpError
}

export function validationError(es: t.Errors | Error): AppError {
  return { _tag: 'ValidationError', messages: es instanceof Error ? [es.message] : failure(es) }
}

export function providerError(er: HttpError): AppError {
  return { _tag: 'ProviderError', error: er }
}

export const ServerError = { _tag: 'ServerError' } as const

export const NotFoundError = { _tag: 'NotFoundError' } as const

export type AppError = ValidationError | ProviderError | typeof ServerError | typeof NotFoundError | typeof MethodError

const isObject = (o: unknown): o is object => typeof o === 'object' && o !== null

function printObject(o: unknown): string {
  if (!isObject(o)) {
    return ''
  }
  return Object.entries(o)
    .map(([k, v]) => [k, isObject(v) ? printObject(v) : v].join('='))
    .join(' ')
}

export function printHttpError(er: HttpError): string {
  let s = `tag=${er._tag}`
  switch (er._tag) {
    case 'BadPayload':
      s += ` value=${er.value} response=(${printObject(er.response)})`
      break
    case 'BadStatus':
      s += ` response=(${printObject(er.response)})`
      break
    case 'BadUrl':
      s += ` value=${er.value}`
      break
    case 'NetworkError':
      s += ` value=${er.value}`
      break
  }
  return s
}

export function printAppError(er: AppError): string {
  let s = `tag=${er._tag}`
  switch (er._tag) {
    case 'ProviderError':
      s += ` error=(${printHttpError(er.error)})`
      break
    case 'ValidationError':
      s += ` error=${er.messages.join(', ')}`
      break
  }
  return s
}
