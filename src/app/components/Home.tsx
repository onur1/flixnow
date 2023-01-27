import * as React from 'react'
import Typography from '@material-ui/core/Typography'
import { createStyles, Theme, makeStyles } from '@material-ui/core/styles'
import ImageList from '@material-ui/core/ImageList'
import ImageListItem from '@material-ui/core/ImageListItem'
import Link from '@material-ui/core/Link'
import { SearchResult } from '../../tmdb/model'
import { hrefs } from '../Router'

const usePopularResultsStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexWrap: 'wrap',
      overflow: 'hidden',
      backgroundColor: theme.palette.background.paper,
      marginTop: 20,
    },
    imageList: {
      // width: '72%',
      // Promote the list into its own layer in Chrome. This cost memory, but helps keep FPS high.
      transform: 'translateZ(0)',
    },
    imageListItem: {
      '& .MuiImageListItem-item a': {
        display: 'block',
        height: '100%',
      },
      '& .MuiImageListItem-item img': {
        objectFit: 'cover',
        width: '100%',
        height: '100%',
      },
    },
    icon: {
      color: 'white',
    },
  })
)

export type HomeProps = {
  onLink: React.MouseEventHandler
  results: Array<SearchResult>
}

const PopularResults: React.FC<HomeProps> = (props: HomeProps) => {
  const classes = usePopularResultsStyles()

  const { onLink, results } = props

  return (
    <div className={classes.root}>
      <ImageList gap={1} className={classes.imageList} cols={6}>
        {results.slice(0, 6).map(({ original_title, poster_path, id }) => (
          <ImageListItem key={id} rows={1} cols={1} className={classes.imageListItem}>
            <Link href={hrefs.movie({ id })} onClick={onLink}>
              <img
                src={poster_path ? `https://image.tmdb.org/t/p/w200${poster_path}` : undefined}
                alt={original_title}
              />
            </Link>
          </ImageListItem>
        ))}
      </ImageList>
    </div>
  )
}

const Home: React.FC<HomeProps> = (props: HomeProps) => {
  return (
    <div style={{ marginTop: 20 }}>
      <Typography variant="h6">
        Catch up on the latest releases, or find your next favourite film in this modest corner of the Internet.
      </Typography>
      <PopularResults {...props} />
    </div>
  )
}

export default Home
