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
  );}
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

.detailOverlay{display:none;position:fixed;inset:0;z-index:100;background:#07090df5;overflow:auto}
.detailOverlay.show{display:block}.detailBox{min-height:100vh;background:#0a0d12}.detailBg{min-height:560px;background-size:cover;background-position:center;position:relative}
.detailBg:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#07090df5 0%,#07090db8 50%,#07090d55),linear-gradient(0deg,#0a0d12,transparent 55%)}
.detailCopy{position:relative;z-index:2;max-width:760px;padding:100px 6vw 60px}.detailCopy h1{font-size:clamp(42px,6vw,76px);margin:10px 0}
.closeBtn{position:fixed;right:22px;top:18px;z-index:110;border:0;background:#252c36;color:#fff;width:46px;height:46px;border-radius:50%;font-size:25px}
.modal{max-width:620px;margin:12vh auto;background:#11151c;border:1px solid #303844;border-radius:18px;padding:25px;width:calc(100% - 30px)}
.field{width:100%;background:#090c11;border:1px solid #3b4350;color:#fff;border-radius:8px;padding:12px;margin:8px 0 14px}
.help{color:#9ba3ad;font-size:14px;line-height:1.5}.stream{display:block;background:#191f28;color:#fff;text-decoration:none;padding:14px;border-radius:10px;margin:9px 0;border:1px solid #303844}
.stream small{display:block;color:#aab2bd;margin-top:4px}
@media(max-width:900px){.detailCopy{padding:90px 22px 45px}.detailBg{min-height:520px}}
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

app.get("/app/api/streams", async (req, res) => {
  try {
    const manifest = process.env.AIOSTREAMS_MANIFEST;
    if (!manifest) return res.json({ streams: [] });
    const type = req.query.type === "series" ? "series" : "movie";
    const requestedId = String(req.query.id || "");
    if (!requestedId) return res.json({ streams: [] });

    const root = manifest.replace(/\/manifest\.json.*$/, "").replace(/\/+$/, "");
    const rawId = requestedId.replace(/^tmdb:/, "");
    const candidates = [];
    function addId(v) {
      if (v && !candidates.includes(v)) candidates.push(v);
    }
    addId(requestedId);
    addId(rawId);

    try {
      const externalPath = type === "series"
        ? "/tv/" + encodeURIComponent(rawId) + "/external_ids?language=en-US"
        : "/movie/" + encodeURIComponent(rawId) + "/external_ids?language=en-US";
      const external = await tmdb(externalPath);
      if (external && external.imdb_id) {
        if (type === "series") {
          const parts = requestedId.split(":");
          if (parts.length >= 4) addId(external.imdb_id + ":" + parts[parts.length - 2] + ":" + parts[parts.length - 1]);
          else addId(external.imdb_id);
        } else addId(external.imdb_id);
      }
    } catch (_) {}

    let streams = [];
    for (const candidate of candidates) {
      try {
        const url = root + "/stream/" + type + "/" + encodeURIComponent(candidate) + ".json";
        const r = await fetch(url, { headers: { "Accept": "application/json" } });
        if (!r.ok) continue;
        const data = await r.json();
        if (Array.isArray(data.streams) && data.streams.length) {
          streams = data.streams;
          break;
        }
      } catch (_) {}
    }

    // Turn AIOStreams' direct URLs into Skynet playback URLs. This is important
    // for streams that require the request headers supplied in behaviorHints.
    const playback = streams.filter(s => s && (s.url || s.externalUrl)).map(s => {
      if (!s.url) return s;
      const requestHeaders = s.behaviorHints && s.behaviorHints.proxyHeaders
        ? (s.behaviorHints.proxyHeaders.request || {})
        : {};
      const responseHeaders = s.behaviorHints && s.behaviorHints.proxyHeaders
        ? (s.behaviorHints.proxyHeaders.response || {})
        : {};
      const q = new URLSearchParams({
        url: s.url,
        h: Buffer.from(JSON.stringify(requestHeaders), "utf8").toString("base64url"),
        r: Buffer.from(JSON.stringify(responseHeaders), "utf8").toString("base64url")
      });
      return { ...s, url: req.protocol + "://" + req.get("host") + "/app/api/proxy?" + q.toString() };
    });

    res.set("Cache-Control", "no-store");
    res.json({ streams: playback });
  } catch (e) {
    console.error("APP STREAMS ERROR " + e.message);
    res.json({ streams: [] });
  }
});

app.get("/app/api/proxy", async (req, res) => {
  try {
    const target = String(req.query.url || "");
    if (!/^https:\/\//i.test(target)) return res.status(400).send("Invalid playback URL");

    const u = new URL(target);
    const host = (u.hostname || "").toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host.startsWith("10.") || host.startsWith("192.168.") || host.startsWith("172.16.") || host.startsWith("172.17.") || host.startsWith("172.18.") || host.startsWith("172.19.") || host.startsWith("172.2")) {
      return res.status(403).send("Blocked playback host");
    }

    let requestHeaders = {};
    let responseHeaders = {};
    try {
      if (req.query.h) requestHeaders = JSON.parse(Buffer.from(String(req.query.h), "base64url").toString("utf8"));
      if (req.query.r) responseHeaders = JSON.parse(Buffer.from(String(req.query.r), "base64url").toString("utf8"));
    } catch (_) {}

    const upstreamHeaders = new Headers();
    for (const [k, v] of Object.entries(requestHeaders || {})) {
      if (!k || /^host$/i.test(k) || typeof v !== "string") continue;
      upstreamHeaders.set(k, v);
    }
    const range = req.headers.range;
    if (range) upstreamHeaders.set("Range", range);

    const upstream = await fetch(target, { method: req.method === "HEAD" ? "HEAD" : "GET", headers: upstreamHeaders, redirect: "follow" });
    res.status(upstream.status);

    const copyHeaders = ["content-type","content-length","content-range","accept-ranges","last-modified","etag"];
    for (const name of copyHeaders) {
      const value = upstream.headers.get(name);
      if (value) res.setHeader(name, value);
    }
    for (const [k, v] of Object.entries(responseHeaders || {})) {
      if (typeof v === "string" && !/^set-cookie$/i.test(k)) res.setHeader(k, v);
    }
    res.setHeader("Cache-Control", "no-store");
    if (req.method === "HEAD" || !upstream.body) return res.end();

    for await (const chunk of upstream.body) res.write(Buffer.from(chunk));
    res.end();
  } catch (e) {
    console.error("APP PROXY ERROR " + e.message);
    if (!res.headersSent) res.status(502).send("Playback source unavailable");
    else res.end();
  }
});

app.get("/app/api/episodes", async (req, res) => {
  try {
    const tv = String(req.query.id || "").replace(/^tmdb:/, "");
    const season = Math.max(1, parseInt(req.query.season || "1", 10));
    if (!tv) return res.json({ episodes: [] });
    const data = await tmdb("/tv/" + encodeURIComponent(tv) + "/season/" + season + "?language=en-US");
    const episodes = (data.episodes || []).map(ep => ({
      id: "tmdb:" + tv + ":" + season + ":" + ep.episode_number,
      type: "series",
      name: ep.name || ("Episode " + ep.episode_number),
      episode: ep.episode_number,
      season: season,
      releaseInfo: ep.air_date || "",
      description: ep.overview || "",
      poster: ep.still_path ? "https://image.tmdb.org/t/p/w500" + ep.still_path : "",
      background: ep.still_path ? "https://image.tmdb.org/t/p/w1280" + ep.still_path : ""
    }));
    res.json({ episodes });
  } catch (e) {
    console.error("APP EPISODES ERROR " + e.message);
    res.json({ episodes: [] });
  }
});

app.get("/app/api/details", async (req, res) => {
  try {
    const type = req.query.type === "series" ? "series" : "movie";
    const id = decodeURIComponent(String(req.query.id || "")).replace(/^tmdb:/, "");
    if (!id) return res.status(400).json({ error: "Missing id" });
    const data = await tmdb((type === "movie" ? "/movie/" : "/tv/") + encodeURIComponent(id) + "?language=en-US");
    const seasons = type === "series" ? (data.seasons || []).filter(s => s.season_number > 0).map(s => ({season:s.season_number,name:s.name,episodes:s.episode_count})) : [];
    res.json({meta:meta(data,type),seasons});
  } catch(e) { console.error("APP DETAILS ERROR "+e.message); res.status(200).json({meta:null,seasons:[],error:e.message}); }
});

app.get("/app/api/vod-catalog/:type/:id.json", async (req, res) => {
  try {
    const id = String(req.params.id || "");
    const type = req.params.type === "series" ? "series" : "movie";
    const routes = {
      "skynet-trending-movies": "/trending/movie/week?language=en-US&page=1",
      "skynet-popular-movies": "/movie/popular?language=en-US&region=GB&page=1",
      "skynet-top-rated-movies": "/movie/top_rated?language=en-US&region=GB&page=1",
      "skynet-trending-series": "/trending/tv/week?language=en-US&page=1",
      "skynet-popular-series": "/tv/popular?language=en-US&page=1",
      "skynet-new-releases-movies": "/movie/now_playing?language=en-US&region=GB&page=1"
    };
    if (!routes[id]) return res.status(404).json({ metas: [] });
    const data = await tmdb(routes[id]);
    const metas = (data.results || []).slice(0, 50).map(x => catalogMeta(x, type));
    res.set("Cache-Control", "no-store");
    res.json({ metas });
  } catch (e) {
    console.error("VOD CATALOG ERROR " + e.message);
    res.status(200).json({ metas: [] });
  }
});

app.get(["/app", "/app-v2"], (_req, res) => {
  res.set({
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0"
  });
  res.send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#07090d">
<title>SKYNET</title>
<style>
:root{--bg:#07080b;--panel:#11141a;--panel2:#181c23;--muted:#9ca3ad;--accent:#ff3b4a;--white:#fff}
*{box-sizing:border-box}
html,body{margin:0;background:var(--bg);color:var(--white);font-family:Arial,Helvetica,sans-serif}
body{min-height:100vh;overflow-x:hidden}
button,input{font:inherit}
.top{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:30px;padding:16px 4vw;background:linear-gradient(180deg,rgba(7,8,11,.98),rgba(7,8,11,.9));backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.06)}
.logo{font-size:32px;font-weight:950;letter-spacing:-1.8px;color:#ff4050;margin-right:8px;text-shadow:0 6px 24px rgba(255,59,74,.22)}
.nav{display:flex;gap:26px;align-items:center;flex:1}
.tab{position:relative;border:0;background:transparent;color:#aeb4bd;padding:10px 0;font-weight:700;cursor:pointer;white-space:nowrap;transition:color .2s}
.tab:hover,.tab.active{color:#fff}
.tab.active:after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;border-radius:3px;background:var(--accent)}
.actions{display:flex;gap:10px;align-items:center}
.icon{border:1px solid rgba(255,255,255,.08);background:#151920;color:#fff;width:42px;height:42px;border-radius:50%;cursor:pointer;font-size:20px;transition:transform .2s,background .2s}
.icon:hover{transform:scale(1.06);background:#20252e}
.clock{font-weight:700;color:#c9cdd3;min-width:48px;text-align:right;font-size:13px}
.hero{position:relative;min-height:550px;display:flex;align-items:flex-end;overflow:hidden}
.hero-bg{position:absolute;inset:0;background-size:cover;background-position:center}
.hero-bg:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(7,8,11,.98) 0%,rgba(7,8,11,.82) 34%,rgba(7,8,11,.24) 72%,rgba(7,8,11,.9) 100%),linear-gradient(0deg,#07080b 0%,rgba(7,8,11,.75) 15%,transparent 55%)}
.hero-copy{position:relative;z-index:2;width:min(680px,90%);padding:90px 5vw 62px}
.kicker{color:var(--accent);font-weight:900;letter-spacing:2.5px;text-transform:uppercase;font-size:13px}
.hero h1{font-size:clamp(44px,6vw,82px);line-height:.95;margin:12px 0 18px;letter-spacing:-1.8px}
.meta{color:#e1e4e8;font-weight:700;margin-bottom:14px}
.desc{color:#c8cdd4;line-height:1.6;font-size:17px;max-width:620px}
.btns{display:flex;gap:12px;margin-top:26px}
.btn{border:0;border-radius:7px;padding:14px 25px;font-weight:900;cursor:pointer;transition:transform .2s,filter .2s}
.btn:hover{transform:translateY(-1px);filter:brightness(1.08)}
.play{background:#fff;color:#050609}.list{background:#2a3039;color:#fff}
main{padding:0 4vw 70px}
.section{margin:30px 0}
.section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.section h2{font-size:24px;margin:0;letter-spacing:-.3px}
.see{color:#8f97a2;font-weight:700;font-size:13px}
.row{display:flex;gap:12px;overflow-x:auto;padding:3px 3px 14px;scrollbar-width:none}
.row::-webkit-scrollbar{display:none}
.card{position:relative;flex:0 0 155px;cursor:pointer;outline:none;transition:transform .22s ease}
.card:hover{transform:scale(1.045);z-index:3}
.poster{width:155px;height:232px;object-fit:cover;border-radius:6px;background:#1a1e25;display:block;box-shadow:0 8px 22px rgba(0,0,0,.28)}
.card:focus-visible{outline:3px solid var(--accent);outline-offset:5px;border-radius:9px}.card-name{font-weight:700;font-size:14px;margin-top:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card-year{color:#818995;font-size:12px;margin-top:3px}
.page-title{font-size:34px;margin:32px 0 4px}
.page-sub{color:#969eaa;margin:0 0 24px}
.searchbar{display:none;position:absolute;right:4vw;top:74px;background:#10141a;padding:10px;border:1px solid #2a3039;border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,.45)}
.searchbar.open{display:flex}
.searchbar input{width:min(70vw,380px);background:#080a0e;color:#fff;border:1px solid #343b46;border-radius:7px;padding:12px 13px;outline:0}
.empty{padding:80px 20px;text-align:center;color:#8f97a1}
@media(min-width:1000px){.top{padding:18px 4vw}.logo{font-size:38px}.tab{font-size:16px}.hero{min-height:620px}.hero-copy{padding:110px 5vw 72px}.hero h1{font-size:clamp(56px,5vw,88px)}.card{flex-basis:182px}.poster{width:182px;height:273px}.section h2{font-size:27px}.card-name{font-size:15px}}
@media(max-width:900px){
 .top{padding:10px 14px;gap:12px;overflow:visible}.logo{font-size:26px;margin-right:auto}.nav{order:3;flex-basis:100%;overflow-x:auto;gap:24px;padding:2px 2px 5px}.top{flex-wrap:wrap}.tab{padding:8px 0;font-size:14px}.actions{margin-left:auto}.clock{display:none}.hero{min-height:470px}.hero-copy{padding:78px 22px 38px}.hero h1{font-size:47px}.desc{font-size:15px}main{padding:0 14px 44px}.poster{width:126px;height:189px}.card{flex-basis:126px}.row{gap:10px}.section{margin:24px 0}.section h2{font-size:20px}
}

.detailOverlay{display:none;position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.86);overflow:auto}
.detailOverlay.show{display:block}
.detailBox{min-height:100vh;background:#0a0d12}
.detailBg{min-height:560px;background-size:cover;background-position:center;position:relative}
.detailBg:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#07090df5 0%,#07090db8 50%,#07090d55),linear-gradient(0deg,#0a0d12,transparent 55%)}
.detailCopy{position:relative;z-index:2;max-width:760px;padding:100px 6vw 60px}
.detailCopy h1{font-size:clamp(42px,6vw,76px);margin:10px 0}
.closeBtn{position:fixed;right:22px;top:18px;z-index:110;border:0;background:#252c36;color:#fff;width:46px;height:46px;border-radius:50%;font-size:25px}
.modal{max-width:620px;margin:12vh auto;background:#11151c;border:1px solid #303844;border-radius:18px;padding:25px;width:calc(100% - 30px)}
.field{width:100%;background:#090c11;border:1px solid #3b4350;color:#fff;border-radius:8px;padding:12px;margin:8px 0 14px}
.help{color:#9ba3ad;font-size:14px;line-height:1.5}
.stream{display:block;background:#191f28;color:#fff;text-decoration:none;padding:14px;border-radius:10px;margin:9px 0;border:1px solid #303844}
.stream small{display:block;color:#aab2bd;margin-top:4px}
@media(max-width:900px){.detailCopy{padding:90px 22px 45px}.detailBg{min-height:520px}.modal{margin:8vh auto}}
</style>
</head>
<body>
<header class="top">
  <div class="logo">SKYNET</div>
  <nav class="nav" aria-label="Main navigation">
    <button class="tab active" data-page="home">Home</button>
    <button class="tab" data-page="series">Series</button>
    <button class="tab" data-page="films">Films</button>
    <button class="tab" data-page="new">New &amp; Trending</button>
    <button class="tab" data-page="list">My List</button>
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
    <div class="kicker">Featured on Skynet</div>
    <h1 id="heroTitle">Loading…</h1>
    <div class="meta" id="heroMeta"></div>
    <div class="desc" id="heroDesc"></div>
    <div class="btns">
      <button class="btn play" id="heroPlay">▶ Play</button>
      <button class="btn list" id="heroList">＋ My List</button>
    </div>
  </div>
</section>

<main id="content"></main><div class="detailOverlay" id="detailOverlay"></div>
<div class="detailOverlay" id="settingsOverlay"><div class="modal"><button class="closeBtn" id="closeSettings">×</button><h2>⚙ AIOStreams Settings</h2><p class="help">Paste your personal AIOStreams manifest URL. It is saved only in this browser.</p><input class="field" id="aioUrl" placeholder="https://aiostreams.elfhosted.com/stremio/.../manifest.json"><button class="btn play" id="saveAio">Save</button><button class="btn list" id="clearAio">Clear</button><p class="help" id="aioStatus"></p></div></div>
<div class="detailOverlay" id="streamsOverlay"><div class="modal"><button class="closeBtn" id="closeStreams">×</button><h2 id="streamsTitle">Available Streams</h2><div id="streamsList"></div></div></div>

<script>
(function(){
  var root=location.origin;
  function esc(s){return String(s||"").replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]||c;});}
  function card(x){
    return '<article class="card" tabindex="0" data-id="'+esc(x.id||"")+'" data-type="'+esc(x.type||"movie")+'"><img class="poster" loading="lazy" src="'+esc(x.poster||"")+'"><div class="card-name">'+esc(x.name||"Untitled")+'</div><div class="card-year">'+esc(x.releaseInfo||"")+'</div></article>';
  }
  function row(title,items){
    if(!items.length)return "";
    return '<section class="section"><div class="section-head"><h2>'+esc(title)+'</h2></div><div class="row">'+items.slice(0,20).map(card).join("")+'</div></section>';
  }
  function boot(){
    fetch(root+"/app/api/vod-catalog/movie/skynet-trending-movies.json",{cache:"no-store"})
      .then(function(r){return r.json();})
      .then(function(t){
        var trending=t.metas||[];
        if(trending[0]){
          var x=trending[0];
          document.getElementById("heroBg").style.backgroundImage="url('"+(x.background||x.poster||"")+"')";
          document.getElementById("heroTitle").textContent=x.name||"Featured";
          document.getElementById("heroMeta").textContent=x.releaseInfo||"";
          document.getElementById("heroDesc").textContent=x.description||"";
        }
        return Promise.all([
          fetch(root+"/app/api/vod-catalog/movie/skynet-popular-movies.json",{cache:"no-store"}).then(function(r){return r.json();}),
          fetch(root+"/app/api/vod-catalog/movie/skynet-top-rated-movies.json",{cache:"no-store"}).then(function(r){return r.json();}),
          fetch(root+"/app/api/vod-catalog/series/skynet-trending-series.json",{cache:"no-store"}).then(function(r){return r.json();})
        ]).then(function(a){
          var p=(a[0].metas||[]), top=(a[1].metas||[]), s=(a[2].metas||[]);
          var content=document.getElementById("content");
          content.innerHTML=row("Trending now",trending)+row("Popular films",p)+row("Top rated",top)+row("Popular series",s);
          content.querySelectorAll(".card").forEach(function(el){
            el.onclick=function(){
              var id=el.getAttribute("data-id"), type=el.getAttribute("data-type")||"movie";
              document.getElementById("detailOverlay").classList.add("show");
              document.getElementById("detailOverlay").innerHTML='<div class="modal"><p class="help">Loading details…</p></div>';
              fetch(root+"/app/api/details?type="+encodeURIComponent(type)+"&id="+encodeURIComponent(id),{cache:"no-store"}).then(function(r){return r.json();}).then(function(d){
                var x=d.meta;if(!x)return;
                document.getElementById("detailOverlay").innerHTML='<div class="detailBox"><button class="closeBtn" id="bootClose">×</button><div class="detailBg" style="background-image:url(\''+(x.background||x.poster||"")+'\')"><div class="detailCopy"><div class="kicker">'+(type==="series"?"SERIES":"MOVIE")+'</div><h1>'+esc(x.name)+'</h1><div class="meta">'+esc(x.releaseInfo||"")+'</div><p class="desc">'+esc(x.description||"")+'</p><div class="btns"><button class="btn play" id="bootPlay">▶ Play</button><button class="btn list" id="bootList">＋ My List</button></div></div></div></div>';
                document.getElementById("bootClose").onclick=function(){document.getElementById("detailOverlay").classList.remove("show");};
              });
            };
          });
        });
      })
      .catch(function(e){
        document.getElementById("heroTitle").textContent="Skynet";
        document.getElementById("heroDesc").textContent="Catalogue is temporarily unavailable. Please refresh.";
        console.error("VOD BOOT",e);
      });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();
</script><script>
(async function(){
  try {
    const get=async u=>{const r=await fetch(u,{cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);return (await r.json()).metas||[]};
    const [trending,popular,series]=await Promise.all([
      get(location.origin+"/app/api/vod-catalog/movie/skynet-trending-movies.json"),
      get(location.origin+"/app/api/vod-catalog/movie/skynet-popular-movies.json"),
      get(location.origin+"/app/api/vod-catalog/series/skynet-popular-series.json")
    ]);
    if(trending.length){
      const x=trending[0];
      const bg=x.background||x.poster||"";
      document.getElementById("heroBg").style.backgroundImage="url('"+bg+"')";
      document.getElementById("heroTitle").textContent=x.name||"Featured";
      document.getElementById("heroMeta").textContent=x.releaseInfo||"";
      document.getElementById("heroDesc").textContent=x.description||"";
    }
    const esc2=s=>String(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
    const make=(title,items,type)=>items.length?'<section class="section"><div class="section-head"><h2>'+esc2(title)+'</h2></div><div class="row">'+items.slice(0,20).map(x=>'<article class="card" tabindex="0" data-id="'+esc2(x.id||"")+'" data-type="'+esc2(type||x.type||"movie")+'"><img class="poster" loading="lazy" src="'+esc2(x.poster||"")+'"><div class="card-name">'+esc2(x.name||"Untitled")+'</div><div class="card-year">'+esc2(x.releaseInfo||"")+'</div></article>').join("")+'</div></section>':"";
    const content=document.getElementById("content");
    if(content) {
      content.innerHTML=make("Trending now",trending,"movie")+make("Popular films",popular,"movie")+make("Popular series",series,"series");
      content.querySelectorAll(".card").forEach(card=>card.addEventListener("click",()=>{
        const id=card.dataset.id,type=card.dataset.type||"movie";
        fetch(location.origin+"/app/api/details?type="+encodeURIComponent(type)+"&id="+encodeURIComponent(id),{cache:"no-store"})
          .then(r=>r.json()).then(d=>{
            const x=d.meta;if(!x)return;
            const o=document.getElementById("detailOverlay");
            o.classList.add("show");
            o.innerHTML='<div class="detailBox"><button class="closeBtn" id="fallbackClose">×</button><div class="detailBg" style="background-image:url(\''+esc2(x.background||x.poster||"")+'\')"><div class="detailCopy"><div class="kicker">'+(type==="series"?"SERIES":"MOVIE")+'</div><h1>'+esc2(x.name)+'</h1><div class="meta">'+esc2(x.releaseInfo||"")+'</div><p class="desc">'+esc2(x.description||"")+'</p><div class="btns"><button class="btn play" id="fallbackPlay">▶ Play</button><button class="btn list" id="fallbackList">＋ My List</button></div></div></div></div>';
            document.getElementById("fallbackClose").onclick=()=>o.classList.remove("show");
            document.getElementById("fallbackPlay").onclick=()=>window.playTitle&&window.playTitle(type,x.id,x.name);
            document.getElementById("fallbackList").onclick=()=>window.toggleList&&window.toggleList(x);
          }).catch(e=>console.error("DETAIL FALLBACK FAILED",e));
      }));
    }
  } catch(e) {
    console.error("SKYNET FALLBACK LOAD FAILED",e);
  }
})();
</script>
<script>
const base = location.origin;
const state = {page:"home", hero:null, featuredPool:[], featuredTimer:null};
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function titleOf(x){return x?.name||"Untitled";}
function posterOf(x){return x?.poster||"";}
async function getCatalog(type,id){try{const r=await fetch(base+"/app/api/vod-catalog/"+type+"/"+id+".json",{cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status);const d=await r.json();return Array.isArray(d.metas)?d.metas:[];}catch(e){console.error("CATALOG LOAD FAILED",type,id,e);return[];}}
function row(title,items){if(!items.length)return"";return '<section class="section"><div class="section-head"><h2>'+esc(title)+'</h2><span class="see">See all ›</span></div><div class="row">'+items.map((x,i)=>'<article class="card" tabindex="0" data-id="'+esc(x.id||'')+'" data-type="'+esc(x.type||'movie')+'" aria-label="'+esc(titleOf(x))+'"><img class="poster" loading="lazy" src="'+esc(posterOf(x))+'" alt="'+esc(titleOf(x))+'"><div class="card-name">'+esc(titleOf(x))+'</div><div class="card-year">'+esc(x.releaseInfo||"")+'</div></article>').join("")+'</div></section>';}
function setHero(x){if(!x)return;state.hero=x;document.getElementById("heroBg").style.backgroundImage="url('"+(x.background||x.poster||"")+"')";document.getElementById("heroTitle").textContent=titleOf(x);document.getElementById("heroMeta").textContent=[x.releaseInfo,x.imdbRating?("★ "+x.imdbRating):"",x.genres?.slice(0,3).join(" • ")].filter(Boolean).join("  •  ");document.getElementById("heroDesc").textContent=x.description||"";}
function startFeaturedRotation(items){
  state.featuredPool=(items||[]).filter(x=>x&&x.id);
  if(state.featuredTimer) clearInterval(state.featuredTimer);
  if(!state.featuredPool.length) return;
  let lastId=null;
  const choose=()=>{
    let pool=state.featuredPool.filter(x=>x.id!==lastId);
    if(!pool.length) pool=state.featuredPool;
    const x=pool[Math.floor(Math.random()*pool.length)];
    lastId=x.id;
    setHero(x);
  };
  choose();
  if(state.featuredPool.length>1) state.featuredTimer=setInterval(choose,7000);
}
async function loadHome(){
  const trending=await getCatalog("movie","skynet-trending-movies");
  startFeaturedRotation(trending);
  document.getElementById("content").innerHTML=row("Trending now",trending.slice(0,20))+'<div class="section"><div class="section-head"><h2>Loading more…</h2></div></div>';
  bindTVCards();
  const [popular,top,series,newMovies]=await Promise.all([
    getCatalog("movie","skynet-popular-movies"),
    getCatalog("movie","skynet-top-rated-movies"),
    getCatalog("series","skynet-trending-series"),
    getCatalog("movie","skynet-new-releases-movies")
  ]);
  document.getElementById("content").innerHTML=row("Trending now",trending.slice(0,20))+row("Popular films",popular.slice(0,20))+row("Top rated",top.slice(0,20))+row("Popular series",series.slice(0,20))+row("Fresh this week",newMovies.slice(0,20));
  bindTVCards();
}
setTimeout(()=>loadHome(),250);
async function loadPage(page){state.page=page;document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.page===page));if(page==="home")return loadHome();const content=document.getElementById("content");if(page==="list"){const items=JSON.parse(localStorage.getItem("skynetMyList")||"[]");content.innerHTML=items.length?row("⭐ My List",items):'<div class="empty"><h2>My List is empty</h2><p>Open a title and add it to your list.</p></div>';bindTVCards();return}content.innerHTML='<div class="empty">Loading '+esc(page)+'…</div>';let rows=[];if(page==="films"){const[a,b,c,n]=await Promise.all([getCatalog("movie","skynet-trending-movies"),getCatalog("movie","skynet-popular-movies"),getCatalog("movie","skynet-top-rated-movies"),getCatalog("movie","skynet-new-releases-movies")]);const first=a[0]||b[0]||c[0]||n[0];setHero(first);rows=[row("Trending",a.slice(0,30)),row("Popular",b.slice(0,30)),row("Top Rated",c.slice(0,30)),row("New Releases",n.slice(0,30))].filter(Boolean);if(!rows.length)content.innerHTML='<div class="empty">Films are temporarily unavailable. Tap Films again to retry.</div>';}else if(page==="series"){const[a,b,c]=await Promise.all([getCatalog("series","skynet-trending-series"),getCatalog("series","skynet-popular-series"),getCatalog("series","skynet-top-rated-series")]);setHero(a[0]||b[0]||c[0]);rows=[row("Trending",a.slice(0,30)),row("Popular",b.slice(0,30)),row("Top Rated",c.slice(0,30))].filter(Boolean);if(!rows.length)content.innerHTML='<div class="empty">Series are temporarily unavailable. Tap Series again to retry.</div>';}else{const n=await getCatalog("movie","skynet-new-releases-movies");setHero(n[0]);rows=[row("New Releases",n.slice(0,50))].filter(Boolean);}if(rows.length){content.innerHTML=rows.join("");bindTVCards();}}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{document.querySelector(".nav")?.scrollTo({left:0,behavior:"smooth"});loadPage(b.dataset.page);}));
function bindTVCards(){document.querySelectorAll('.card').forEach(card=>{card.addEventListener('click',()=>{const id=card.dataset.id;if(id){const type=card.dataset.type||'movie';openDetail(type,id);}});card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();card.click();}});});}
function tvKeyNav(e){const k=e.key||'';if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(k))return;const a=document.activeElement;if(!a)return;const tabs=[...document.querySelectorAll('.tab')],cards=[...document.querySelectorAll('.card')];if(a.classList.contains('tab')){const i=tabs.indexOf(a);if(k==='ArrowRight'||k==='ArrowDown'){e.preventDefault();tabs[Math.min(i+1,tabs.length-1)]?.focus();}else if(k==='ArrowLeft'||k==='ArrowUp'){e.preventDefault();tabs[Math.max(i-1,0)]?.focus();}return;}if(a.classList.contains('card')){const row=a.closest('.row');if(!row)return;const items=[...row.querySelectorAll('.card')];const i=items.indexOf(a);if(k==='ArrowRight'){e.preventDefault();items[Math.min(i+1,items.length-1)]?.focus();}else if(k==='ArrowLeft'){e.preventDefault();items[Math.max(i-1,0)]?.focus();}else if(k==='ArrowDown'||k==='ArrowUp'){e.preventDefault();const rows=[...document.querySelectorAll('.row')];const ri=rows.indexOf(row);const target=k==='ArrowDown'?rows[ri+1]:rows[ri-1];if(target){const next=[...target.querySelectorAll('.card')];next[Math.min(i,next.length-1)]?.focus();}}}}
document.querySelectorAll(".detailOverlay").forEach(x=>x.classList.remove("show"));
document.addEventListener('keydown',tvKeyNav);
document.getElementById("searchBtn").addEventListener("click",()=>{const box=document.getElementById("searchbar");box.classList.toggle("open");if(box.classList.contains("open"))document.getElementById("searchInput").focus();});
document.getElementById("searchInput").addEventListener("keydown",async e=>{if(e.key!=="Enter")return;const q=e.target.value.trim();if(!q)return;const r=await fetch(base+"/app/api/search?q="+encodeURIComponent(q));const d=await r.json();document.getElementById("content").innerHTML='<h1 class="page-title">Search</h1><p class="page-sub">Results for “'+esc(q)+'”</p><div class="row">'+(d.results||[]).map(x=>'<article class="card" tabindex="0" data-id="'+esc(x.id||"")+'" data-type="'+esc(x.type||"movie")+'"><img class="poster" src="'+esc(posterOf(x))+'"><div class="card-name">'+esc(titleOf(x))+'</div><div class="card-year">'+esc(x.releaseInfo||"")+'</div></article>').join("")+'</div>';bindTVCards();});

function getAio(){return localStorage.getItem("skynetAioManifest")||""}
function saveAio(){let u=document.getElementById("aioUrl").value.trim();if(u&&!/\/manifest\.json(?:$|\?)/.test(u))u=u.replace(/\/$/,"")+"/manifest.json";if(u){localStorage.setItem("skynetAioManifest",u);document.getElementById("aioStatus").textContent="AIOStreams saved on this device."}}
function toggleList(x){let list=JSON.parse(localStorage.getItem("skynetMyList")||"[]");const i=list.findIndex(a=>a.id===x.id);if(i>=0)list.splice(i,1);else list.unshift(x);localStorage.setItem("skynetMyList",JSON.stringify(list))}
async function playTitle(type,id,name){const aio=getAio();if(!aio){document.getElementById("settingsOverlay").classList.add("show");document.getElementById("aioStatus").textContent="Add your personal AIOStreams manifest first.";return}const root=aio.replace(/\/manifest\.json.*$/,"");const url=root+"/stream/"+type+"/"+encodeURIComponent(id)+".json";document.getElementById("streamsOverlay").classList.add("show");document.getElementById("streamsTitle").textContent="Streams — "+name;document.getElementById("streamsList").innerHTML='<p class="help">Loading AIOStreams…</p>';try{const r=await fetch(url);if(!r.ok)throw new Error("HTTP "+r.status);const d=await r.json();const streams=d.streams||[];document.getElementById("streamsList").innerHTML=streams.length?streams.slice(0,30).map((s,i)=>'<a class="stream" href="'+esc(s.url||"#")+'" target="_blank" rel="noopener"><b>▶ '+esc(s.name||("Stream "+(i+1)))+'</b><small>'+esc(s.title||s.description||"Open stream")+'</small></a>').join(""):'<p class="help">No streams found.</p>'}catch(e){document.getElementById("streamsList").innerHTML='<p class="help">AIOStreams could not be reached. Check Settings and try again.</p>'}}
async function openDetail(type,id){document.getElementById("detailOverlay").classList.add("show");document.getElementById("detailOverlay").innerHTML='<div class="modal"><p class="help">Loading details…</p></div>';try{const d=await fetch(base+"/app/api/details?type="+encodeURIComponent(type)+"&id="+encodeURIComponent(id)).then(r=>r.json());const x=d.meta;if(!x)throw new Error("No details");document.getElementById("detailOverlay").innerHTML='<div class="detailBox"><button class="closeBtn" onclick="closeDetail()">×</button><div class="detailBg" style="background-image:url(\''+esc(x.background||x.poster||"")+'\')"><div class="detailCopy"><div class="kicker">'+(type==="series"?"SERIES":"MOVIE")+'</div><h1>'+esc(x.name)+'</h1><div class="meta">'+esc([x.releaseInfo,x.imdbRating?"★ "+x.imdbRating:"",x.genres?.slice(0,3).join(" • ")].filter(Boolean).join("  •  "))+'</div><p class="desc">'+esc(x.description||"")+'</p><div class="btns"><button class="btn play" id="detailPlay">▶ Play</button><button class="btn list" id="detailList">＋ My List</button></div></div></div></div>';document.getElementById("detailPlay").onclick=()=>playTitle(type,x.id,x.name);document.getElementById("detailList").onclick=()=>toggleList(x)}catch(e){document.getElementById("detailOverlay").innerHTML='<div class="modal"><button class="closeBtn" onclick="closeDetail()">×</button><h2>Could not load details</h2><p class="help">Please try again.</p></div>'}}
function closeDetail(){document.getElementById("detailOverlay").classList.remove("show")}
document.getElementById("settingsBtn").addEventListener("click",()=>{document.getElementById("aioUrl").value=getAio();document.getElementById("aioStatus").textContent=getAio()?"AIOStreams is configured on this device.":"";document.getElementById("settingsOverlay").classList.add("show")});
document.getElementById("closeSettings").onclick=()=>document.getElementById("settingsOverlay").classList.remove("show");
document.getElementById("saveAio").onclick=()=>{saveAio();setTimeout(()=>document.getElementById("settingsOverlay").classList.remove("show"),400)};
document.getElementById("clearAio").onclick=()=>{localStorage.removeItem("skynetAioManifest");document.getElementById("aioUrl").value="";document.getElementById("aioStatus").textContent="AIOStreams cleared."};
document.getElementById("closeStreams").onclick=()=>document.getElementById("streamsOverlay").classList.remove("show");
document.getElementById("heroPlay").onclick=()=>state.hero&&playTitle(state.hero.type,state.hero.id,state.hero.name||"Featured");
document.getElementById("heroList").onclick=()=>state.hero&&toggleList(state.hero);

function tick(){document.getElementById("clock").textContent=new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});}tick();setInterval(tick,30000);loadHome();setTimeout(()=>document.querySelector('.tab.active')?.focus(),300);
</script>
<script>
(function(){
  function bootSkynet(){
    var root=location.origin;
    var content=document.getElementById("content");
    var heroTitle=document.getElementById("heroTitle");
    var heroMeta=document.getElementById("heroMeta");
    var heroDesc=document.getElementById("heroDesc");
    var heroBg=document.getElementById("heroBg");
    if(!content) return;
    function esc(s){return String(s||"").replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]||c;});}
    function card(x){return '<article class="card" tabindex="0"><img class="poster" loading="lazy" src="'+esc(x.poster||"")+'" alt="'+esc(x.name||"")+'"><div class="card-name">'+esc(x.name||"Untitled")+'</div><div class="card-year">'+esc(x.releaseInfo||"")+'</div></article>';}
    function row(title,items){return items&&items.length?'<section class="section"><div class="section-head"><h2>'+esc(title)+'</h2></div><div class="row">'+items.slice(0,20).map(card).join("")+'</div></section>':"";}
    function get(type,id){return fetch(root+"/app/api/vod-catalog/"+type+"/"+id+".json",{cache:"no-store"}).then(function(r){if(!r.ok)throw Error("HTTP "+r.status);return r.json();}).then(function(d){return d.metas||[];});}
    get("movie","skynet-trending-movies").then(function(trending){
      if(trending[0]){
        var x=trending[0];
        if(heroBg) heroBg.style.backgroundImage="url('"+(x.background||x.poster||"")+"')";
        if(heroTitle) heroTitle.textContent=x.name||"Featured";
        if(heroMeta) heroMeta.textContent=x.releaseInfo||"";
        if(heroDesc) heroDesc.textContent=x.description||"";
      }
      content.innerHTML=row("Trending now",trending)+'<div class="section"><div class="section-head"><h2>Loading more…</h2></div></div>';
      return Promise.all([
        get("movie","skynet-popular-movies"),
        get("movie","skynet-top-rated-movies"),
        get("series","skynet-trending-series"),
        get("movie","skynet-new-releases-movies")
      ]).then(function(a){
        content.innerHTML=row("Trending now",trending)+row("Popular films",a[0])+row("Top rated",a[1])+row("Popular series",a[2])+row("Fresh this week",a[3]);
      });
    }).catch(function(e){
      console.error("SKYNET STARTUP",e);
      if(heroTitle) heroTitle.textContent="Skynet";
      if(heroDesc) heroDesc.textContent="Catalogue is temporarily unavailable. Please refresh.";
    });
  }
  if(document.readyState==="complete") bootSkynet(); else window.addEventListener("load",bootSkynet);
})();
</script>
</body>
</html>`);
});


app.get("/app-v3.js", (_req, res) => {
  res.set({"Content-Type":"application/javascript; charset=utf-8","Cache-Control":"no-store, no-cache, must-revalidate, max-age=0"});
  const js = "\n(function(){\nvar base=location.origin,hero=null;\nfunction esc(s){return String(s||\"\").replace(/[&<>\"']/g,function(c){return {\"&\":\"&amp;\",\"<\":\"&lt;\",\">\":\"&gt;\",'\"':\"&quot;\",\"'\":\"&#39;\"}[c]||c;});}\nfunction key(x){return (x.type||\"movie\")+\"|\"+x.id;}\nfunction get(type,id){return fetch(base+\"/app/api/vod-catalog/\"+type+\"/\"+id+\".json\",{cache:\"no-store\"}).then(function(r){return r.json()}).then(function(d){return d.metas||[];});}\nfunction row(title,items){return items&&items.length?'<section class=\"section\"><h2>'+esc(title)+'</h2><div class=\"row\">'+items.slice(0,30).map(function(x){return '<article class=\"card\" tabindex=\"0\" data-id=\"'+esc(x.id)+'\" data-type=\"'+esc(x.type||\"movie\")+'\"><img class=\"poster\" loading=\"lazy\" src=\"'+esc(x.poster||\"\")+'\"><div class=\"name\">'+esc(x.name)+'</div><div class=\"year\">'+esc(x.releaseInfo||\"\")+'</div></article>';}).join(\"\")+'</div></section>':\"\";}\nfunction setHero(x){hero=x;if(!x)return;document.getElementById(\"heroBg\").style.backgroundImage=\"url('\"+(x.background||x.poster||\"\")+\"')\";document.getElementById(\"heroTitle\").textContent=x.name||\"Featured\";document.getElementById(\"heroMeta\").textContent=x.releaseInfo||\"\";document.getElementById(\"heroDesc\").textContent=x.description||\"\";}\nfunction playerName(){return localStorage.getItem(\"skynetPlayer\")||\"\";}\nfunction showPlayerSetup(){\n var o=document.getElementById(\"overlay\");o.classList.add(\"show\");\n o.innerHTML='<div class=\"modal\"><button class=\"close\" id=\"closeSetup\">×</button><div style=\"padding:28px\"><h2>Player setup</h2><p class=\"help\">Choose the player Skynet should use on this device.</p><div style=\"display:flex;gap:10px;flex-wrap:wrap;margin-top:18px\"><button class=\"btn play\" id=\"chooseVlc\">Use VLC</button><button class=\"btn list\" id=\"chooseNova\">Use Nova</button></div><div style=\"display:flex;gap:10px;flex-wrap:wrap;margin-top:14px\"><a class=\"btn list\" href=\"https://play.google.com/store/apps/details?id=org.videolan.vlc\" target=\"_blank\" rel=\"noopener\">Install VLC</a><a class=\"btn list\" href=\"https://play.google.com/store/apps/details?id=org.courville.nova\" target=\"_blank\" rel=\"noopener\">Install Nova</a></div><p class=\"help\" style=\"margin-top:18px\">If you select a player that is not installed, use its install button above.</p></div></div>';\n document.getElementById(\"closeSetup\").onclick=function(){o.classList.remove(\"show\");};\n document.getElementById(\"chooseVlc\").onclick=function(){localStorage.setItem(\"skynetPlayer\",\"vlc\");o.classList.remove(\"show\");};\n document.getElementById(\"chooseNova\").onclick=function(){localStorage.setItem(\"skynetPlayer\",\"nova\");o.classList.remove(\"show\");};\n}\nfunction openSource(url){\n var p=playerName(),target=String(url||\"\");\n if(!target)return;\n if(!p){showPlayerSetup();return;}\n if(p===\"vlc\"){var vu=new URL(target);window.location.href=\"intent://\"+vu.host+vu.pathname+(vu.search||\"\")+\"#Intent;action=android.intent.action.VIEW;scheme=https;type=video/*;package=org.videolan.vlc;end\";return;}\n if(p===\"nova\"){var nu=new URL(target);window.location.href=\"intent://\"+nu.host+nu.pathname+(nu.search||\"\")+\"#Intent;action=android.intent.action.VIEW;scheme=https;type=video/*;package=org.courville.nova;end\";return;}\n window.location.href=target;\n}\nfunction play(x){\n var o=document.getElementById(\"overlay\");o.classList.add(\"show\");\n o.innerHTML='<div class=\"modal\"><button class=\"close\" id=\"close\">×</button><div style=\"padding:28px\"><h2>Sources — '+esc(x.name)+'</h2><div id=\"streams\" class=\"empty\">Loading sources…</div></div></div>';\n document.getElementById(\"close\").onclick=function(){o.classList.remove(\"show\");};\n fetch(base+\"/app/api/streams?type=\"+encodeURIComponent(x.type||\"movie\")+\"&id=\"+encodeURIComponent(x.id),{cache:\"no-store\"}).then(function(r){return r.json()}).then(function(d){\n   var streams=(d.streams||[]).filter(function(s){return s&&s.url;});\n   var el=document.getElementById(\"streams\");\n   if(!streams.length){el.textContent=\"No playable sources were found.\";return;}\n   el.innerHTML=streams.slice(0,30).map(function(s,i){return '<button class=\"stream sourceBtn\" data-url=\"'+esc(s.url)+'\"><b>▶ '+esc(s.name||(\"Source \"+(i+1)))+'</b><small>'+esc(s.title||s.description||\"\")+'</small><small style=\"color:#ff4050;font-weight:800;margin-top:8px\">▶ Click source to play</small></button>';}).join(\"\");\n   el.querySelectorAll(\".sourceBtn\").forEach(function(b){b.onclick=function(){openSource(b.getAttribute(\"data-url\"));};});\n }).catch(function(){document.getElementById(\"streams\").textContent=\"No playable sources were found.\";});\n}\nfunction toggleList(x){var a=JSON.parse(localStorage.getItem(\"skynetMyList\")||\"[]\"),i=a.findIndex(function(y){return key(y)===key(x)});if(i>=0)a.splice(i,1);else a.unshift(x);localStorage.setItem(\"skynetMyList\",JSON.stringify(a));}\nfunction showDetails(type,id){\n var o=document.getElementById(\"overlay\");o.classList.add(\"show\");\n o.innerHTML='<div class=\"modal\"><button class=\"close\" id=\"close\">×</button><div class=\"empty\">Loading details…</div></div>';\n fetch(base+\"/app/api/details?type=\"+encodeURIComponent(type)+\"&id=\"+encodeURIComponent(id),{cache:\"no-store\"}).then(function(r){return r.json()}).then(function(d){\n   var x=d.meta;if(!x)throw Error(\"No details\");\n   var html='<div class=\"modal\"><button class=\"close\" id=\"close\">×</button><div class=\"detail-bg\" style=\"background-image:url(\\''+(x.background||x.poster||\"\")+'\\')\"><div class=\"detail-copy\"><div class=\"kicker\">'+(type===\"series\"?\"Series\":\"Film\")+'</div><h1>'+esc(x.name)+'</h1><div class=\"meta\">'+esc(x.releaseInfo||\"\")+'</div><p class=\"desc\">'+esc(x.description||\"\")+'</p><button class=\"btn play\" id=\"detailPlay\">▶ Play</button><button class=\"btn list\" id=\"detailList\">＋ My List</button>';\n   if(type===\"series\"&&d.seasons&&d.seasons.length){html+='<div style=\"margin-top:22px\"><h3>Seasons</h3><div id=\"seasonButtons\" style=\"display:flex;gap:8px;flex-wrap:wrap\">'+d.seasons.map(function(s){return '<button class=\"btn list seasonBtn\" data-season=\"'+s.season+'\">Season '+s.season+'</button>';}).join(\"\")+'</div><div id=\"episodes\" class=\"empty\">Loading episodes…</div></div>';}\n   html+='</div></div></div>';\n   o.innerHTML=html;\n   document.getElementById(\"close\").onclick=function(){o.classList.remove(\"show\");};\n   document.getElementById(\"detailPlay\").onclick=function(){play(x);};\n   document.getElementById(\"detailList\").onclick=function(){toggleList(x);};\n   if(type===\"series\"&&d.seasons&&d.seasons.length){\n     function loadSeason(n){document.getElementById(\"episodes\").innerHTML=\"Loading episodes…\";fetch(base+\"/app/api/episodes?id=\"+encodeURIComponent(x.id)+\"&season=\"+n,{cache:\"no-store\"}).then(function(r){return r.json()}).then(function(q){var eps=q.episodes||[];document.getElementById(\"episodes\").innerHTML=eps.length?eps.map(function(ep){return '<button class=\"stream episodeBtn\" data-id=\"'+esc(ep.id)+'\" style=\"display:block;width:100%;text-align:left\"><b>E'+ep.episode+\" — \"+esc(ep.name)+'</b><br><small>'+esc(ep.releaseInfo||\"\")+'</small></button>';}).join(\"\"):\"No episodes found.\";document.querySelectorAll(\".episodeBtn\").forEach(function(b){b.onclick=function(){var ep=eps.find(function(z){return z.id===b.getAttribute(\"data-id\")});if(ep)play(ep);};});});}\n     document.querySelectorAll(\".seasonBtn\").forEach(function(b){b.onclick=function(){loadSeason(parseInt(b.getAttribute(\"data-season\"),10));};});loadSeason(d.seasons[0].season);\n   }\n }).catch(function(){o.innerHTML='<div class=\"modal\"><button class=\"close\" id=\"close\">×</button><div class=\"empty\">Could not load details.</div></div>';document.getElementById(\"close\").onclick=function(){o.classList.remove(\"show\");};});\n}\nfunction bind(){document.querySelectorAll(\".card\").forEach(function(c){c.onclick=function(){showDetails(c.getAttribute(\"data-type\")||\"movie\",c.getAttribute(\"data-id\"));};c.onkeydown=function(e){if(e.key===\"Enter\"||e.key===\" \"){e.preventDefault();c.click();}};});}\nfunction loadPage(p){\n var m=document.getElementById(\"main\");m.innerHTML='<div class=\"empty\">Loading…</div>';\n if(p===\"list\"){var a=JSON.parse(localStorage.getItem(\"skynetMyList\")||\"[]\");m.innerHTML=a.length?row(\"My List\",a):'<div class=\"empty\">Your My List is empty.</div>';bind();return;}\n var jobs=p===\"series\"?[get(\"series\",\"skynet-trending-series\"),get(\"series\",\"skynet-popular-series\"),get(\"series\",\"skynet-top-rated-series\")]:p===\"films\"?[get(\"movie\",\"skynet-trending-movies\"),get(\"movie\",\"skynet-popular-movies\"),get(\"movie\",\"skynet-top-rated-movies\"),get(\"movie\",\"skynet-new-releases-movies\")]:p===\"new\"?[get(\"movie\",\"skynet-new-releases-movies\")]:[get(\"movie\",\"skynet-trending-movies\"),get(\"movie\",\"skynet-popular-movies\"),get(\"series\",\"skynet-trending-series\"),get(\"movie\",\"skynet-new-releases-movies\")];\n Promise.all(jobs).then(function(a){var flat=a.flat();if(flat[0])setHero(flat[0]);m.innerHTML=a.map(function(items,i){return row((p===\"home\"?[\"Trending now\",\"Popular films\",\"Popular series\",\"Fresh this week\"]:p===\"films\"?[\"Trending\",\"Popular\",\"Top Rated\",\"New Releases\"]:p===\"series\"?[\"Trending\",\"Popular\",\"Top Rated\"]:[\"New & Trending\"])[i]||\"Titles\",items);}).join(\"\");bind();});\n}\ndocument.querySelectorAll(\".tab\").forEach(function(b){b.onclick=function(){document.querySelectorAll(\".tab\").forEach(function(x){x.classList.toggle(\"active\",x===b);});loadPage(b.getAttribute(\"data-page\"));};});\ndocument.getElementById(\"heroPlay\").onclick=function(){if(hero)play(hero);};\ndocument.getElementById(\"heroList\").onclick=function(){if(hero)toggleList(hero);};\ndocument.getElementById(\"search\").onclick=function(){var q=prompt(\"Search Skynet\");if(!q)return;fetch(base+\"/app/api/search?q=\"+encodeURIComponent(q.trim()),{cache:\"no-store\"}).then(function(r){return r.json()}).then(function(d){document.getElementById(\"main\").innerHTML=row(\"Search results\",d.results||[]);bind();});};\ndocument.addEventListener(\"keydown\",function(e){if(e.key===\"Escape\"){var o=document.getElementById(\"overlay\");if(o&&o.classList.contains(\"show\"))o.classList.remove(\"show\");}});\nloadPage(\"home\");\nif(!playerName())setTimeout(showPlayerSetup,700);\n})();\n";
  res.send(js);
});

app.get("/app-v3", (_req, res) => {
  res.set({
    "Content-Type":"text/html; charset=utf-8",
    "Cache-Control":"no-store, no-cache, must-revalidate, max-age=0",
    "Pragma":"no-cache"
  });
  res.send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Skynet</title>
<style>
*{box-sizing:border-box}html,body{margin:0;background:#07080b;color:#fff;font-family:Arial,sans-serif}body{overflow-x:hidden}
header{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:24px;padding:14px 4vw;background:rgba(7,8,11,.96);backdrop-filter:blur(14px);border-bottom:1px solid #20232a}
.logo{font-size:32px;font-weight:950;color:#ff4050;letter-spacing:-1.5px}.nav{display:flex;gap:24px;overflow-x:auto;scrollbar-width:none}.nav::-webkit-scrollbar{display:none}.nav button{border:0;background:none;color:#aeb4bd;font-weight:800;padding:9px 0;white-space:nowrap}.nav button.active{color:#fff}.actions{margin-left:auto;display:flex;gap:8px}.actions button{border:1px solid #30343c;background:#171a20;color:#fff;border-radius:50%;width:40px;height:40px}
.hero{min-height:500px;position:relative;display:flex;align-items:flex-end;overflow:hidden}.hero-bg{position:absolute;inset:0;background:center/cover no-repeat}.hero-bg:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#07080b 0%,rgba(7,8,11,.8) 38%,rgba(7,8,11,.2) 75%,#07080b 100%),linear-gradient(0deg,#07080b,transparent 55%)}.hero-copy{position:relative;z-index:2;padding:70px 5vw 55px;max-width:700px}.kicker{color:#ff4050;font-weight:900;text-transform:uppercase;font-size:13px;letter-spacing:1px}.hero h1{font-size:clamp(44px,6vw,82px);line-height:.95;margin:12px 0}.meta{font-weight:700;color:#dfe3e8}.desc{color:#c6cbd3;line-height:1.55;font-size:16px}.btn{border:0;border-radius:7px;padding:13px 22px;font-weight:900;margin:12px 8px 0 0}.play{background:#fff;color:#000}.list{background:#2a3039;color:#fff}
main{padding:0 4vw 60px}.section{margin:28px 0}.section h2{font-size:24px;margin:0 0 13px}.row{display:flex;gap:12px;overflow-x:auto;padding:3px 3px 14px;scrollbar-width:none}.row::-webkit-scrollbar{display:none}.card{flex:0 0 155px;cursor:pointer;outline:0}.poster{display:block;width:155px;height:232px;object-fit:cover;border-radius:6px;background:#191c22}.card:focus{outline:3px solid #ff4050;outline-offset:4px}.name{font-weight:800;margin-top:8px;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden;line-height:1.25;min-height:2.5em}.year{font-size:12px;color:#858d99;margin-top:3px}
.overlay{display:none;position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.82);overflow:auto}.overlay.show{display:block}.modal{max-width:900px;margin:6vh auto;background:#101217;border:1px solid #292d35;border-radius:14px;overflow:hidden}.detail-bg{min-height:520px;background:center/cover no-repeat;position:relative}.detail-bg:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,#101217 0%,rgba(16,18,23,.85) 28%,rgba(16,18,23,.05) 75%)}.detail-copy{position:absolute;z-index:2;left:0;right:0;bottom:0;padding:35px}.detail-copy h1{font-size:44px;margin:8px 0}.close{position:absolute;z-index:5;right:18px;top:15px;background:#171a20;color:#fff;border:0;border-radius:50%;width:40px;height:40px;font-size:24px}.stream{display:block;margin:10px 0;padding:14px;background:#1a1e25;color:#fff;text-decoration:none;border-radius:8px}.empty{padding:50px 0;color:#9299a3}
@media(max-width:900px){header{padding:11px 14px;gap:12px;flex-wrap:wrap}.logo{font-size:26px}.nav{order:3;flex:0 0 100%;width:100%;gap:18px}.nav button{font-size:14px}.hero{min-height:430px}.hero-copy{padding:60px 22px 35px}.hero h1{font-size:44px}main{padding:0 14px 40px}.card{flex-basis:110px}.poster{width:110px;height:165px}.section h2{font-size:20px}.modal{margin:0;border-radius:0;min-height:100vh}.detail-bg{min-height:620px}.detail-copy{padding:24px 20px}.detail-copy h1{font-size:34px}}
</style></head><body>
<header><div class="logo">SKYNET</div><nav class="nav" id="nav">
<button class="active" data-page="home">Home</button><button data-page="films">Films</button><button data-page="series">Series</button><button data-page="new">New &amp; Trending</button><button data-page="list">My List</button></nav>
<div class="actions"><button id="search" aria-label="Search">⌕</button></div></header>
<section class="hero"><div class="hero-bg" id="heroBg"></div><div class="hero-copy"><div class="kicker">Featured on Skynet</div><h1 id="heroTitle">Loading…</h1><div class="meta" id="heroMeta"></div><p class="desc" id="heroDesc"></p><button class="btn play" id="heroPlay">▶ Play</button><button class="btn list" id="heroList">＋ My List</button></div></section>
<main id="main"><div class="empty">Loading catalogue…</div></main>
<div class="overlay" id="overlay"></div>
<script src="/app-v3.js"></script></body></html>`);
});
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    name: "Skynet",
    version: "2.1.2",
    tmdbConfigured: Boolean(TMDB_KEY)
  });
});


app.get("/app/api/play.m3u", (req, res) => {
  try {
    const raw = String(req.query.url || "");
    if (!raw) return res.status(400).send("Missing stream URL");

    const parts = raw.split("|");
    const mediaUrl = parts.shift();
    if (!/^https?:\/\//i.test(mediaUrl)) return res.status(400).send("Invalid stream URL");

    const opts = {};
    parts.join("|").split("&").forEach(part => {
      const i = part.indexOf("=");
      if (i <= 0) return;
      const k = decodeURIComponent(part.slice(0, i)).toLowerCase();
      const v = decodeURIComponent(part.slice(i + 1));
      opts[k] = v;
    });

    const lines = ["#EXTM3U"];
    if (opts["user-agent"]) lines.push("#EXTVLCOPT:http-user-agent=" + opts["user-agent"]);
    if (opts["referer"]) lines.push("#EXTVLCOPT:http-referrer=" + opts["referer"]);
    if (opts["origin"]) lines.push("#EXTVLCOPT:http-origin=" + opts["origin"]);
    lines.push("#EXTINF:-1,Skynet Stream");
    lines.push(mediaUrl);

    res.set({
      "Content-Type": "audio/x-mpegurl; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
    });
    res.send(lines.join("\n") + "\n");
  } catch (e) {
    res.status(400).send("Invalid stream URL");
  }
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



app.get("/vod", (_req, res) => {
  const page = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Skynet VOD</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#08090d;color:#fff;font-family:Arial,sans-serif;overflow-x:hidden}
header{height:72px;display:flex;align-items:center;padding:0 28px;gap:28px;background:#0d0f15;position:sticky;top:0;z-index:5}
.logo{font-size:26px;font-weight:900;letter-spacing:2px}.logo span{color:#2d8cff}
nav{display:flex;gap:20px;color:#aaa;font-weight:700}nav b{color:#fff}
.search{margin-left:auto;background:#181b23;border:1px solid #333;color:#fff;border-radius:22px;padding:10px 16px;width:220px}
.hero{min-height:390px;padding:70px 45px;display:flex;align-items:center;background:linear-gradient(90deg,#08090d 0%,rgba(8,9,13,.78) 42%,rgba(8,9,13,.1)),linear-gradient(180deg,transparent 70%,#08090d),url('https://image.tmdb.org/t/p/w1280/6Wdl9N6dD7t4J9V3qvM6zQ3M0sV.jpg') center/cover}
.hero h1{font-size:54px;margin:0 0 12px}.hero p{max-width:560px;color:#bbb;font-size:18px;line-height:1.5}.play{background:#fff;color:#000;border:0;border-radius:8px;padding:13px 22px;font-size:17px;font-weight:800}
section{padding:8px 28px 18px}h2{font-size:22px;margin:14px 0}.row{display:flex;gap:14px;overflow-x:auto;padding-bottom:10px}.card{min-width:145px;width:145px;cursor:pointer}.card img{width:145px;height:215px;object-fit:cover;border-radius:8px;background:#151820}.card div{font-size:14px;font-weight:700;margin-top:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tag{font-size:11px;color:#ffd400;margin-top:3px}.empty{color:#777;padding:20px}
@media(max-width:700px){nav{display:none}.search{width:150px}.hero{padding:45px 24px;min-height:330px}.hero h1{font-size:38px}section{padding-left:18px}.card{min-width:120px;width:120px}.card img{width:120px;height:178px}}
</style></head>
<body>
<header><div class="logo">SKY<span>NET</span></div><nav><b>Home</b><span>Movies</span><span>Series</span><span>My List</span></nav><input id="q" class="search" placeholder="Search"></header>
<div class="hero"><div><div style="color:#2d8cff;font-weight:800">SKYNET VOD TEST</div><h1>Movies & Series</h1><p>This is the first working test of the Skynet VOD interface. Catalogue data is being pulled from your existing Skynet service.</p><button class="play" onclick="document.getElementById('movies').scrollIntoView({behavior:'smooth'})">Browse Movies</button></div></div>
<section><h2>🔥 Trending Movies</h2><div id="movies" class="row"><div class="empty">Loading...</div></div></section>
<section><h2>📺 Popular Series</h2><div id="series" class="row"><div class="empty">Loading...</div></div></section>
<section><h2>🎬 More Movies</h2><div id="more" class="row"><div class="empty">Loading...</div></div></section>
<script>
async function load(url,id){
 const el=document.getElementById(id); try{
  const d=await fetch(url).then(r=>r.json()); el.innerHTML='';
  (d.metas||[]).forEach(x=>{const a=document.createElement('div');a.className='card';a.innerHTML='<img src="'+(x.poster||'')+'" loading="lazy"><div>'+x.name+'</div><div class="tag">'+(x.releaseInfo||'')+'</div>';el.appendChild(a)});
  if(!el.children.length)el.innerHTML='<div class="empty">No titles found</div>';
 }catch(e){el.innerHTML='<div class="empty">Could not load catalogue</div>'}
}
load('/catalog/movie/skynet-trending-movies.json','movies');
load('/catalog/series/skynet-popular-series.json','series');
load('/catalog/movie/skynet-popular-movies.json','more');
</script></body></html>`;
  res.set("Content-Type","text/html; charset=utf-8");
  res.send(page);
});