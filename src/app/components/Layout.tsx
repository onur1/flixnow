import { toUndefined } from 'fp-ts/lib/Option'
import * as React from 'react'
import * as t from 'io-ts'
import { props } from 'prop-types-ts'
import { withStyles, WithStyles, Theme } from '@material-ui/core/styles'
import classNames from 'classnames'
import CssBaseline from '@material-ui/core/CssBaseline'
import Alert from '@material-ui/lab/Alert'
import { MuiThemeProvider, createTheme } from '@material-ui/core/styles'
import {
  Model,
  movieOptional,
  notificationOptional,
  popularResultsLens,
  routeLens,
  searchResultsLens,
  searchTermOptional,
} from '../Model'
import NotFound from './NotFound'
import Header from './Header'
import Results from './Results'
import Movie from './Movie'
import Home from './Home'

const theme = createTheme({
  palette: {
    primary: {
      main: '#0000cc',
    },
    background: {
      default: '#fff',
    },
  },
  shadows: Array(25).fill('none') as any,
  typography: {
    fontFamily: '"Roboto Mono", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
  },
})

const styles = (_theme: Theme) => ({
  root: {
    display: 'flex',
    height: '100%',
  },
  content: {
    flexGrow: 1,
    paddingTop: 0,
    height: '100%',
  },
  alert: {
    marginTop: 62,
  },
  contentPaddingTop: {
    paddingTop: 62,
  },
})

const LayoutProps = t.interface({
  model: Model,
  onLink: t.Function,
  onSearchChange: t.Function,
  onSearchSubmit: t.Function,
  classes: t.record(t.string, t.string),
})

type LayoutProps = {
  model: Model
  onLink: React.MouseEventHandler
  onSearchChange: React.ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement>
  onSearchSubmit: (ev?: React.FormEvent<HTMLDivElement>) => void
} & WithStyles<typeof styles>

@props(LayoutProps)
class Layout extends React.Component<LayoutProps> {
  render() {
    const { model, onLink, classes, onSearchChange, onSearchSubmit } = this.props
    const notification = toUndefined(notificationOptional.getOption(model))
    const route = routeLens.get(model)

    return (
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {notification ? (
          <div>
            <Alert className={classes.alert} severity={notification?.severity}>
              {notification?.text}
            </Alert>
          </div>
        ) : null}
        <Header
          onLink={onLink}
          searchTerm={searchTermOptional.getOption(model)}
          onSearchChange={onSearchChange}
          onSearchSubmit={onSearchSubmit}
        />
        <div className={classes.root}>
          <main className={notification ? classes.content : classNames(classes.content, classes.contentPaddingTop)}>
            {route._tag === 'Home' ? (
              <Home onLink={onLink} results={popularResultsLens.get(model)} />
            ) : route._tag === 'Results' ? (
              <Results onLink={onLink} results={searchResultsLens.get(model)} />
            ) : route._tag === 'Movie' ? (
              <Movie movie={movieOptional.getOption(model)} onLink={onLink} />
            ) : (
              <NotFound />
            )}
          </main>
        </div>
      </MuiThemeProvider>
    )
  }
}

export default withStyles(styles)(Layout)
