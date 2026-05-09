import express from "express";
import cors from "cors";
import ytdlp from "yt-dlp-exec";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const streamCache = new Map();

const HIDDEN_TUNES_CHANNEL_URL =
  process.env.HIDDEN_TUNES_CHANNEL_URL ||
  "https://www.youtube.com/@HiddenTunes/videos";

const HIDDEN_TUNES_PLAYLIST_URL =
  process.env.HIDDEN_TUNES_PLAYLIST_URL || "";

function extractYouTubeId(value) {
  const text = String(value || "").trim();

  if (!text) return "";

  if (/^[a-zA-Z0-9_-]{11}$/.test(text)) {
    return text;
  }

  try {
    const url = new URL(text);

    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v");

      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
        return id;
      }

      const shortsMatch = url.pathname.match(
        /\/shorts\/([a-zA-Z0-9_-]{11})/
      );

      if (shortsMatch?.[1]) {
        return shortsMatch[1];
      }

      const embedMatch = url.pathname.match(
        /\/embed\/([a-zA-Z0-9_-]{11})/
      );

      if (embedMatch?.[1]) {
        return embedMatch[1];
      }
    }

    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "").trim();

      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
        return id;
      }
    }
  } catch {}

  const match = text.match(/[a-zA-Z0-9_-]{11}/);

  return match ? match[0] : "";
}

function normalizeYouTubeItem(item) {
  if (!item) return null;

  const id = extractYouTubeId(
    item.id ||
      item.videoId ||
      item.url ||
      item.webpage_url ||
      item.original_url
  );

  if (!id) return null;

  const title = String(item.title || "Unknown Title").trim();

  if (!title) return null;
  if (title.toLowerCase().includes("deleted video")) return null;
  if (title.toLowerCase().includes("private video")) return null;

  const artist =
    item.artist ||
    item.channelTitle ||
    item.uploader ||
    item.channel ||
    item.uploader_id ||
    "Hidden Tunes";

  const thumbnail =
    item.thumbnail ||
    item.cover ||
    item.image ||
    `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

  return {
    id: `youtube-${id}`,
    videoId: id,
    title,
    artist,
    channelTitle: artist,
    thumbnail,
    artwork: thumbnail,
    cover: thumbnail,
    sourceName: "YouTube",
    source: "youtube",
    isYouTube: true,
    isOnline: true,
    type: "youtube_video",
    duration: item.duration || item.duration_string || undefined,
  };
}

function dedupeTracks(tracks) {
  const seen = new Set();

  return tracks.filter((track) => {
    if (!track?.videoId) return false;
    if (seen.has(track.videoId)) return false;

    seen.add(track.videoId);
    return true;
  });
}

async function searchYouTube(query, limit = 20) {
  const safeLimit = Math.min(Number(limit || 20), 20);

  const result = await ytdlp(`ytsearch${safeLimit}:${query}`, {
    dumpSingleJson: true,
    skipDownload: true,
    noWarnings: true,
    noPlaylist: true,
    flatPlaylist: false,
  });

  const tracks = (result?.entries || [])
    .map(normalizeYouTubeItem)
    .filter(Boolean);

  return dedupeTracks(tracks);
}

async function fetchYouTubeList(url, limit = 20) {
  if (!url) return [];

  const safeLimit = Math.min(Number(limit || 20), 20);

  const result = await ytdlp(url, {
    dumpSingleJson: true,
    skipDownload: true,
    noWarnings: true,
    flatPlaylist: true,
    playlistEnd: safeLimit,
  });

  const entries = Array.isArray(result?.entries) ? result.entries : [];

  const tracks = entries.map(normalizeYouTubeItem).filter(Boolean);

  return dedupeTracks(tracks).slice(0, safeLimit);
}

async function getHiddenTunesCatalog(limit = 20) {
  const safeLimit = Math.min(Number(limit || 20), 20);

  const sources = [
    HIDDEN_TUNES_PLAYLIST_URL,
    HIDDEN_TUNES_CHANNEL_URL,
  ].filter(Boolean);

  for (const source of sources) {
    try {
      console.log("Hidden Tunes source:", source);

      const tracks = await fetchYouTubeList(source, safeLimit);

      if (tracks.length > 0) {
        return {
          source,
          mode: source.includes("playlist") ? "playlist" : "channel",
          tracks,
        };
      }
    } catch (error) {
      console.log("Hidden Tunes source failed:", source, error.message);
    }
  }

  return {
    source: "none",
    mode: "empty",
    tracks: [],
  };
}

app.get("/", (req, res) => {
  res.json({
    status: "Hidden Tunes backend running",
    playback: "YouTube WebView discovery",
    nativeAudio: "R2/Audius/Archive only",
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
    const limit = Math.min(Number(req.query.limit || 20), 20);

    if (!query) {
      return res.status(400).json({
        error: "Missing search query",
      });
    }

    const tracks = await searchYouTube(query, limit);

    res.json({
      query,
      tracks,
    });
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
    const limit = Math.min(Number(req.query.limit || 20), 20);

    const query = String(
      req.query.q ||
        "trending afrobeat music amapiano afrobeats dancehall"
    ).trim();

    const tracks = await searchYouTube(query, limit);

    res.json({
      title: "Trending YouTube",
      query,
      tracks,
    });
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
    const limit = Math.min(Number(req.query.limit || 20), 20);

    const catalog = await getHiddenTunesCatalog(limit);

    res.json({
      title: "Hidden Tunes Catalog",
      source: catalog.source,
      mode: catalog.mode,
      tracks: catalog.tracks,
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
  const safeVideoId = extractYouTubeId(videoId);

  if (!safeVideoId) {
    throw new Error("Missing or invalid YouTube video ID");
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
    format: "140/bestaudio[ext=m4a]/bestaudio",
  });

  const streamUrl = String(rawUrl || "").split("\n")[0].trim();

  if (!streamUrl) {
    throw new Error("No stream URL returned");
  }

  const lower = streamUrl.toLowerCase();

  if (
    lower.includes("itag=251") ||
    lower.includes("itag=250") ||
    lower.includes("itag=249") ||
    lower.includes("audio/webm") ||
    lower.includes("audio%2fwebm")
  ) {
    throw new Error("Rejected WEBM. iOS requires m4a/audio mp4.");
  }

  console.log("M4A READY:", safeVideoId);

  streamCache.set(safeVideoId, streamUrl);

  return streamUrl;
}

app.get("/api/youtube/audio/:videoId", async (req, res) => {
  try {
    const safeVideoId = extractYouTubeId(req.params.videoId);
    const streamUrl = await getM4aUrl(safeVideoId);

    res.json({
      videoId: safeVideoId,
      streamUrl,
      cached: streamCache.has(safeVideoId),
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
    const safeVideoId = extractYouTubeId(req.params.videoId);
    const streamUrl = await getM4aUrl(safeVideoId);

    res.json({
      videoId: safeVideoId,
      streamUrl,
      cached: streamCache.has(safeVideoId),
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