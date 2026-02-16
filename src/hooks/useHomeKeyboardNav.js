import { useEffect, useRef, useState } from "react";

export function useHomeKeyboardNav({
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
}) {
  const focusTimerRef = useRef(null);
  const gridColsRef = useRef(4);
  const lastControlRef = useRef("popular");

  const [activeIndex, setActiveIndex] = useState(0);

  const setColsFromGrid = () => {
    const gridEl = gridRef.current;
    if (!gridEl) return;

    const style = window.getComputedStyle(gridEl);
    const template = style.gridTemplateColumns || "";
    const cols = template.split(" ").filter(Boolean).length;
    if (cols >= 1) gridColsRef.current = cols;
  };

  const focusControl = (key) => {
    lastControlRef.current = key;

    if (key === "popular") popularRef.current?.focus();
    if (key === "now_playing") nowPlayingRef.current?.focus();
    if (key === "favorites") favoritesRef.current?.focus();
    if (key === "search") searchRef.current?.focus();
    if (key === "prev") prevPageRef.current?.focus();
    if (key === "next") nextPageRef.current?.focus();
  };

  const controlsOrder = [
    "popular",
    "now_playing",
    "favorites",
    "prev",
    "next",
    "search",
  ];

  const moveControlFocus = (dir) => {
    const current = lastControlRef.current;
    const idx = controlsOrder.indexOf(current);
    if (idx === -1) return;

    const nextIdx = Math.max(0, Math.min(controlsOrder.length - 1, idx + dir));
    focusControl(controlsOrder[nextIdx]);
  };

  const clampIndex = (next) => {
    const len = itemsForGrid.length;
    if (len <= 0) return 0;
    return Math.max(0, Math.min(next, len - 1));
  };

  const clearFocusTimer = () => {
    if (focusTimerRef.current) {
      clearTimeout(focusTimerRef.current);
      focusTimerRef.current = null;
    }
  };

  const openMovieByIndex = (idx) => {
    const movie = itemsForGrid[idx];
    if (!movie?.id) return;
    navigate(`/movie/${movie.id}`);
  };

  useEffect(() => {
    focusControl("popular");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setColsFromGrid();

    const onResize = () => setColsFromGrid();
    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = gridRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
    if (!el) return;
    el.focus();
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeIndex, gridRef]);

  const onKeyDown = (e) => {
    const cols = gridColsRef.current || 4;

    const active = document.activeElement;
    const isInControls =
      active === popularRef.current ||
      active === nowPlayingRef.current ||
      active === favoritesRef.current ||
      active === prevPageRef.current ||
      active === nextPageRef.current ||
      active === searchRef.current;

    if (isInControls && e.key === "ArrowDown") {
      e.preventDefault();

      const first = gridRef.current?.querySelector(`[data-idx="0"]`);
      setActiveIndex(clampIndex(0));

      if (first) {
        first.focus();
        first.scrollIntoView({ block: "nearest", inline: "nearest" });
      }

      return;
    }

    if (isInControls && e.key === "ArrowRight") {
      e.preventDefault();
      moveControlFocus(+1);
      return;
    }

    if (isInControls && e.key === "ArrowLeft") {
      e.preventDefault();
      moveControlFocus(-1);
      return;
    }

    if (isInControls && e.key === "Enter") {
      e.preventDefault();

      const key = lastControlRef.current;

      if (key === "prev") {
        const canPaginate =
          activeList === "popular" || activeList === "now_playing";
        if (!canPaginate) return;

        const current = activeList === "now_playing" ? nowPlaying : popular;
        const prevPage = Math.max(1, (current.page || 1) - 1);

        if (activeList === "popular") {
          dispatch(moviesActions.requestPopular({ page: prevPage }));
        }
        if (activeList === "now_playing") {
          dispatch(moviesActions.requestNowPlaying({ page: prevPage }));
        }
      }

      if (key === "next") {
        const canPaginate =
          activeList === "popular" || activeList === "now_playing";
        if (!canPaginate) return;

        const current = activeList === "now_playing" ? nowPlaying : popular;
        const nextPage = Math.min(
          current.totalPages || 1,
          (current.page || 1) + 1,
        );

        if (activeList === "popular") {
          dispatch(moviesActions.requestPopular({ page: nextPage }));
        }
        if (activeList === "now_playing") {
          dispatch(moviesActions.requestNowPlaying({ page: nextPage }));
        }
      }

      if (key === "popular") triggerCategoryLoad("popular");
      if (key === "now_playing") triggerCategoryLoad("now_playing");
      if (key === "favorites")
        dispatch(moviesActions.setActiveList("favorites"));
      if (key === "search") {
        // nothing
      }
      return;
    }

    if (isInControls && e.key === "Escape") {
      e.preventDefault();
      focusControl("popular");
      return;
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActiveIndex((prev) => clampIndex(prev + 1));
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActiveIndex((prev) => clampIndex(prev - 1));
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => clampIndex(prev + cols));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();

      const colsNow = gridColsRef.current || 4;

      if (activeIndex < colsNow) {
        focusControl("search");
        return;
      }

      setActiveIndex((prev) => clampIndex(prev - colsNow));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      openMovieByIndex(activeIndex);
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      focusControl(lastControlRef.current);
      return;
    }
  };

  return {
    activeIndex,
    setActiveIndex,
    onKeyDown,
    clearFocusTimer,
    focusTimerRef,
    lastControlRef,
  };
}
