import express from "express";
import cors from "cors";
import ytdlp from "yt-dlp-exec";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const streamCache = new Map();

function normalizeVideoId(value) {
  const text = String(value || "").trim();

  if (!text) return "";

  return text
    .replace("https://www.youtube.com/watch?v=", "")
    .replace("https://youtu.be/", "")
    .split("&")[0]
    .trim();
}

function normalizeYouTubeItem(item) {
  if (!item) return null;

  const rawId = item.id || item.videoId || item.url || item.webpage_url || "";
  const id = normalizeVideoId(rawId);

  if (!id) return null;

  const artist =
    item.artist ||
    item.channelTitle ||
    item.uploader ||
    item.channel ||
    "YouTube";

  return {
    id,
    title: item.title || "Unknown Title",
    artist,
    channelTitle: artist,
    thumbnail:
      item.thumbnail ||
      item.cover ||
      item.image ||
      `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    sourceName: "YouTube",
    isOnline: true,
    type: "youtube",
  };
}

app.get("/", (req, res) => {
  res.json({
    status: "Hidden Tunes backend running",
    audioFormat: "m4a only",
    routes: [
      "/api/youtube/search?q=burna",
      "/api/youtube/trending",
      "/api/youtube/hidden-tunes",
      "/api/youtube/audio/:videoId",
      "/api/youtube/stream/:videoId",
    ],
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    status: "connected",
    service: "Hidden Tunes backend",
  });
});

app.get("/api/youtube/search", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    const limit = Number(req.query.limit || 20);

    if (!query) {
      return res.status(400).json({ error: "Missing search query" });
    }

    const result = await ytdlp(`ytsearch${limit}:${query}`, {
      dumpSingleJson: true,
      skipDownload: true,
      noWarnings: true,
      flatPlaylist: true,
    });

    const tracks = (result?.entries || [])
      .map(normalizeYouTubeItem)
      .filter(Boolean);

    res.json({ tracks });
  } catch (error) {
    console.error("YouTube search error:", error);

    res.status(500).json({
      error: "YouTube search failed",
      details: error.message,
    });
  }
});

app.get("/api/youtube/trending", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 30);
    const query = String(
      req.query.q || "trending afrobeat music amapiano afrobeats dancehall"
    ).trim();

    const result = await ytdlp(`ytsearch${limit}:${query}`, {
      dumpSingleJson: true,
      skipDownload: true,
      noWarnings: true,
      flatPlaylist: true,
    });

    const tracks = (result?.entries || [])
      .map(normalizeYouTubeItem)
      .filter(Boolean);

    res.json({ title: "Trending YouTube", query, tracks });
  } catch (error) {
    console.error("YouTube trending error:", error);

    res.status(500).json({
      error: "YouTube trending failed",
      details: error.message,
    });
  }
});

app.get("/api/youtube/hidden-tunes", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 100);
    const query = String(
      req.query.q || "Hidden Tunes Caasi Wills music official audio album songs"
    ).trim();

    const result = await ytdlp(`ytsearch${limit}:${query}`, {
      dumpSingleJson: true,
      skipDownload: true,
      noWarnings: true,
      flatPlaylist: true,
    });

    const tracks = (result?.entries || [])
      .map(normalizeYouTubeItem)
      .filter(Boolean);

    res.json({
      title: "Hidden Tunes Catalog",
      query,
      tracks,
    });
  } catch (error) {
    console.error("Hidden Tunes catalog error:", error);

    res.status(500).json({
      error: "Hidden Tunes catalog failed",
      details: error.message,
    });
  }
});

async function getM4aUrl(videoId) {
  const safeVideoId = normalizeVideoId(videoId);

  if (!safeVideoId) {
    throw new Error("Missing YouTube video ID");
  }

  if (streamCache.has(safeVideoId)) {
    console.log("CACHE HIT M4A:", safeVideoId);
    return streamCache.get(safeVideoId);
  }

  console.log("CACHE MISS M4A:", safeVideoId);

  const videoUrl = `https://www.youtube.com/watch?v=${safeVideoId}`;

  const rawUrl = await ytdlp(videoUrl, {
    getUrl: true,
    noWarnings: true,
    noPlaylist: true,
    format: "140",
  });

  const streamUrl = String(rawUrl || "").split("\n")[0].trim();

  if (!streamUrl) {
    throw new Error("No m4a URL returned from yt-dlp");
  }

  const lower = streamUrl.toLowerCase();

  if (
    lower.includes("itag=251") ||
    lower.includes("itag=250") ||
    lower.includes("itag=249") ||
    lower.includes("audio%2fwebm") ||
    lower.includes("audio/webm")
  ) {
    throw new Error("Rejected WEBM. iOS needs m4a itag 140.");
  }

  if (!lower.includes("itag=140") && !lower.includes("mime=audio%2fmp4")) {
    console.log("Warning: URL does not clearly show itag 140:", streamUrl);
  }

  console.log("M4A URL READY:", safeVideoId);

  streamCache.set(safeVideoId, streamUrl);

  return streamUrl;
}

app.get("/api/youtube/audio/:videoId", async (req, res) => {
  try {
    const streamUrl = await getM4aUrl(req.params.videoId);

    res.json({
      videoId: req.params.videoId,
      streamUrl,
      cached: streamCache.has(normalizeVideoId(req.params.videoId)),
      format: "m4a",
    });
  } catch (error) {
    console.error("YouTube audio error:", error);

    res.status(500).json({
      error: "Failed to get YouTube m4a audio",
      details: error.message,
    });
  }
});

app.get("/api/youtube/stream/:videoId", async (req, res) => {
  try {
    const streamUrl = await getM4aUrl(req.params.videoId);

    res.json({
      videoId: req.params.videoId,
      streamUrl,
      cached: streamCache.has(normalizeVideoId(req.params.videoId)),
      format: "m4a",
    });
  } catch (error) {
    console.error("YouTube stream error:", error);

    res.status(500).json({
      error: "Failed to get YouTube m4a stream",
      details: error.message,
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Hidden Tunes backend running on port ${PORT}`);
});