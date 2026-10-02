import express from "express";

const app = express();
const PORT = process.env.PORT || 10000;
const TMDB_KEY = process.env.TMDB_API_KEY || "";

app.use((req, _res, next) => {
  console.log("REQUEST " + req.method + " " + req.originalUrl);

  // The Movies and Series manifests live under separate paths.
  // Stremio uses the manifest's directory as the addon base URL,
  // so map their catalog/meta requests back to the shared handlers.
  if (
    (req.url.startsWith("/movies/") || req.url.startsWith("/series/")) &&
    !req.url.endsWith("/manifest.json")
  ) {
    req.url = req.url.replace(/^\/(movies|series)/, "");
  }

  next();
});

const manifest = {
  id: "com.skynet.stremio.v21",
  version: "2.5.0",
  name: "Skynet Movies",
  description: "Skynet movie catalogue addon. Streaming availability data by JustWatch via TMDB.",
  logo: "https://raw.githubusercontent.com/skynetmedia7/Skynet-Appz/main/logo.png",

  resources: [
    {
      name: "catalog",
      types: ["movie"]
    },
    {
      name: "meta",
      types: ["movie"],
      idPrefixes: ["tmdb:"]
    }
  ],

  types: ["movie"],

  catalogs: [
    { type: "movie", id: "skynet-services-movies", name: "Streaming Services" },
    { type: "movie", id: "skynet-netflix-movies", name: "Netflix" },
    { type: "movie", id: "skynet-prime-video-movies", name: "Prime Video" },
    { type: "movie", id: "skynet-disney-plus-movies", name: "Disney+" },
    { type: "movie", id: "skynet-apple-tv-plus-movies", name: "Apple TV+" },
    { type: "movie", id: "skynet-paramount-plus-movies", name: "Paramount+" },
    { type: "movie", id: "skynet-max-movies", name: "Max" },
    { type: "movie", id: "skynet-bbc-iplayer-movies", name: "BBC iPlayer" },
    { type: "movie", id: "skynet-itvx-movies", name: "ITVX" },
    { type: "movie", id: "skynet-channel-4-movies", name: "Channel 4" }
  ],

  behaviorHints: {
    configurable: false
  }
};

const seriesManifest = {
  id: "com.skynet.stremio.series",
  version: "1.1.0",
  name: "Skynet Series",
  description: "Skynet series catalogue addon. Streaming availability data by JustWatch via TMDB.",
  logo: "https://raw.githubusercontent.com/skynetmedia7/Skynet-Appz/main/logo.png",

  resources: [
    {
      name: "catalog",
      types: ["series"]
    },
    {
      name: "meta",
      types: ["series"],
      idPrefixes: ["tmdb:"]
    }
  ],

  types: ["series"],

  catalogs: [
    { type: "series", id: "skynet-services-series", name: "Streaming Services" },
    { type: "series", id: "skynet-netflix-series", name: "Netflix" },
    { type: "series", id: "skynet-prime-video-series", name: "Prime Video" },
    { type: "series", id: "skynet-disney-plus-series", name: "Disney+" },
    { type: "series", id: "skynet-apple-tv-plus-series", name: "Apple TV+" },
    { type: "series", id: "skynet-paramount-plus-series", name: "Paramount+" },
    { type: "series", id: "skynet-max-series", name: "Max" },
    { type: "series", id: "skynet-bbc-iplayer-series", name: "BBC iPlayer" },
    { type: "series", id: "skynet-itvx-series", name: "ITVX" },
    { type: "series", id: "skynet-channel-4-series", name: "Channel 4" }
  ],

  behaviorHints: {
    configurable: false
  }
};


const allInOneManifest = {
  id: "com.skynet.stremio.all",
  version: "1.0.0",
  name: "Skynet",
  description: "Skynet Movies and Series in one Stremio addon. Streaming availability data by JustWatch via TMDB.",
  logo: "https://raw.githubusercontent.com/skynetmedia7/Skynet-Appz/main/logo.png",
  resources: [
    { name: "catalog", types: ["movie", "series"] },
    { name: "meta", types: ["movie", "series"], idPrefixes: ["tmdb:"] }
  ],
  types: ["movie", "series"],
  catalogs: [
    { type: "movie", id: "skynet-services-movies", name: "Streaming Services" },
    { type: "movie", id: "skynet-netflix-movies", name: "Netflix" },
    { type: "movie", id: "skynet-prime-video-movies", name: "Prime Video" },
    { type: "movie", id: "skynet-disney-plus-movies", name: "Disney+" },
    { type: "movie", id: "skynet-apple-tv-plus-movies", name: "Apple TV+" },
    { type: "movie", id: "skynet-paramount-plus-movies", name: "Paramount+" },
    { type: "movie", id: "skynet-max-movies", name: "Max" },
    { type: "movie", id: "skynet-bbc-iplayer-movies", name: "BBC iPlayer" },
    { type: "movie", id: "skynet-itvx-movies", name: "ITVX" },
    { type: "movie", id: "skynet-channel-4-movies", name: "Channel 4" },
    { type: "series", id: "skynet-services-series", name: "Streaming Services" },
    { type: "series", id: "skynet-netflix-series", name: "Netflix" },
    { type: "series", id: "skynet-prime-video-series", name: "Prime Video" },
    { type: "series", id: "skynet-disney-plus-series", name: "Disney+" },
    { type: "series", id: "skynet-apple-tv-plus-series", name: "Apple TV+" },
    { type: "series", id: "skynet-paramount-plus-series", name: "Paramount+" },
    { type: "series", id: "skynet-max-series", name: "Max" },
    { type: "series", id: "skynet-bbc-iplayer-series", name: "BBC iPlayer" },
    { type: "series", id: "skynet-itvx-series", name: "ITVX" },
    { type: "series", id: "skynet-channel-4-series", name: "Channel 4" }
  ],
  behaviorHints: { configurable: false }
};

app.get("/", (_req, res) => res.json(allInOneManifest));
app.get("/manifest.json", (_req, res) => res.json(allInOneManifest));
app.get("/movies/manifest.json", (_req, res) => res.json(manifest));
app.get("/series/manifest.json", (_req, res) => res.json(seriesManifest));

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

function catalogMeta(item, type, forcedGenre = null) {
  const genreNames = type === "movie" ? movieGenreNames : seriesGenreNames;
  const genres = forcedGenre
    ? [forcedGenre]
    : Array.isArray(item.genre_ids)
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
    description: item.overview || undefined,
    background: item.backdrop_path
      ? "https://image.tmdb.org/t/p/w780" + item.backdrop_path
      : undefined,
    releaseInfo: (item.release_date || item.first_air_date || "").slice(0, 4),
    imdbRating: item.vote_average != null
      ? Number(item.vote_average.toFixed(1))
      : undefined
  };
}

async function sendCatalog(res, paths, type, limit = 50, catalogId = "unknown", forcedGenre = null) {
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

    const metas = uniqueResults.map(x => catalogMeta(x, type, forcedGenre));

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
    "movie", 10
  )
);


app.get("/catalog/movie/skynet-new-releases-movies.json", (_req, res) =>
  sendCatalog(
    res,
    [1, 2, 3, 4, 5].map(page => "/discover/movie?language=en-US&region=GB&sort_by=primary_release_date.desc&primary_release_date.gte=2026-06-26&primary_release_date.lte=2026-09-24&page=" + page),
    "movie", 50,
    "skynet-new-releases-movies",
    "New Releases"
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
    "series", 10
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
    "series", 10
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
    "series", 10
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
    "series", 10
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


app.get("/catalog/movie/skynet-action-movies-v2.json", (_req, res) =>
  sendCatalog(
    res,
    [1, 2, 3, 4, 5].map(page =>
      "/discover/movie?language=en-US&region=GB&with_genres=28&sort_by=popularity.desc&page=" + page
    ),
    "movie", 50,
    "skynet-action-movies-v2",
    "Action"
  )
);

for (const [slug, genreId] of Object.entries(movieGenres)) {
  app.get("/catalog/movie/skynet-" + slug + "-movies.json", (_req, res) =>
    sendCatalog(
      res,
      [1, 2, 3, 4, 5].map(page => "/discover/movie?language=en-US&with_genres=" + genreId + "&sort_by=popularity.desc&page=" + page),
      "movie", 50,
      "skynet-" + slug + "-movies",
      slug === "kids" ? "Kids" : (movieGenreNames[genreId] || slug)
    )
  );
}

for (const [slug, genreId] of Object.entries(seriesGenres)) {
  app.get("/catalog/series/skynet-" + slug + "-series.json", (_req, res) =>
    sendCatalog(
      res,
      [1, 2, 3, 4, 5].map(page => "/discover/tv?language=en-US&with_genres=" + genreId + "&sort_by=popularity.desc&page=" + page),
      "series", 50,
      "skynet-" + slug + "-series",
      seriesGenreNames[genreId] || slug
    )
  );
}


const serviceIcons = [
  { slug: "netflix", name: "Netflix", ids: [8] },
  { slug: "prime-video", name: "Prime Video", ids: [9, 119, 613, 2100, 1898] },
  { slug: "disney-plus", name: "Disney+", ids: [337] },
  { slug: "apple-tv-plus", name: "Apple TV+", ids: [350] },
  { slug: "paramount-plus", name: "Paramount+", ids: [531] },
  { slug: "max", name: "Max", ids: [1899] },
  { slug: "bbc-iplayer", name: "BBC iPlayer", ids: [39] },
  { slug: "itvx", name: "ITVX", ids: [41] },
  { slug: "channel-4", name: "Channel 4", ids: [103] }
];

async function sendServiceCatalog(res, type, manifestUrl) {
  try {
    const providerData = await tmdb("/watch/providers/" + (type === "movie" ? "movie" : "tv") + "?language=en-US&watch_region=GB");
    const providers = providerData.results || [];

    const metas = serviceIcons.map(service => {
      const p = providers.find(x => service.ids.includes(x.provider_id));
      return {
        id: "skynet-service:" + service.slug,
        type,
        name: service.name,
        poster: p?.logo_path
          ? "https://image.tmdb.org/t/p/w185" + p.logo_path
          : undefined,
        posterShape: "square",
        description: "Browse " + service.name + " on Skynet.",
        links: [
          {
            name: "Browse " + service.name,
            category: "catalog",
            url: "stremio:///discover/" + encodeURIComponent(manifestUrl) + "/" + type + "/skynet-" + service.slug + "-" + (type === "movie" ? "movies" : "series")
          }
        ]
      };
    }).filter(x => x.poster);

    res.json({ metas, cacheMaxAge: 3600 });
  } catch (e) {
    console.error("SERVICE ICON ERROR " + type + " " + e.message);
    res.status(200).json({ metas: [] });
  }
}

app.get("/catalog/movie/skynet-services-movies.json", (_req, res) =>
  sendServiceCatalog(res, "movie", "https://skynet-stremio-addon.onrender.com/manifest.json")
);

app.get("/catalog/series/skynet-services-series.json", (_req, res) =>
  sendServiceCatalog(res, "series", "https://skynet-stremio-addon.onrender.com/manifest.json")
);

const streamingProviders = {
  netflix: { name: "Netflix", ids: [8] },
  "prime-video": { name: "Prime Video", ids: [9, 119, 613, 2100, 1898] },
  "disney-plus": { name: "Disney+", ids: [337] },
  "apple-tv-plus": { name: "Apple TV+", ids: [350] },
  "paramount-plus": { name: "Paramount+", ids: [531] },
  max: { name: "Max", ids: [1899] },
  "bbc-iplayer": { name: "BBC iPlayer", ids: [39] },
  itvx: { name: "ITVX", ids: [41] },
  "channel-4": { name: "Channel 4", ids: [103] }
};

for (const [slug, provider] of Object.entries(streamingProviders)) {
  const providerIds = provider.ids.join("|");
  app.get("/catalog/movie/skynet-" + slug + "-movies.json", (_req, res) =>
    sendCatalog(
      res,
      [1, 2, 3, 4, 5].map(page =>
        "/discover/movie?language=en-US&watch_region=GB&with_watch_monetization_types=flatrate&with_watch_providers=" +
        providerIds + "&sort_by=popularity.desc&page=" + page
      ),
      "movie", 50,
      "skynet-" + slug + "-movies",
      provider.name
    )
  );

  app.get("/catalog/series/skynet-" + slug + "-series.json", (_req, res) =>
    sendCatalog(
      res,
      [1, 2, 3, 4, 5].map(page =>
        "/discover/tv?language=en-US&watch_region=GB&with_watch_monetization_types=flatrate&with_watch_providers=" +
        providerIds + "&sort_by=popularity.desc&page=" + page
      ),
      "series", 50,
      "skynet-" + slug + "-series",
      provider.name
    )
  );
}

async function sendMeta(res, type, id) {
  try {
    const cleanId = decodeURIComponent(id);

    if (cleanId.startsWith("skynet-service:")) {
      const slug = cleanId.replace(/^skynet-service:/, "");
      const service = serviceIcons.find(x => x.slug === slug);
      if (!service) return res.status(404).json({ meta: null });

      const manifestUrl = "https://skynet-stremio-addon.onrender.com/manifest.json";
      const catalogId = "skynet-" + slug + "-" + (type === "movie" ? "movies" : "series");

      return res.json({
        meta: {
          id: cleanId,
          type,
          name: service.name,
          poster: undefined,
          posterShape: "square",
          description: "Browse " + service.name + " on Skynet.",
          links: [
            {
              name: "Browse " + service.name,
              category: "catalog",
              url: "stremio:///discover/" + encodeURIComponent(manifestUrl) + "/" + type + "/" + catalogId
            }
          ]
        }
      });
    }

    const tmdbId = cleanId.replace(/^tmdb:/, "");
    const data = await tmdb(
      type === "movie"
        ? "/movie/" + tmdbId + "?language=en-US"
        : "/tv/" + tmdbId + "?language=en-US"
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

app.get("/install", (_req, res) => {
  const manifestUrl = "https://skynet-stremio-addon.onrender.com/manifest.json";
  const moviesManifestUrl = "https://skynet-stremio-addon.onrender.com/movies/manifest.json";
  const seriesManifestUrl = "https://skynet-stremio-addon.onrender.com/series/manifest.json";
  const stremioUrl = "stremio://" + manifestUrl.replace(/^https?:\/\//, "");
  const moviesStremioUrl = "stremio://" + moviesManifestUrl.replace(/^https?:\/\//, "");
  const seriesStremioUrl = "stremio://" + seriesManifestUrl.replace(/^https?:\/\//, "");
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Install Skynet</title>
<style>
body{margin:0;background:#0b0b0f;color:#fff;font-family:Arial,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center}
.card{width:min(520px,90%);text-align:center;background:#17171d;border-radius:22px;padding:30px;box-sizing:border-box;box-shadow:0 10px 40px #0008}
.logo{max-width:190px;max-height:90px;object-fit:contain;margin-bottom:15px}
h1{margin:5px 0 10px;font-size:32px}p{color:#bbb;line-height:1.5}
.btn{display:block;text-decoration:none;background:#ffd400;color:#000;font-weight:700;font-size:19px;padding:16px;border-radius:12px;margin:20px 0}
.alt{display:block;color:#fff;border:1px solid #555;padding:13px;border-radius:10px;text-decoration:none;margin-top:10px}.aiometa{background:#e53935;border-color:#e53935;color:#fff;font-weight:700}.aiostreams{background:#1976d2;border-color:#1976d2;color:#fff;font-weight:700}
small{display:block;color:#888;margin-top:18px;word-break:break-all}
</style>
</head>
<body><div class="card">
<img class="logo" src="https://raw.githubusercontent.com/skynetmedia7/Skynet-Appz/main/logo.png" alt="Skynet">
<h1>Install Skynet</h1>
<p>Install everything in one addon — Movies and Series together.</p>
<a class="btn" href="${stremioUrl}">1. INSTALL SKYNET ALL IN ONE ADDON</a>
<hr style="border:0;border-top:1px solid #333;margin:24px 0">
<p style="font-size:14px;font-weight:700;color:#fff;margin-top:24px">2. INSTALL AIOMETADATA</p>
<a class="alt aiometa" href="https://aiometadata.elfhosted.com/configure/">INSTALL AIOMETADATA</a>
<p style="font-size:14px;font-weight:700;color:#fff;margin-top:18px">3. INSTALL AIOSTREAMS</p>
<a class="alt aiostreams" href="https://aiostreams.elfhosted.com/stremio/configure">INSTALL AIOSTREAMS</a>
<div style="margin-top:24px;padding:16px;border:1px solid #555;border-radius:12px;background:#111118">
<strong style="color:#fff;font-size:18px">⚠️ IMPORTANT</strong>
<p style="margin:8px 0 0;color:#fff;font-weight:700">YOU MUST INSTALL ALL 3 ADDONS BELOW.</p>
<p style="margin:8px 0 0;color:#bbb">1. Skynet All in One<br>2. AIOMetadata<br>3. AIOStreams</p>
<p style="margin:8px 0 0;color:#bbb">If you do not install all 3, Skynet will not work correctly.</p>
</div>
</div></body></html>`;
  res.set("Content-Type","text/html; charset=utf-8");
  res.send(html);
});


/* -------------------------------------------------------------------------- */
/* Skynet standalone app UI                                                   */
/* -------------------------------------------------------------------------- */

app.get("/app/api/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ results: [] });
    const data = await tmdb("/search/multi?language=en-US&query=" + encodeURIComponent(q) + "&include_adult=false&page=1");
    const results = (data.results || [])
      .filter(x => x.media_type === "movie" || x.media_type === "tv")
      .filter(x => x.poster_path)
      .slice(0, 30)
      .map(x => catalogMeta(x, x.media_type));
    res.json({ results });
  } catch (e) {
    console.error("APP SEARCH ERROR " + e.message);
    res.status(200).json({ results: [] });
  }
});

app.get("/app", (_req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#07090d">
<title>SKYNET</title>
<style>
:root{--bg:#07090d;--panel:#11151c;--muted:#9ba3ad;--red:#e50914;--white:#fff}
*{box-sizing:border-box}
html,body{margin:0;background:var(--bg);color:var(--white);font-family:Arial,Helvetica,sans-serif}
body{min-height:100vh;overflow-x:hidden}
button,input{font:inherit}
.top{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:14px;padding:12px 28px;background:rgba(7,9,13,.94);backdrop-filter:blur(14px);border-bottom:1px solid #202630}
.logo{font-size:34px;font-weight:900;letter-spacing:-1.5px;color:#e50914;margin-right:18px;text-shadow:0 4px 20px #e5091450}
.nav{display:flex;gap:10px;align-items:center;flex:1}
.tab{border:0;background:#1b222c;color:#f5f5f5;padding:13px 22px;border-radius:28px;font-weight:800;cursor:pointer;white-space:nowrap}
.tab.active{background:#e50914}
.actions{display:flex;gap:9px;align-items:center}
.icon{border:0;background:#1b222c;color:white;width:44px;height:44px;border-radius:50%;cursor:pointer;font-size:21px}
.clock{font-weight:700;color:#ddd;min-width:48px;text-align:right}
.hero{position:relative;min-height:510px;display:flex;align-items:flex-end;overflow:hidden}
.hero-bg{position:absolute;inset:0;background-size:cover;background-position:center}
.hero-bg:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#07090df5 0%,#07090dbb 42%,#07090d22 78%,#07090d 100%),linear-gradient(0deg,#07090d 0%,transparent 42%)}
.hero-copy{position:relative;z-index:2;width:min(650px,90%);padding:80px 5vw 54px}
.kicker{color:#e50914;font-weight:900;letter-spacing:2px;text-transform:uppercase}
.hero h1{font-size:clamp(42px,6vw,78px);line-height:.95;margin:10px 0 18px}
.meta{color:#ddd;font-weight:700;margin-bottom:14px}
.desc{color:#d2d5da;line-height:1.55;font-size:17px;max-width:600px}
.btns{display:flex;gap:12px;margin-top:24px}
.btn{border:0;border-radius:8px;padding:14px 25px;font-weight:900;cursor:pointer}
.play{background:#fff;color:#000}.list{background:#303640;color:#fff}
main{padding:0 28px 60px}
.section{margin:28px 0}
.section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.section h2{font-size:23px;margin:0}
.see{color:#aaa;font-weight:700}
.row{display:flex;gap:10px;overflow-x:auto;padding-bottom:10px;scrollbar-width:none}
.row::-webkit-scrollbar{display:none}
.card{flex:0 0 150px;cursor:pointer}
.poster{width:150px;height:225px;object-fit:cover;border-radius:8px;background:#1a2028;display:block}
.card-name{font-weight:700;font-size:14px;margin-top:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card-year{color:#8f97a1;font-size:12px;margin-top:3px}
.page-title{font-size:34px;margin:32px 0 4px}
.page-sub{color:#969eaa;margin:0 0 24px}
.searchbar{display:none;position:absolute;right:28px;top:72px;background:#151a22;padding:10px;border:1px solid #333a44;border-radius:12px}
.searchbar.open{display:flex}
.searchbar input{width:min(70vw,360px);background:#0b0e13;color:#fff;border:1px solid #343b46;border-radius:8px;padding:11px 13px;outline:0}
.empty{padding:80px 20px;text-align:center;color:#8f97a1}
@media(max-width:900px){
 .top{padding:10px 12px;gap:8px;overflow-x:auto}.logo{font-size:25px;margin-right:3px}.nav{order:3;flex-basis:100%;overflow-x:auto}.top{flex-wrap:wrap}.tab{padding:10px 15px}.clock{display:none}.hero{min-height:450px}.hero-copy{padding:70px 22px 35px}.hero h1{font-size:46px}main{padding:0 14px 40px}.poster{width:125px;height:188px}.card{flex-basis:125px}
}
</style>
</head>
<body>
<header class="top">
  <div class="logo">SKYNET</div>
  <nav class="nav" aria-label="Main navigation">
    <button class="tab active" data-page="home">⌂ Home</button>
    <button class="tab" data-page="series">▣ Series</button>
    <button class="tab" data-page="films">▤ Films</button>
    <button class="tab" data-page="games">🎮 Games</button>
    <button class="tab" data-page="new">♨ New</button>
  </nav>
  <div class="actions">
    <button class="icon" id="searchBtn" aria-label="Search">⌕</button>
    <button class="icon" id="settingsBtn" aria-label="Settings">⚙</button>
    <div class="clock" id="clock"></div>
  </div>
  <div class="searchbar" id="searchbar">
    <input id="searchInput" placeholder="Search films & series..." autocomplete="off">
  </div>
</header>

<section class="hero">
  <div class="hero-bg" id="heroBg"></div>
  <div class="hero-copy">
    <div class="kicker">SKYNET FEATURED</div>
    <h1 id="heroTitle">Loading…</h1>
    <div class="meta" id="heroMeta"></div>
    <div class="desc" id="heroDesc"></div>
    <div class="btns">
      <button class="btn play" id="heroPlay">▶ Play</button>
      <button class="btn list">＋ My List</button>
    </div>
  </div>
</section>

<main id="content"></main>

<script>
const base = location.origin;
const state = {page:"home", hero:null};
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function titleOf(x){return x?.name||"Untitled";}
function posterOf(x){return x?.poster||"";}
async function getCatalog(type,id){const r=await fetch(base+"/catalog/"+type+"/"+id+".json",{cache:"no-store"});if(!r.ok)return[];const d=await r.json();return d.metas||[];}
function row(title,items){if(!items.length)return"";return '<section class="section"><div class="section-head"><h2>'+esc(title)+'</h2><span class="see">See all ›</span></div><div class="row">'+items.map(x=>'<article class="card"><img class="poster" loading="lazy" src="'+esc(posterOf(x))+'" alt="'+esc(titleOf(x))+'"><div class="card-name">'+esc(titleOf(x))+'</div><div class="card-year">'+esc(x.releaseInfo||"")+'</div></article>').join("")+'</div></section>';}
function setHero(x){if(!x)return;state.hero=x;document.getElementById("heroBg").style.backgroundImage="url('"+(x.background||x.poster||"")+"')";document.getElementById("heroTitle").textContent=titleOf(x);document.getElementById("heroMeta").textContent=[x.releaseInfo,x.imdbRating?("★ "+x.imdbRating):"",x.genres?.slice(0,3).join(" • ")].filter(Boolean).join("  •  ");document.getElementById("heroDesc").textContent=x.description||"";}
async function loadHome(){const [trending,popular,top,series,newMovies]=await Promise.all([getCatalog("movie","skynet-trending-movies"),getCatalog("movie","skynet-popular-movies"),getCatalog("movie","skynet-top-rated-movies"),getCatalog("series","skynet-trending-series"),getCatalog("movie","skynet-new-releases-movies")]);setHero(trending[0]);document.getElementById("content").innerHTML=row("Trending",trending.slice(0,20))+row("Popular",popular.slice(0,20))+row("Top Rated",top.slice(0,20))+row("Series",series.slice(0,20))+row("New Releases",newMovies.slice(0,20));}
async function loadPage(page){state.page=page;document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.page===page));if(page==="home")return loadHome();if(page==="games"){document.getElementById("heroBg").style.backgroundImage="";document.getElementById("heroTitle").textContent="Games";document.getElementById("heroMeta").textContent="SKYNET GAMES";document.getElementById("heroDesc").textContent="The Games tab is ready for the games catalogue to be connected.";document.getElementById("content").innerHTML='<div class="empty">Games catalogue coming next.</div>';return;}const content=document.getElementById("content");content.innerHTML='<div class="empty">Loading '+esc(page)+'…</div>';let rows=[];if(page==="films"){const[a,b,c,n]=await Promise.all([getCatalog("movie","skynet-trending-movies"),getCatalog("movie","skynet-popular-movies"),getCatalog("movie","skynet-top-rated-movies"),getCatalog("movie","skynet-new-releases-movies")]);setHero(a[0]);rows=[row("Trending",a.slice(0,30)),row("Popular",b.slice(0,30)),row("Top Rated",c.slice(0,30)),row("New Releases",n.slice(0,30))];}else if(page==="series"){const[a,b,c]=await Promise.all([getCatalog("series","skynet-trending-series"),getCatalog("series","skynet-popular-series"),getCatalog("series","skynet-top-rated-series")]);setHero(a[0]);rows=[row("Trending",a.slice(0,30)),row("Popular",b.slice(0,30)),row("Top Rated",c.slice(0,30))];}else{const n=await getCatalog("movie","skynet-new-releases-movies");setHero(n[0]);rows=[row("New Releases",n.slice(0,50))];}content.innerHTML=rows.join("");}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>loadPage(b.dataset.page)));
document.getElementById("searchBtn").addEventListener("click",()=>{const box=document.getElementById("searchbar");box.classList.toggle("open");if(box.classList.contains("open"))document.getElementById("searchInput").focus();});
document.getElementById("searchInput").addEventListener("keydown",async e=>{if(e.key!=="Enter")return;const q=e.target.value.trim();if(!q)return;const r=await fetch(base+"/app/api/search?q="+encodeURIComponent(q));const d=await r.json();document.getElementById("content").innerHTML='<h1 class="page-title">Search</h1><p class="page-sub">Results for “'+esc(q)+'”</p><div class="row">'+(d.results||[]).map(x=>'<article class="card"><img class="poster" src="'+esc(posterOf(x))+'"><div class="card-name">'+esc(titleOf(x))+'</div><div class="card-year">'+esc(x.releaseInfo||"")+'</div></article>').join("")+'</div>';});
document.getElementById("settingsBtn").addEventListener("click",()=>alert("Skynet settings will be added here."));
function tick(){document.getElementById("clock").textContent=new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});}tick();setInterval(tick,30000);loadHome();
</script>
</body>
</html>`);
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    name: "Skynet",
    version: "2.1.2",
    tmdbConfigured: Boolean(TMDB_KEY)
  });
});

app.listen(PORT, () => console.log("Skynet listening on " + PORT));
app.get("/aio-install", (_req, res) => {
  const manifestUrl = "https://aiostreams.elfhosted.com/stremio/fe2a7402-8285-4348-8a28-0d9a9b4dd1e5/eyJpIjoiSHRTQ21YeDdzSlN1aXF4YU9ZcThrdz09IiwiZSI6IjNBbk4rR0x3c3hkcllwQ2ZDa2xSSnp1elZCRU93cEJjMThYN0ZWTER4Mk09IiwidCI6ImEifQ/manifest.json";
  const stremioUrl = "stremio://" + manifestUrl.replace(/^https?:\/\//, "");
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Install AIOStreams</title>
<style>body{margin:0;background:#0b0b0f;color:#fff;font-family:Arial,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center}.card{width:min(520px,90%);text-align:center;background:#17171d;border-radius:22px;padding:30px;box-sizing:border-box;box-shadow:0 10px 40px #0008}h1{font-size:30px}.btn{display:block;text-decoration:none;background:#fff;color:#000;font-weight:700;font-size:19px;padding:16px;border-radius:12px;margin:20px 0}.alt{display:block;color:#fff;border:1px solid #555;padding:13px;border-radius:10px;text-decoration:none}p{color:#bbb;line-height:1.5}small{display:block;color:#888;margin-top:18px;word-break:break-all}</style></head>
<body><div class="card"><h1>AIOStreams</h1><p>Tap below to open Stremio and install your AIOStreams addon.</p><a class="btn" href="${stremioUrl}">INSTALL AIOSTREAMS</a><a class="alt" href="${manifestUrl}">Open AIOStreams manifest</a><small>If the install button does not open Stremio, use the manifest link above.</small></div></body></html>`;
  res.set("Content-Type","text/html; charset=utf-8"); res.send(html);
});

