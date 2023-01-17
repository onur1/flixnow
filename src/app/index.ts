import * as O from 'fp-ts/lib/Option'
import * as T from 'fp-ts/lib/Task'
import { pipe, flow, identity } from 'fp-ts/lib/function'
import { warn } from 'fp-ts/lib/Console'
import { run, Html } from 'elm-ts/lib/React'
import { program } from 'elm-ts/lib/Navigation'
import { perform } from 'elm-ts/lib/Task'
import { Dispatch } from 'elm-ts/lib/Platform'
import { render } from 'react-dom'
import { createElement } from 'react'
import { navigate, Msg, pushUrl, updateSearchTerm, SubmitSearch } from './Msg'
import { Model, zero } from './Model'
import { update } from './Effect'
import Layout from './components/Layout'

const getHandlers = memoize((go: Dispatch<Msg>) => ({
  onLink: (ev: React.MouseEvent<HTMLElement>) => {
    ev.preventDefault()
    const href = ev.currentTarget.getAttribute('href')
    if (href) {
      go(pushUrl(href))
    } else {
      warn(`target missing 'href'`)()
    }
  },
  onSearchChange: (ev: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    ev.preventDefault()
    go(updateSearchTerm(ev.target.value))
  },
  onSearchSubmit: (ev?: React.FormEvent<HTMLDivElement>): void => {
    if (ev) {
      ev.preventDefault()
      ev.stopPropagation()
    }
    go(SubmitSearch)
  },
}))

function view(model: Model): Html<Msg> {
  return f => createElement(Layout, { model, ...getHandlers(f) })
}

const app = program(
  navigate,
  flow(navigate, cmd => [zero(cmd.route), perform(identity)(T.fromIO(() => cmd))]),
  update,
  view
)

function memoize<A, B>(f: (a: A) => B): (a: A) => B {
  let memo: B
  let memoized = false
  return a => {
    if (!memoized) {
      memo = f(a)
      memoized = true
    }
    return memo
  }
}

const mount = (elementId: string) =>
  pipe(
    O.fromNullable(document.getElementById(elementId)),
    O.fold(warn('#content missing'), el => run(app, dom => render(dom, el)))
  )

export default mount

if (require.main == module) {
  mount('content')
}
