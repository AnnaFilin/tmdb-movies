import { useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { moviesActions } from "../features/movies/moviesSlice";
import { useHomeKeyboardNav } from "../hooks/useHomeKeyboardNav";
import Layout from "../components/Layout";
import MovieGrid from "../components/MovieGrid";
import MoviesControls from "../components/MoviesControls";

export default function HomePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const activeList = useSelector((s) => s.movies.activeList);
  const popular = useSelector((s) => s.movies.popular);
  const nowPlaying = useSelector((s) => s.movies.nowPlaying);
  const favoriteIds = useSelector((s) => s.movies.favoriteIds);
  const detailsById = useSelector((s) => s.movies.detailsById);
  const search = useSelector((s) => s.movies.search);
  const searchQuery = useSelector((s) => s.movies.searchQuery);

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

  const openMovieByIndex = useCallback(
    (idx) => {
      const movie = itemsForGrid[idx];
      if (!movie?.id) return;

      navigate(`/movie/${movie.id}`, {
        state: {
          from: {
            activeList,
            index: idx,
            searchQuery,
          },
        },
      });
    },
    [navigate, itemsForGrid, activeList, searchQuery],
  );

  const shouldSkipAutoFocus = Boolean(location.state?.from);

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

    skipAutoFocus: shouldSkipAutoFocus,
    onOpenMovieByIndex: openMovieByIndex,
  });

  useEffect(() => {
    const from = location.state?.from;
    if (!from) return;

    if (typeof from.searchQuery === "string") {
      dispatch(moviesActions.setSearchQuery(from.searchQuery));
    }

    if (from.activeList && from.activeList !== activeList) {
      dispatch(moviesActions.setActiveList(from.activeList));
    }

    if (Number.isFinite(from.index)) {
      nav.setActiveIndex(from.index);

      requestAnimationFrame(() => {
        const el = gridRef.current?.querySelector(`[data-idx="${from.index}"]`);
        if (!el) return;

        el.focus();
        el.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
    }

    navigate(location.pathname, { replace: true, state: null });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeIndex = nav.activeIndex;

  const clearFocusTimer = nav.clearFocusTimer;
  const focusTimerRef = nav.focusTimerRef;
  const focusSeqRef = nav.focusSeqRef;
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
              focusSeqRef,
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
