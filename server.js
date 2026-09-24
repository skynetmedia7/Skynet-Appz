import express from "express";

const app = express();
const PORT = process.env.PORT || 10000;
const TMDB_KEY = process.env.TMDB_API_KEY || "";

const manifest = {
  id: "com.skynet.stremio",
  version: "1.0.0",
  name: "Skynet",
  description: "Skynet catalogue addon for Stremio",
  logo: "https://raw.githubusercontent.com/skynetmedia7/Skynet-Appz/main/logo.png",
  resources: ["catalog"],
  types: ["movie","series"],
  catalogs: [
    {type:"movie", id:"skynet-popular-movies", name:"Skynet Popular Movies"},
    {type:"series", id:"skynet-popular-series", name:"Skynet Popular Series"}
  ],
  behaviorHints: { configurable: false }
};

app.get("/", (_req,res)=>res.json(manifest));
app.get("/manifest.json", (_req,res)=>res.json(manifest));

async function tmdb(path) {
  if (!TMDB_KEY) throw new Error("TMDB_API_KEY is not configured");
  const r = await fetch("https://api.themoviedb.org/3"+path, {
    headers: { Authorization: "Bearer "+TMDB_KEY, accept:"application/json" }
  });
  if (!r.ok) throw new Error("TMDB returned "+r.status);
  return r.json();
}

function meta(item,type) {
  return {
    id: "tmdb:"+item.id,
    type,
    name: item.title || item.name,
    poster: item.poster_path ? "https://image.tmdb.org/t/p/w500"+item.poster_path : undefined,
    background: item.backdrop_path ? "https://image.tmdb.org/t/p/w1280"+item.backdrop_path : undefined,
    description: item.overview || undefined,
    releaseInfo: (item.release_date || item.first_air_date || "").slice(0,4),
    imdbRating: item.vote_average ? Number(item.vote_average.toFixed(1)) : undefined
  };
}

app.get("/catalog/movie/skynet-popular-movies.json", async (_req,res)=>{
  try {
    const data=await tmdb("/movie/popular?language=en-US&page=1");
    res.json({metas:data.results.map(x=>meta(x,"movie"))});
  } catch(e) { res.status(503).json({metas:[], error:e.message}); }
});

app.get("/catalog/series/skynet-popular-series.json", async (_req,res)=>{
  try {
    const data=await tmdb("/tv/popular?language=en-US&page=1");
    res.json({metas:data.results.map(x=>meta(x,"series"))});
  } catch(e) { res.status(503).json({metas:[], error:e.message}); }
});

app.get("/health", (_req,res)=>res.json({ok:true,name:"Skynet",tmdbConfigured:Boolean(TMDB_KEY)}));

app.listen(PORT,()=>console.log("Skynet listening on "+PORT));