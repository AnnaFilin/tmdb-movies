import { useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { moviesActions } from "../features/movies/moviesSlice";
import Layout from "../components/Layout";

export default function MovieDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const detailsEntry = useSelector((state) => state.movies.detailsById?.[id]);
  const status = detailsEntry?.status || "idle";
  const error = detailsEntry?.error || null;
  const movie = detailsEntry?.data || null;

  const favBtnRef = useRef(null);

  const favoriteIds = useSelector((state) => state.movies.favoriteIds);
  const isFavorite = favoriteIds.includes(Number(id));

  const toggleFavorite = () => {
    dispatch(moviesActions.toggleFavorite({ id: Number(id) }));
  };

  useEffect(() => {
    if (!id) return;
    dispatch(moviesActions.requestMovieDetails(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (status === "succeeded") {
      favBtnRef.current?.focus();
    }
  }, [status]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();

      // IMPORTANT: pass "from" to Home, because back won't carry it.
      const from = location.state?.from || null;

      navigate("/", {
        replace: true,
        state: from ? { from } : null,
      });
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [navigate, location.state]);

  if (status === "loading" || status === "idle") {
    return (
      <div style={{ padding: 16 }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 8 }}>Failed to load movie.</div>
        <div style={{ opacity: 0.8, fontSize: 12 }}>{error}</div>
      </div>
    );
  }

  const title = movie?.title || "Untitled";
  const year = movie?.release_date
    ? String(movie.release_date).slice(0, 4)
    : "";
  const overview = movie?.overview || "No overview.";

  return (
    <Layout title={title || "Movie"}>
      <div className="detailsWrapper">
        <div className="detailsCard">
          {movie?.poster_path && (
            <img
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              className="detailsPoster"
            />
          )}

          <div className="detailsContent">
            <div className="detailsTitle">
              {title}
              {year ? ` (${year})` : ""}
            </div>

            <div className="detailsOverview">
              {overview || "No description available."}
            </div>

            <button
              ref={favBtnRef}
              type="button"
              className={`detailsBtn ${isFavorite ? "detailsBtnActive" : ""}`}
              onClick={toggleFavorite}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleFavorite();
                }
              }}
            >
              {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
