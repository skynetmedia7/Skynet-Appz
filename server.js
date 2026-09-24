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
  version: "2.0.5",
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
    { type: "movie", id: "skynet-latest-movies", name: "Latest" },
    { type: "movie", id: "skynet-action-movies", name: "Action" },
    { type: "movie", id: "skynet-adventure-movies", name: "Adventure" },
    { type: "movie", id: "skynet-animation-movies", name: "Animation" },
    { type: "movie", id: "skynet-comedy-movies", name: "Comedy" },
    { type: "movie", id: "skynet-crime-movies", name: "Crime" },
    { type: "movie", id: "skynet-documentary-movies", name: "Documentary" },
    { type: "movie", id: "skynet-drama-movies", name: "Drama" },
    { type: "movie", id: "skynet-family-movies", name: "Family" },
    { type: "movie", id: "skynet-fantasy-movies", name: "Fantasy" },
    { type: "movie", id: "skynet-history-movies", name: "History" },
    { type: "movie", id: "skynet-horror-movies", name: "Horror" },
    { type: "movie", id: "skynet-music-movies", name: "Music" },
    { type: "movie", id: "skynet-mystery-movies", name: "Mystery" },
    { type: "movie", id: "skynet-romance-movies", name: "Romance" },
    { type: "movie", id: "skynet-sci-fi-movies", name: "Sci-Fi" },
    { type: "movie", id: "skynet-thriller-movies", name: "Thriller" },
    { type: "movie", id: "skynet-tv-movie-movies", name: "TV Movie" },
    { type: "movie", id: "skynet-war-movies", name: "War" },
    { type: "movie", id: "skynet-western-movies", name: "Western" },
    { type: "movie", id: "skynet-kids-movies", name: "Kids" },
    { type: "series", id: "skynet-trending-series", name: "Trending" },
    { type: "series", id: "skynet-popular-series", name: "Popular" },
    { type: "series", id: "skynet-top-rated-series", name: "Top Rated" },
    { type: "series", id: "skynet-on-air-series", name: "On Air" },
    { type: "series", id: "skynet-action-adventure-series", name: "Action & Adventure" },
    { type: "series", id: "skynet-animation-series", name: "Animation" },
    { type: "series", id: "skynet-comedy-series", name: "Comedy" },
    { type: "series", id: "skynet-crime-series", name: "Crime" },
    { type: "series", id: "skynet-documentary-series", name: "Documentary" },
    { type: "series", id: "skynet-drama-series", name: "Drama" },
    { type: "series", id: "skynet-family-series", name: "Family" },
    { type: "series", id: "skynet-kids-series", name: "Kids" },
    { type: "series", id: "skynet-mystery-series", name: "Mystery" },
    { type: "series", id: "skynet-news-series", name: "News" },
    { type: "series", id: "skynet-reality-series", name: "Reality" },
    { type: "series", id: "skynet-sci-fi-fantasy-series", name: "Sci-Fi & Fantasy" },
    { type: "series", id: "skynet-soap-series", name: "Soap" },
    { type: "series", id: "skynet-talk-series", name: "Talk" },
    { type: "series", id: "skynet-war-politics-series", name: "War & Politics" },
    { type: "series", id: "skynet-western-series", name: "Western" }
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

const movieGenreNames = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 53: "Thriller",
  10770: "TV Movie", 10752: "War", 37: "Western"
};

const seriesGenreNames = {
  10759: "Action & Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 10762: "Kids",
  9648: "Mystery", 10763: "News", 10764: "Reality", 10765: "Sci-Fi & Fantasy",
  10766: "Soap", 10767: "Talk", 10768: "War & Politics", 37: "Western"
};

function meta(item, type) {
  const genreNames = type === "movie" ? movieGenreNames : seriesGenreNames;
  const genres = Array.isArray(item.genres)
    ? item.genres.map(g => g.name).filter(Boolean)
    : Array.isArray(item.genre_ids)
      ? item.genre_ids.map(id => genreNames[id]).filter(Boolean)
      : [];

  return {
    id: "tmdb:" + item.id,
    type,
    name: item.title || item.name,
    poster: item.poster_path
      ? "https://image.tmdb.org/t/p/w342" + item.poster_path
      : undefined,
    posterShape: "poster",
    genres: genres.length ? genres : undefined,
    background: item.backdrop_path
      ? "https://image.tmdb.org/t/p/w1280" + item.backdrop_path
      : undefined,
    description: item.overview || undefined,
    releaseInfo: (item.release_date || item.first_air_date || "").slice(0, 4),
    imdbRating: item.vote_average != null
      ? Number(item.vote_average.toFixed(1))
      : undefined
  };
}

function catalogMeta(item, type) {
  const genreNames = type === "movie" ? movieGenreNames : seriesGenreNames;
  const genres = Array.isArray(item.genre_ids)
    ? item.genre_ids.map(id => genreNames[id]).filter(Boolean)
    : [];

  return {
    id: "tmdb:" + item.id,
    type,
    name: item.title || item.name,
    poster: item.poster_path
      ? "https://image.tmdb.org/t/p/w185" + item.poster_path
      : undefined,
    posterShape: "poster",
    genres: genres.length ? genres : undefined,
    releaseInfo: (item.release_date || item.first_air_date || "").slice(0, 4),
    imdbRating: item.vote_average != null
      ? Number(item.vote_average.toFixed(1))
      : undefined
  };
}

async function sendCatalog(res, paths, type, limit = 50, catalogId = "unknown") {
  try {
    const pagePaths = Array.isArray(paths) ? paths : [paths];
    const pages = await Promise.all(pagePaths.map(path => tmdb(path)));
    const results = pages.flatMap(data => data.results || []);

    const uniqueResults = [];
    const seenIds = new Set();

    for (const item of results) {
      if (!item || !item.id || !item.poster_path || seenIds.has(item.id)) continue;
      seenIds.add(item.id);
      uniqueResults.push(item);
      if (uniqueResults.length >= limit) break;
    }

    const metas = uniqueResults.map(x => catalogMeta(x, type));

    console.log(
      "CATALOG " + catalogId + " type=" + type + " pages=" + pagePaths.length + " results=" + metas.length
    );

    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.status(200).json({
      metas,
      cacheMaxAge: 0,
      staleRevalidate: 0,
      staleError: 0
    });
  } catch (e) {
    console.error("CATALOG ERROR " + type + " " + e.message);

    res.status(200).json({
      metas: [],
      cacheMaxAge: 60,
      staleRevalidate: 300,
      staleError: 600
    });
  }
}

app.get("/catalog/movie/skynet-latest-movies.json", (_req, res) =>
  sendCatalog(
    res,
    [1, 2, 3].map(page => "/discover/movie?language=en-US&region=GB&sort_by=primary_release_date.desc&release_date.lte=2026-09-24&page=" + page),
    "movie",
    50
  )
);

// Backward-compatible movie endpoints for older Stremio/TiviGlass installs that still cache the previous manifest IDs.
app.get("/catalog/movie/skynet-trending-movies.json", (_req, res) =>
  sendCatalog(res, [1, 2, 3].map(page => "/trending/movie/week?language=en-US&page=" + page), "movie", 50)
);

app.get("/catalog/movie/skynet-popular-movies.json", (_req, res) =>
  sendCatalog(res, [1, 2, 3].map(page => "/movie/popular?language=en-US&region=GB&page=" + page), "movie", 50)
);

app.get("/catalog/movie/skynet-top-rated-movies.json", (_req, res) =>
  sendCatalog(res, [1, 2, 3].map(page => "/movie/top_rated?language=en-US&region=GB&page=" + page), "movie", 50)
);

app.get("/catalog/movie/skynet-now-playing-movies.json", (_req, res) =>
  sendCatalog(res, [1, 2, 3].map(page => "/movie/now_playing?language=en-US&region=GB&page=" + page), "movie", 50)
);

app.get("/catalog/series/skynet-trending-series.json", (_req, res) =>
  sendCatalog(
    res,
    [
      "/trending/tv/week?language=en-US&page=1",
      "/trending/tv/week?language=en-US&page=2",
      "/trending/tv/week?language=en-US&page=3"
    ],
    "series",
    50
  )
);

app.get("/catalog/series/skynet-popular-series.json", (_req, res) =>
  sendCatalog(
    res,
    [
      "/tv/popular?language=en-US&page=1",
      "/tv/popular?language=en-US&page=2",
      "/tv/popular?language=en-US&page=3"
    ],
    "series",
    50
  )
);

app.get("/catalog/series/skynet-top-rated-series.json", (_req, res) =>
  sendCatalog(
    res,
    [
      "/tv/top_rated?language=en-US&page=1",
      "/tv/top_rated?language=en-US&page=2",
      "/tv/top_rated?language=en-US&page=3"
    ],
    "series",
    50
  )
);

app.get("/catalog/series/skynet-on-air-series.json", (_req, res) =>
  sendCatalog(
    res,
    [
      "/tv/on_the_air?language=en-US&page=1",
      "/tv/on_the_air?language=en-US&page=2",
      "/tv/on_the_air?language=en-US&page=3"
    ],
    "series",
    50
  )
);


const movieGenres = {
  "action": 28, "adventure": 12, "animation": 16, "comedy": 35,
  "crime": 80, "documentary": 99, "drama": 18, "family": 10751,
  "fantasy": 14, "history": 36, "horror": 27, "music": 10402,
  "mystery": 9648, "romance": 10749, "sci-fi": 878, "thriller": 53,
  "tv-movie": 10770, "war": 10752, "western": 37, "kids": 10751
};

const seriesGenres = {
  "action-adventure": 10759, "animation": 16, "comedy": 35, "crime": 80,
  "documentary": 99, "drama": 18, "family": 10751, "kids": 10762,
  "mystery": 9648, "news": 10763, "reality": 10764,
  "sci-fi-fantasy": 10765, "soap": 10766, "talk": 10767,
  "war-politics": 10768, "western": 37
};

for (const [slug, genreId] of Object.entries(movieGenres)) {
  app.get("/catalog/movie/skynet-" + slug + "-movies.json", (_req, res) =>
    sendCatalog(
      res,
      [1, 2, 3, 4, 5].map(page => "/discover/movie?language=en-US&with_genres=" + genreId + "&sort_by=popularity.desc&page=" + page),
      "movie",
      50
    )
  );
}

for (const [slug, genreId] of Object.entries(seriesGenres)) {
  app.get("/catalog/series/skynet-" + slug + "-series.json", (_req, res) =>
    sendCatalog(
      res,
      [1, 2, 3, 4, 5].map(page => "/discover/tv?language=en-US&with_genres=" + genreId + "&sort_by=popularity.desc&page=" + page),
      "series",
      50
    )
  );
}

async function sendMeta(res, type, id) {
  try {
    const cleanId = decodeURIComponent(id).replace(/^tmdb:/, "");
    const data = await tmdb(
      type === "movie"
        ? "/movie/" + cleanId + "?language=en-US"
        : "/tv/" + cleanId + "?language=en-US"
    );
    res.json({ meta: meta(data, type) });
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
    version: "2.0.5",
    tmdbConfigured: Boolean(TMDB_KEY)
  });
});

app.listen(PORT, () => console.log("Skynet listening on " + PORT));