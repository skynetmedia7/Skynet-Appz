import express from "express";

const app = express();
const PORT = process.env.PORT || 10000;
const TMDB_KEY = process.env.TMDB_API_KEY || "";

app.use((req, _res, next) => {
  console.log("REQUEST " + req.method + " " + req.originalUrl);
  next();
});

const manifest = {
  id: "com.skynet.stremio",
  version: "1.8.0",
  name: "Skynet",
  description: "Skynet catalogue addon for Stremio",
  logo: "https://raw.githubusercontent.com/skynetmedia7/Skynet-Appz/main/logo.png",

  resources: [
    {
      name: "catalog",
      types: ["movie", "series"]
    },
    {
      name: "meta",
      types: ["movie", "series"],
      idPrefixes: ["tmdb:"]
    }
  ],

  types: ["movie", "series"],

  catalogs: [
    { type: "movie", id: "skynet-trending-movies", name: "Trending" },
    { type: "movie", id: "skynet-popular-movies", name: "Popular" },
    { type: "movie", id: "skynet-top-rated-movies", name: "Top Rated" },
    { type: "movie", id: "skynet-now-playing-movies", name: "Now Playing" },
    { type: "series", id: "skynet-trending-series", name: "Trending" },
    { type: "series", id: "skynet-popular-series", name: "Popular" },
    { type: "series", id: "skynet-top-rated-series", name: "Top Rated" },
    { type: "series", id: "skynet-on-air-series", name: "On Air" }
  ],

  behaviorHints: {
    configurable: false
  }
};

app.get("/", (_req, res) => res.json(manifest));
app.get("/manifest.json", (_req, res) => res.json(manifest));

async function tmdb(path) {
  if (!TMDB_KEY) throw new Error("TMDB_API_KEY is not configured");

  const r = await fetch("https://api.themoviedb.org/3" + path, {
    headers: {
      Authorization: "Bearer " + TMDB_KEY,
      accept: "application/json"
    }
  });

  if (!r.ok) throw new Error("TMDB returned " + r.status);
  return r.json();
}

async function imdbId(type, tmdbId) {
  try {
    const data = await tmdb(
      type === "movie"
        ? "/movie/" + tmdbId + "/external_ids"
        : "/tv/" + tmdbId + "/external_ids"
    );
    return data.imdb_id || null;
  } catch {
    return null;
  }
}

function meta(item, type, idOverride) {
  return {
    id: idOverride || ("tmdb:" + item.id),
    type,
    name: item.title || item.name,
    poster: item.poster_path
      ? "https://image.tmdb.org/t/p/w500" + item.poster_path
      : undefined,
    posterShape: "poster",
    background: item.backdrop_path
      ? "https://image.tmdb.org/t/p/w1280" + item.backdrop_path
      : undefined,
    description: item.overview || undefined,
    releaseInfo: (item.release_date || item.first_air_date || "").slice(0, 4),
    imdbRating: item.vote_average
      ? Number(item.vote_average.toFixed(1))
      : undefined
  };
}

async function sendCatalog(res, path, type) {
  try {
    const data = await tmdb(path);
    const results = (data.results || []).filter(x => x.poster_path);
    const metas = await Promise.all(results.map(async x => {
      const imdb = await imdbId(type, x.id);
      return meta(x, type, imdb || ("tmdb:" + x.id));
    }));

    console.log("CATALOG " + type + " " + path + " results=" + metas.length);

    res.status(200).json({
      metas,
      cacheMaxAge: 300,
      staleRevalidate: 3600,
      staleError: 86400
    });
  } catch (e) {
    console.error("CATALOG ERROR " + type + " " + path + " " + e.message);

    res.status(200).json({
      metas: [],
      cacheMaxAge: 60,
      staleRevalidate: 300,
      staleError: 600
    });
  }
}

app.get("/catalog/movie/skynet-trending-movies.json", (_req, res) =>
  sendCatalog(res, "/trending/movie/week?language=en-US", "movie")
);

app.get("/catalog/movie/skynet-popular-movies.json", (_req, res) =>
  sendCatalog(res, "/movie/popular?language=en-US&page=1", "movie")
);

app.get("/catalog/movie/skynet-top-rated-movies.json", (_req, res) =>
  sendCatalog(res, "/movie/top_rated?language=en-US&page=1", "movie")
);

app.get("/catalog/movie/skynet-now-playing-movies.json", (_req, res) =>
  sendCatalog(res, "/movie/now_playing?language=en-US&region=GB&page=1", "movie")
);

app.get("/catalog/series/skynet-trending-series.json", (_req, res) =>
  sendCatalog(res, "/trending/tv/week?language=en-US", "series")
);

app.get("/catalog/series/skynet-popular-series.json", (_req, res) =>
  sendCatalog(res, "/tv/popular?language=en-US&page=1", "series")
);

app.get("/catalog/series/skynet-top-rated-series.json", (_req, res) =>
  sendCatalog(res, "/tv/top_rated?language=en-US&page=1", "series")
);

app.get("/catalog/series/skynet-on-air-series.json", (_req, res) =>
  sendCatalog(res, "/tv/on_the_air?language=en-US&page=1", "series")
);

async function sendMeta(res, type, id) {
  try {
    const cleanId = decodeURIComponent(id).replace(/^tmdb:/, "");
    let data;
    if (cleanId.startsWith("tt")) {
      const found = await tmdb("/find/" + cleanId + "?external_source=imdb_id&language=en-US");
      const results = type === "movie" ? found.movie_results : found.tv_results;
      if (!results || !results.length) throw new Error("IMDb ID not found");
      data = await tmdb(
        type === "movie"
          ? "/movie/" + results[0].id + "?language=en-US"
          : "/tv/" + results[0].id + "?language=en-US"
      );
    } else {
      data = await tmdb(
        type === "movie"
          ? "/movie/" + cleanId + "?language=en-US"
          : "/tv/" + cleanId + "?language=en-US"
      );
    }
    res.json({ meta: meta(data, type, cleanId.startsWith("tt") ? cleanId : undefined) });
  } catch (e) {
    res.status(404).json({ meta: null, error: e.message });
  }
}

app.get("/meta/movie/:id.json", (req, res) =>
  sendMeta(res, "movie", req.params.id)
);

app.get("/meta/series/:id.json", (req, res) =>
  sendMeta(res, "series", req.params.id)
);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    name: "Skynet",
    version: "1.7.0",
    tmdbConfigured: Boolean(TMDB_KEY)
  });
});

app.listen(PORT, () => console.log("Skynet listening on " + PORT));
