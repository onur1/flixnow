import React from 'react'
import * as A from 'fp-ts/lib/Array'
import { Option, toNullable, toUndefined } from 'fp-ts/lib/Option'
import { date } from 'io-ts-types/lib/date'
import { pipe } from 'fp-ts/lib/function'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import InputBase from '@material-ui/core/InputBase'
import Grid from '@material-ui/core/Grid'
import Link from '@material-ui/core/Link'
import Rating from '@material-ui/lab/Rating'
import { Movie } from '../../tmdb/model/Movie'

const useStyles = makeStyles(theme => ({
  root: {
    marginTop: 20,
    marginLeft: 0,
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    maxWidth: 853,
    maxHeight: 505,
    [theme.breakpoints.down('lg')]: {
      height: 640,
    },
    [theme.breakpoints.down('md')]: {
      height: 420,
    },
    [theme.breakpoints.down('sm')]: {
      height: 320,
    },
    [theme.breakpoints.down('xs')]: {
      height: 160,
    },
  },
  suggest: {
    padding: 20,
    height: 'auto',
    backgroundColor: '#fffaeb',
    borderRadius: 4,
    width: 'auto',
  },
  doublecol: {
    height: '100%',
  },
}))

export type MovieProps = {
  onLink: React.MouseEventHandler
  movie: Option<Movie>
}

const MovieComponent: React.FC<MovieProps> = (props: MovieProps) => {
  const classes = useStyles()
  const { movie } = props

  return pipe(toUndefined(movie), movie =>
    movie ? (
      <div className={classes.root}>
        <Grid container direction="row">
          <Grid item xs={6}>
            <Typography gutterBottom variant="h6">
              {movie.title === movie.original_title ? movie.title : `${movie.title} (${movie.original_title})`}{' '}
              {date.is(movie.release_date) ? `(${movie.release_date.getFullYear()})` : null}
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p" style={{ marginBottom: 20 }}>
              {movie.runtime} min / {movie.spoken_languages.map(x => x.english_name).join(', ')}
            </Typography>
          </Grid>
          <Grid item xs={6} style={{ textAlign: 'right' }}>
            <Rating name="read-only" value={Math.min(5, movie.vote_average / 2)} size="small" readOnly />
          </Grid>
        </Grid>
        <Grid container direction="row" className={classes.doublecol}>
          <Grid item xs={7}>
            {pipe(
              movie.videos.results,
              A.filter(x => x.site === 'YouTube'),
              A.head,
              toNullable,
              x =>
                x ? (
                  <div className={classes.video}>
                    <iframe
                      width="100%"
                      height="100%"
                      src={`//www.youtube.com/embed/${x.key}`}
                      frameBorder="0"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div className={classes.suggest}>
                    <Typography variant="body2">{`No movie trailer exists`}</Typography>
                    <div>
                      <InputBase autoFocus placeholder="suggest a link..." spellCheck={false} />
                    </div>
                  </div>
                )
            )}
          </Grid>
          <Grid item xs={5}>
            <Typography variant="body1" component="p" style={{ marginLeft: 14, fontSize: '.98em' }}>
              {movie.overview}
            </Typography>
            <Typography style={{ marginLeft: 14, marginTop: 10 }}>
              <Link href={'https://www.imdb.com/title/' + movie.imdb_id} target="_blank" underline="hover">
                View on IMDB
              </Link>
            </Typography>
          </Grid>
        </Grid>
      </div>
    ) : null
  )
}

export default MovieComponent
