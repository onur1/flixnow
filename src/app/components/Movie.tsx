import React from 'react'
import * as A from 'fp-ts/lib/Array'
import { Option, toNullable, toUndefined } from 'fp-ts/lib/Option'
import { date } from 'io-ts-types/lib/date'
import { pipe } from 'fp-ts/lib/function'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
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
    aspectRatio: '16/9',
  },
  suggest: {
    padding: '12px 20px',
    height: '100%',
    backgroundColor: '#fffaeb',
    borderRadius: 4,
    width: '100%',
  },
  overview: {
    marginTop: 12,
    marginBottom: 20,
    [theme.breakpoints.up('sm')]: {
      marginLeft: 12,
      marginTop: 0,
    },
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
        <Grid container direction="row" alignItems="center">
          <Grid item xs={6}>
            <Link href={'https://www.imdb.com/title/' + movie.imdb_id} target="_blank" underline="hover">
              <Typography gutterBottom variant="h6">
                {movie.title === movie.original_title ? movie.title : `${movie.title} (${movie.original_title})`}{' '}
                {date.is(movie.release_date) ? `(${movie.release_date.getFullYear()})` : null}
              </Typography>
            </Link>
          </Grid>
          <Grid item xs={6} style={{ textAlign: 'right' }}>
            <Rating name="read-only" value={Math.min(5, movie.vote_average / 2)} size="small" readOnly />
          </Grid>
        </Grid>
        <Typography variant="body2" color="textSecondary" component="p" style={{ marginBottom: 20 }}>
          {movie.runtime} min{' '}
          {movie.spoken_languages.length ? ' — ' + movie.spoken_languages.map(x => x.english_name).join(', ') : ''}
        </Typography>

        {pipe(
          movie.videos.results,
          A.filter(x => x.site === 'YouTube'),
          A.head,
          toNullable,
          x =>
            x ? (
              <Grid container direction="row">
                <Grid item xs={12} sm={7}>
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
                </Grid>
                <Grid item xs={12} sm={5}>
                  <Typography variant="body1" component="p" className={classes.overview}>
                    {movie.overview}
                  </Typography>
                </Grid>
              </Grid>
            ) : (
              <Typography variant="body1" component="p">
                {movie.overview}
              </Typography>
            )
        )}
      </div>
    ) : null
  )
}

export default MovieComponent
