export default function MoviesControls({ state, refs, handlers }) {
  const { activeList, popular, nowPlaying } = state;

  const {
    popularRef,
    nowPlayingRef,
    favoritesRef,
    prevPageRef,
    nextPageRef,
    searchRef,
  } = refs;

  const {
    clearFocusTimer,
    focusTimerRef,
    focusSeqRef,
    triggerCategoryLoad,
    dispatch,
    moviesActions,
    lastControlRef,
  } = handlers;

  const isPaginated = activeList === "popular" || activeList === "now_playing";

  const current = activeList === "now_playing" ? nowPlaying : popular;

  const currentPage = current?.page || 1;
  const totalPages = current?.totalPages || 1;

  const prevDisabled = !isPaginated || currentPage <= 1;
  const nextDisabled = !isPaginated || currentPage >= totalPages;

  const pageText = isPaginated
    ? `Page ${currentPage} / ${totalPages}`
    : "Page 1 / 1";

  return (
    <div className="controlsBar">
      <div className="controlsLeft">
        <button
          className={`chip ${activeList === "popular" ? "chipActive" : ""}`}
          type="button"
          ref={popularRef}
          onFocus={() => {
            lastControlRef.current = "popular";
            // If already active, do nothing (avoid unnecessary scheduled load)
            if (activeList === "popular") return;

            const seq = ++focusSeqRef.current;

            clearFocusTimer();
            focusTimerRef.current = setTimeout(() => {
              if (focusSeqRef.current !== seq) return;
              triggerCategoryLoad("popular");
            }, 2000);
          }}
          onBlur={clearFocusTimer}
          onClick={() => {
            focusSeqRef.current += 1;
            clearFocusTimer();
            triggerCategoryLoad("popular");
          }}
        >
          Popular
        </button>

        <button
          className={`chip ${activeList === "now_playing" ? "chipActive" : ""}`}
          type="button"
          ref={nowPlayingRef}
          onFocus={() => {
            lastControlRef.current = "now_playing";
            if (activeList === "now_playing") return;
            const seq = ++focusSeqRef.current;

            clearFocusTimer();
            focusTimerRef.current = setTimeout(() => {
              if (focusSeqRef.current !== seq) return;
              triggerCategoryLoad("now_playing");
            }, 2000);
          }}
          onBlur={clearFocusTimer}
          onClick={() => {
            focusSeqRef.current += 1;
            clearFocusTimer();
            triggerCategoryLoad("now_playing");
          }}
        >
          Airing Now
        </button>

        <button
          className={`chip ${activeList === "favorites" ? "chipActive" : ""}`}
          type="button"
          ref={favoritesRef}
          onFocus={() => {
            lastControlRef.current = "favorites";
            if (activeList === "favorites") return;
            const seq = ++focusSeqRef.current;

            clearFocusTimer();
            focusTimerRef.current = setTimeout(() => {
              if (focusSeqRef.current !== seq) return;
              dispatch(moviesActions.setActiveList("favorites"));
            }, 2000);
          }}
          onBlur={clearFocusTimer}
          onClick={() => {
            focusSeqRef.current += 1;
            clearFocusTimer();
            dispatch(moviesActions.setActiveList("favorites"));
          }}
        >
          My Favorites
        </button>
      </div>

      <div className="controlsCenter">
        <button
          className="chip small"
          type="button"
          ref={prevPageRef}
          disabled={prevDisabled}
          onFocus={() => {
            lastControlRef.current = "prev";
          }}
          onClick={(e) => e.preventDefault()}
        >
          Prev
        </button>

        <div className="pageInfo">{pageText}</div>

        <button
          className="chip small"
          type="button"
          ref={nextPageRef}
          disabled={nextDisabled}
          onFocus={() => {
            lastControlRef.current = "next";
          }}
          onClick={(e) => e.preventDefault()}
        >
          Next
        </button>
      </div>

      <div className="controlsRight">
        <input
          ref={searchRef}
          name="search"
          className="searchInput"
          placeholder="Search movies…"
          aria-label="Search movies"
          onFocus={() => {
            lastControlRef.current = "search";
          }}
          onChange={(e) => {
            dispatch(moviesActions.setSearchQuery(e.target.value));
          }}
        />
      </div>
    </div>
  );
}
