import { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { moviesActions } from "../features/movies/moviesSlice";
import { useHomeKeyboardNav } from "../hooks/useHomeKeyboardNav";
import Layout from "../components/Layout";
import MovieGrid from "../components/MovieGrid";
import MoviesControls from "../components/MoviesControls";

export default function HomePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const activeList = useSelector((s) => s.movies.activeList);
  const popular = useSelector((s) => s.movies.popular);
  const nowPlaying = useSelector((s) => s.movies.nowPlaying);
  const favoriteIds = useSelector((s) => s.movies.favoriteIds);
  const detailsById = useSelector((s) => s.movies.detailsById);
  const search = useSelector((s) => s.movies.search);

  const baseList =
    activeList === "now_playing"
      ? nowPlaying
      : activeList === "search"
        ? search
        : popular;

  const favoriteItems = favoriteIds
    .map((favId) => detailsById?.[favId]?.data)
    .filter(Boolean);

  const itemsForGrid =
    activeList === "favorites" ? favoriteItems : baseList.items;

  const gridRef = useRef(null);
  const popularRef = useRef(null);
  const nowPlayingRef = useRef(null);
  const favoritesRef = useRef(null);
  const searchRef = useRef(null);
  const prevPageRef = useRef(null);
  const nextPageRef = useRef(null);

  function triggerCategoryLoad(listKey) {
    dispatch(moviesActions.setActiveList(listKey));

    if (listKey === "popular") {
      dispatch(moviesActions.requestPopular({ page: 1 }));
    }
    if (listKey === "now_playing") {
      dispatch(moviesActions.requestNowPlaying({ page: 1 }));
    }
  }

  const openMovieByIndex = (idx) => {
    const movie = itemsForGrid[idx];
    if (!movie?.id) return;
    navigate(`/movie/${movie.id}`);
  };

  const nav = useHomeKeyboardNav({
    itemsForGrid,
    activeList,
    popular,
    nowPlaying,
    dispatch,
    navigate,
    moviesActions,
    triggerCategoryLoad,

    searchRef,
    popularRef,
    nowPlayingRef,
    favoritesRef,
    prevPageRef,
    nextPageRef,
    gridRef,
  });

  const activeIndex = nav.activeIndex;

  const clearFocusTimer = nav.clearFocusTimer;
  const focusTimerRef = nav.focusTimerRef;
  const lastControlRef = nav.lastControlRef;

  return (
    <div
      onClick={(e) => {
        const btn = e.target.closest?.("[data-idx]");
        if (!btn) return;
        const idx = Number(btn.getAttribute("data-idx"));
        if (!Number.isFinite(idx)) return;
        openMovieByIndex(idx);
      }}
    >
      <Layout
        title="Movies"
        controls={
          <MoviesControls
            state={{ activeList, popular, nowPlaying }}
            refs={{
              popularRef,
              nowPlayingRef,
              favoritesRef,
              prevPageRef,
              nextPageRef,
              searchRef,
            }}
            handlers={{
              clearFocusTimer,
              focusTimerRef,
              triggerCategoryLoad,
              dispatch,
              moviesActions,
              lastControlRef,
            }}
          />
        }
      >
        <MovieGrid
          items={itemsForGrid}
          gridRef={gridRef}
          activeIndex={activeIndex}
        />
      </Layout>
    </div>
  );
}
