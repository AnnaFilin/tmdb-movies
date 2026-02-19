import {
  put,
  select,
  call,
  takeEvery,
  takeLatest,
  cancelled,
  delay,
} from "redux-saga/effects";
import { tmdbClient } from "../../api/tmdbClient";
import { moviesActions } from "./moviesSlice";

const FAVORITES_KEY = "tmdb:favorites:v1";

function readFavoriteIdsFromStorage() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  } catch {
    return [];
  }
}

function writeFavoriteIdsToStorage(ids) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage errors (quota/private mode)
  }
}

function* initFavoritesWorker() {
  const ids = readFavoriteIdsFromStorage();
  yield put(moviesActions.loadFavoritesFromStorage({ ids }));

  yield put(moviesActions.requestPopular({ page: 1 }));
}

function* persistFavoritesWorker() {
  const ids = yield select((state) => state.movies.favoriteIds);
  writeFavoriteIdsToStorage(ids);
}

function* requestPopularWorker(action) {
  const page = action.payload?.page ?? 1;

  const existing = yield select((s) => s.movies.popular);

  if (existing?.status === "succeeded" && (existing?.page ?? 1) === page) {
    return; // already have this page, skip network call
  }

  const controller = new AbortController();

  try {
    const data = yield call(
      tmdbClient.getPopular,
      { page },
      { signal: controller.signal },
    );

    yield put(
      moviesActions.receivePopular({
        items: data?.results || [],
        page: data?.page || page,
        totalPages: data?.total_pages || 1,
      }),
    );
  } catch (err) {
    yield put(
      moviesActions.failPopular(err?.message || "Popular request failed"),
    );
  } finally {
    if (yield cancelled()) {
      controller.abort();
    }
  }
}

function* requestMovieDetailsWorker(action) {
  const id = action.payload?.id ?? action.payload;

  if (!id) {
    yield put(
      moviesActions.failMovieDetails({
        id: "unknown",
        error: "Movie id is missing",
      }),
    );
    return;
  }

  const existing = yield select((state) => state.movies.detailsById?.[id]);
  if (existing?.status === "succeeded" && existing?.data) return;

  const controller = new AbortController();

  try {
    const data = yield call(tmdbClient.getMovieDetails, id, {
      signal: controller.signal,
    });

    yield put(
      moviesActions.receiveMovieDetails({
        id,
        data: data || null,
      }),
    );
  } catch (err) {
    if (err?.name === "AbortError") return;

    yield put(
      moviesActions.failMovieDetails({
        id,
        error: err?.message || "Movie details request failed",
      }),
    );
  } finally {
    if (yield cancelled()) {
      controller.abort();
    }
  }
}

function* requestNowPlayingWorker(action) {
  const page = action.payload?.page ?? 1;

  const existing = yield select((s) => s.movies.nowPlaying);

  if (existing?.status === "succeeded" && (existing?.page ?? 1) === page) {
    return; // already have this page, skip network call
  }

  const controller = new AbortController();

  try {
    const data = yield call(
      tmdbClient.getNowPlaying,
      { page },
      { signal: controller.signal },
    );

    yield put(
      moviesActions.receiveNowPlaying({
        items: data?.results || [],
        page: data?.page || page,
        totalPages: data?.total_pages || 1,
      }),
    );
  } catch (err) {
    if (err?.name === "AbortError") return;

    yield put(
      moviesActions.failNowPlaying(
        err?.message || "Now Playing request failed",
      ),
    );
  } finally {
    if (yield cancelled()) {
      controller.abort();
    }
  }
}

let searchTimestamps = [];

function canSearchNow(now) {
  searchTimestamps = searchTimestamps.filter((t) => now - t < 10_000);
  return searchTimestamps.length < 5;
}

function registerSearch(now) {
  searchTimestamps.push(now);
}

function* requestSearchWorker(action) {
  const query = action.payload?.query || "";
  const page = action.payload?.page ?? 1;

  const controller = new AbortController();

  try {
    const data = yield call(
      tmdbClient.searchMovies,
      { query, page },
      { signal: controller.signal },
    );

    yield put(
      moviesActions.receiveSearch({
        items: data?.results || [],
        page: data?.page || page,
        totalPages: data?.total_pages || 1,
      }),
    );
  } catch (err) {
    if (err?.name === "AbortError") return;
    yield put(
      moviesActions.failSearch(err?.message || "Search request failed"),
    );
  } finally {
    if (yield cancelled()) controller.abort();
  }
}

function* searchTypingWorker(action) {
  const query = String(action.payload || "").trim();

  yield put(moviesActions.setActiveList("search"));

  if (query.length < 2) {
    yield put(moviesActions.setActiveList("popular"));
    return;
  }

  yield delay(500);

  const latest = yield select((s) => s.movies.searchQuery || "");
  const latestTrim = String(latest).trim();
  if (latestTrim !== query) return;

  const now = Date.now();
  if (!canSearchNow(now)) {
    return;
  }
  registerSearch(now);

  yield put(moviesActions.requestSearch({ query, page: 1 }));
}

function* ensureFavoritesDetails() {
  const favoriteIds = yield select((s) => s.movies.favoriteIds);
  const detailsById = yield select((s) => s.movies.detailsById);

  for (const id of favoriteIds) {
    const entry = detailsById[id];
    if (!entry || entry.status !== "succeeded") {
      yield put(moviesActions.requestMovieDetails({ id }));
    }
  }
}

function* onActiveListChanged(action) {
  if (action.payload === "favorites") {
    yield* ensureFavoritesDetails();
  }
}

export default function* moviesSaga() {
  yield takeEvery("movies/initApp", initFavoritesWorker);
  yield takeEvery(moviesActions.toggleFavorite.type, persistFavoritesWorker);
  yield takeLatest(moviesActions.requestPopular.type, requestPopularWorker);
  yield takeEvery(
    moviesActions.requestMovieDetails.type,
    requestMovieDetailsWorker,
  );
  yield takeLatest(
    moviesActions.requestNowPlaying.type,
    requestNowPlayingWorker,
  );
  yield takeLatest(moviesActions.requestSearch.type, requestSearchWorker);
  yield takeLatest(moviesActions.setSearchQuery.type, searchTypingWorker);
  yield takeLatest(moviesActions.setActiveList.type, onActiveListChanged);
}
