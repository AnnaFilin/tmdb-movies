export default function MovieGrid({ items, gridRef }) {
  const safeItems = Array.isArray(items) ? items : [];

  if (safeItems.length === 0) {
    return <div style={{ padding: 16 }}>No movies to display</div>;
  }

  return (
    <div className="grid" ref={gridRef}>
      {safeItems.map((m, idx) => {
        const title = m?.title || m?.name || "Untitled";
        const year = (m?.release_date || m?.first_air_date || "").slice(0, 4);
        const posterPath = m?.poster_path;

        return (
          <button
            key={m?.id ?? idx}
            type="button"
            className="card"
            data-idx={idx}
          >
            <div className="poster">
              {posterPath ? (
                <img
                  alt={title}
                  src={`https://image.tmdb.org/t/p/w342${posterPath}`}
                  loading="lazy"
                />
              ) : (
                <div className="posterFallback">No image</div>
              )}
            </div>

            <div className="meta">
              <div className="title">{title}</div>
              <div className="year">{year || "—"}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
