import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeList: "popular",
  searchQuery: "",
  popular: { items: [], page: 1, totalPages: 1, status: "idle", error: null },
  nowPlaying: {
    items: [],
    page: 1,
    totalPages: 1,
    status: "idle",
    error: null,
  },
  search: { items: [], page: 1, totalPages: 1, status: "idle", error: null },

  detailsById: {},
  favoriteIds: [],
};

const moviesSlice = createSlice({
  name: "movies",
  initialState,
  reducers: {
    initApp() {},

    setActiveList(state, action) {
      state.activeList = action.payload;
    },
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },

    requestPopular(state, action) {
      state.popular.status = "loading";
      state.popular.error = null;
      if (typeof action.payload?.page === "number")
        state.popular.page = action.payload.page;
    },

    receivePopular(state, action) {
      const payload = action.payload || {};
      const { items, page, totalPages } = payload;

      state.popular.items = Array.isArray(items) ? items : [];
      state.popular.page = typeof page === "number" ? page : state.popular.page;

      state.popular.totalPages =
        typeof totalPages === "number" ? totalPages : 1;

      state.popular.status = "succeeded";
      state.popular.error = null;
    },

    failPopular(state, action) {
      state.popular.status = "failed";
      state.popular.error = action.payload || "Failed to load popular movies";
    },

    requestNowPlaying(state, action) {
      state.nowPlaying.status = "loading";
      state.nowPlaying.error = null;
      if (typeof action.payload?.page === "number")
        state.nowPlaying.page = action.payload.page;
    },

    receiveNowPlaying(state, action) {
      const payload = action.payload || {};
      const { items, page, totalPages } = payload;

      state.nowPlaying.items = Array.isArray(items) ? items : [];
      state.nowPlaying.page =
        typeof page === "number" ? page : state.nowPlaying.page;
      state.nowPlaying.totalPages =
        typeof totalPages === "number"
          ? totalPages
          : state.nowPlaying.totalPages;

      state.nowPlaying.status = "succeeded";
      state.nowPlaying.error = null;
    },

    failNowPlaying(state, action) {
      state.nowPlaying.status = "failed";
      state.nowPlaying.error =
        action.payload || "Failed to load now playing movies";
    },

    requestMovieDetails(state, action) {
      const id = String(action.payload?.id ?? action.payload);

      state.detailsById[id] = state.detailsById[id] || {
        data: null,
        status: "idle",
        error: null,
      };
      state.detailsById[id].status = "loading";
      state.detailsById[id].error = null;
    },

    receiveMovieDetails(state, action) {
      const { id, data } = action.payload;
      const key = String(id);
      state.detailsById[key] = { data, status: "succeeded", error: null };
    },

    failMovieDetails(state, action) {
      const { id, error } = action.payload;
      const key = String(id);
      state.detailsById[key] = state.detailsById[key] || {
        data: null,
        status: "idle",
        error: null,
      };
      state.detailsById[key].status = "failed";
      state.detailsById[key].error = error;
    },

    loadFavoritesFromStorage(state, action) {
      const ids = action.payload?.ids;
      state.favoriteIds = Array.isArray(ids) ? ids : [];
    },

    toggleFavorite(state, action) {
      const id = Number(action.payload.id);
      const set = new Set(state.favoriteIds);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      state.favoriteIds = Array.from(set);
    },

    requestSearch(state, action) {
      state.search.status = "loading";
      state.search.error = null;
      if (typeof action.payload?.page === "number")
        state.search.page = action.payload.page;
    },

    receiveSearch(state, action) {
      const payload = action.payload || {};
      const { items, page, totalPages } = payload;

      state.search.items = Array.isArray(items) ? items : [];
      state.search.page = typeof page === "number" ? page : state.search.page;
      state.search.totalPages =
        typeof totalPages === "number" ? totalPages : state.search.totalPages;

      state.search.status = "succeeded";
      state.search.error = null;
    },

    failSearch(state, action) {
      state.search.status = "failed";
      state.search.error = action.payload || "Failed to search movies";
    },
  },
});

export const moviesActions = moviesSlice.actions;
export default moviesSlice.reducer;
