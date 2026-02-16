const BASE_URL =
  import.meta.env.VITE_TMDB_BASE_URL || "https://api.themoviedb.org/3";
const READ_TOKEN = import.meta.env.VITE_TMDB_READ_TOKEN;
const TIMEOUT_MS = Number(import.meta.env.VITE_TMDB_TIMEOUT_MS || 8000);

function buildUrl(path, params) {
  const url = new URL(BASE_URL + path);

  if (params && typeof params === "object") {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

async function request(path, { params, signal } = {}) {
  if (!READ_TOKEN) {
    throw new Error("Missing VITE_TMDB_READ_TOKEN in .env");
  }

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), TIMEOUT_MS);

  const combinedController = new AbortController();

  const abort = () => {
    if (!combinedController.signal.aborted) {
      combinedController.abort();
    }
  };

  if (signal) {
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
  }

  timeoutController.signal.addEventListener("abort", abort, { once: true });

  try {
    const res = await fetch(buildUrl(path, params), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${READ_TOKEN}`,
        "Content-Type": "application/json;charset=utf-8",
      },
      signal: combinedController.signal,
    });

    if (!res.ok) {
      let bodyText = "";
      try {
        bodyText = await res.text();
      } catch {
        // ignore
      }
      throw new Error(
        `TMDB ${res.status} ${res.statusText}${bodyText ? `: ${bodyText}` : ""}`,
      );
    }

    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export const tmdbClient = {
  getPopular: ({ page = 1 } = {}, options) =>
    request("/movie/popular", { params: { page }, ...options }),

  getNowPlaying: ({ page = 1 } = {}, options) =>
    request("/movie/now_playing", { params: { page }, ...options }),

  getMovieDetails: (id, options) => request(`/movie/${id}`, options),

  searchMovies: ({ query, page = 1 } = {}, options) =>
    request("/search/movie", { params: { query, page }, ...options }),
};
