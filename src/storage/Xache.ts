import { Entry, StorageBackend, createStorage } from './Storage'

const Xache = require('xache')

const createCache = <A>(xache: any): StorageBackend<A> => ({
  get: (key: string, cb: (er: Error | null, a?: Entry<A>) => void) => {
    if (xache.has(key)) {
      cb(null, { key, value: xache.get(key) })
      return
    }
    cb(new Error('not found'))
  },
  put: (key: string, value: A, cb: (er: Error | null, a?: Entry<A>) => void) => {
    xache.set(key, value)
    cb(null, { key, value: xache.get(key) })
  },
})

export interface XacheOptions {
  maxAge: number
  maxSize: number
}

const createXacheStorage = <A>(opts: XacheOptions) => createStorage<A>(createCache<A>(new Xache(opts)))

export default createXacheStorage
