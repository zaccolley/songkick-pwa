import { h, Component } from 'preact';
import { Link } from 'preact-router';
import style from './style';

export default class Artists extends Component {
  render() {
    const { artists } = this.props;

    let ArtistsList;

    if (artists.length > 0) {
      ArtistsList = artists.map(artist => (
        <li class={style.artist}>
        <Link href={`/artist/${artist.id}`} style={{backgroundImage: `url(${artist.image})`}}>
          <span>{artist.name}</span>
        </Link>
        </li>
      ));
    }

    return (
      <div class={style.page}>
        <h1 class={style.title}>Artists</h1>
        <ul class={style.artists}>
					{ArtistsList}
        </ul>
      </div>
    );
  }
}
