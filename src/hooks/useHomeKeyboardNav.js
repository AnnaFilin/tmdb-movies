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
  const isGridModeRef = useRef(false);

  const onKeyDownRef = useRef(null);

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
    isGridModeRef.current = false;

    const getEl = (k) => {
      if (k === "popular") return popularRef.current;
      if (k === "now_playing") return nowPlayingRef.current;
      if (k === "favorites") return favoritesRef.current;
      if (k === "prev") return prevPageRef.current;
      if (k === "next") return nextPageRef.current;
      if (k === "search") return searchRef.current;
      return null;
    };

    const tryFocus = (k) => {
      const el = getEl(k);
      if (!el) return false;
      if (el.disabled) return false;
      el.focus();
      return document.activeElement === el;
    };

    if (tryFocus(key)) return;

    const last = lastControlRef.current;
    if (last && last !== key && tryFocus(last)) return;

    if (tryFocus("search")) {
      lastControlRef.current = "search";
      return;
    }

    tryFocus("popular");
    lastControlRef.current = "popular";
  };

  const controlsOrder = [
    "popular",
    "now_playing",
    "favorites",
    "prev",
    "next",
    "search",
  ];

  const getControlEl = (k) => {
    if (k === "popular") return popularRef.current;
    if (k === "now_playing") return nowPlayingRef.current;
    if (k === "favorites") return favoritesRef.current;
    if (k === "prev") return prevPageRef.current;
    if (k === "next") return nextPageRef.current;
    if (k === "search") return searchRef.current;
    return null;
  };

  const moveControlFocus = (dir) => {
    const current = lastControlRef.current;
    const idx = controlsOrder.indexOf(current);
    if (idx === -1) return;

    let nextIdx = idx;

    for (let i = 0; i < controlsOrder.length; i += 1) {
      nextIdx = Math.max(0, Math.min(controlsOrder.length - 1, nextIdx + dir));

      const key = controlsOrder[nextIdx];
      const el = getControlEl(key);

      if (el && !el.disabled) {
        focusControl(key);
        return;
      }

      if (nextIdx === 0 || nextIdx === controlsOrder.length - 1) return;
    }
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
    if (!isGridModeRef.current) return;

    const el = gridRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
    if (!el) return;

    el.focus();
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeIndex, gridRef]);

  useEffect(() => {
    setActiveIndex(0);

    requestAnimationFrame(() => {
      const el = document.activeElement;

      const isFocusable =
        el === popularRef.current ||
        el === nowPlayingRef.current ||
        el === favoritesRef.current ||
        el === prevPageRef.current ||
        el === nextPageRef.current ||
        el === searchRef.current ||
        el?.hasAttribute?.("data-idx");

      if (!isFocusable) {
        focusControl(lastControlRef.current || "search");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeList, popular.page, nowPlaying.page, itemsForGrid.length]);

  const onKeyDown = (e) => {
    const cols = gridColsRef.current || 4;
    const activeEl = document.activeElement;

    if (
      !activeEl ||
      activeEl === document.body ||
      activeEl === document.documentElement
    ) {
      e.preventDefault();
      focusControl(lastControlRef.current || "search");
      return;
    }

    const active = activeEl;
    const isInControls =
      active === popularRef.current ||
      active === nowPlayingRef.current ||
      active === favoritesRef.current ||
      active === prevPageRef.current ||
      active === nextPageRef.current ||
      active === searchRef.current;

    if (isInControls && e.key === "ArrowDown") {
      e.preventDefault();

      isGridModeRef.current = true;

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
      isGridModeRef.current = true;
      setActiveIndex((prev) => clampIndex(prev + 1));
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      isGridModeRef.current = true;
      setActiveIndex((prev) => clampIndex(prev - 1));
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      isGridModeRef.current = true;
      setActiveIndex((prev) => clampIndex(prev + cols));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      isGridModeRef.current = true;

      const colsNow = gridColsRef.current || 4;

      if (activeIndex < colsNow) {
        focusControl(lastControlRef.current || "search");
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
      focusControl(lastControlRef.current || "search");
      return;
    }
  };

  useEffect(() => {
    onKeyDownRef.current = onKeyDown;
  });

  useEffect(() => {
    const handler = (e) => {
      const isNavKey =
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "Enter" ||
        e.key === "Escape";

      if (!isNavKey) return;

      onKeyDownRef.current?.(e);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return {
    activeIndex,
    setActiveIndex,
    onKeyDown,
    clearFocusTimer,
    focusTimerRef,
    lastControlRef,
  };
}
