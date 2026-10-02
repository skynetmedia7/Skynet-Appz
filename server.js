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

app.get("/", (_req, res) => res.json(manifest));
app.get("/manifest.json", (_req, res) => res.json(manifest));
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
  sendServiceCatalog(res, "movie", "https://skynet-stremio-addon.onrender.com/movies/manifest.json")
);

app.get("/catalog/series/skynet-services-series.json", (_req, res) =>
  sendServiceCatalog(res, "series", "https://skynet-stremio-addon.onrender.com/series/manifest.json")
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

      const manifestUrl = type === "movie"
        ? "https://skynet-stremio-addon.onrender.com/movies/manifest.json"
        : "https://skynet-stremio-addon.onrender.com/series/manifest.json";
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
  const manifestUrl = "https://skynet-stremio-addon.onrender.com/movies/manifest.json";
  const seriesManifestUrl = "https://skynet-stremio-addon.onrender.com/series/manifest.json";
  const stremioUrl = "stremio://" + manifestUrl.replace(/^https?:\/\//, "");
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
.btn{display:block;text-decoration:none;background:#fff;color:#000;font-weight:700;font-size:19px;padding:16px;border-radius:12px;margin:20px 0}
.alt{display:block;color:#fff;border:1px solid #555;padding:13px;border-radius:10px;text-decoration:none;margin-top:10px}
small{display:block;color:#888;margin-top:18px;word-break:break-all}
</style>
</head>
<body><div class="card">
<img class="logo" src="https://raw.githubusercontent.com/skynetmedia7/Skynet-Appz/main/logo.png" alt="Skynet">
<h1>Install Skynet</h1>
<p>Install Movies and Series separately in Stremio.</p>
<a class="btn" href="${stremioUrl}">INSTALL SKYNET MOVIES</a>
<a class="alt" href="${manifestUrl}">Open Movies manifest</a>
<a class="btn" href="${seriesStremioUrl}">INSTALL SKYNET SERIES</a>
<a class="alt" href="${seriesManifestUrl}">Open Series manifest</a>
<small>Movies and Series are separate addons, so they appear separately in Stremio.</small>
</div></body></html>`;
  res.set("Content-Type","text/html; charset=utf-8");
  res.send(html);
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

