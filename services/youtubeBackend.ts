const API_BASE_URL = "https://hidden-tunes-backend.onrender.com";

export type BackendYouTubeTrack = {
  id: string;
  title: string;
  artist: string;
  channelTitle: string;
  thumbnail: string;
  sourceName: "YouTube";
  isOnline: true;
  type: "youtube";
};

export type BackendStatus = {
  online: boolean;
  statusText: string;
  baseUrl: string;
};

function normalizeBackendTrack(item: unknown): BackendYouTubeTrack | null {
  if (!item || typeof item !== "object") return null;

  const track = item as Record<string, any>;

  const rawId =
    track.id || track.videoId || track.url || track.webpage_url || "";

  const id = String(rawId)
    .replace("https://www.youtube.com/watch?v=", "")
    .replace("https://youtu.be/", "")
    .split("&")[0]
    .trim();

  if (!id) return null;

  const artist = String(
    track.artist ||
      track.channelTitle ||
      track.uploader ||
      track.channel ||
      "YouTube"
  );

  return {
    id,
    title: String(track.title || "Unknown Title"),
    artist,
    channelTitle: artist,
    thumbnail: String(
      track.thumbnail ||
        track.cover ||
        track.image ||
        `https://img.youtube.com/vi/${id}/hqdefault.jpg`
    ),
    sourceName: "YouTube",
    isOnline: true,
    type: "youtube",
  };
}

function safeTracks(data: unknown): BackendYouTubeTrack[] {
  const payload = data as any;

  const rawTracks: unknown[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.tracks)
    ? payload.tracks
    : Array.isArray(payload?.results)
    ? payload.results
    : Array.isArray(payload?.entries)
    ? payload.entries
    : [];

  return rawTracks
    .map((item: unknown) => normalizeBackendTrack(item))
    .filter((item): item is BackendYouTubeTrack => item !== null);
}

async function fetchJson(url: string): Promise<any | null> {
  try {
    console.log("YouTube backend request:", url);

    const response = await fetch(url);
    const text = await response.text();

    console.log("YouTube backend status:", response.status);

    if (!response.ok) {
      console.log("YouTube backend failed body:", text);
      return null;
    }

    if (!text.trim()) return null;

    return JSON.parse(text);
  } catch (error) {
    console.log("YouTube backend fetch error:", error);
    return null;
  }
}

export async function checkYouTubeBackendStatus(): Promise<BackendStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const text = await response.text();

    if (!response.ok) {
      return {
        online: false,
        statusText: `Offline (${response.status})`,
        baseUrl: API_BASE_URL,
      };
    }

    return {
      online: true,
      statusText: text.includes("connected") ? "Online" : "Online",
      baseUrl: API_BASE_URL,
    };
  } catch (error) {
    return {
      online: false,
      statusText: "Offline",
      baseUrl: API_BASE_URL,
    };
  }
}

export async function searchYouTubeBackend(
  query: string
): Promise<BackendYouTubeTrack[]> {
  const safeQuery = String(query || "").trim();

  if (!safeQuery) return [];

  const data = await fetchJson(
    `${API_BASE_URL}/api/youtube/search?q=${encodeURIComponent(safeQuery)}`
  );

  return safeTracks(data);
}

export async function getTrendingYouTubeBackend(): Promise<
  BackendYouTubeTrack[]
> {
  const data = await fetchJson(`${API_BASE_URL}/api/youtube/trending`);

  return safeTracks(data);
}

export async function getHiddenTunesYouTubeCatalog(): Promise<
  BackendYouTubeTrack[]
> {
  const data = await fetchJson(
    `${API_BASE_URL}/api/youtube/hidden-tunes?limit=100`
  );

  return safeTracks(data);
}

export async function getYouTubeBackendStream(videoId: string): Promise<string> {
  const safeVideoId = String(videoId || "").trim();

  if (!safeVideoId) {
    throw new Error("Missing YouTube video ID");
  }

  const data = await fetchJson(
    `${API_BASE_URL}/api/youtube/audio/${safeVideoId}`
  );

  const streamUrl = String(data?.streamUrl || data?.url || "").trim();

  if (!streamUrl) {
    throw new Error("No stream URL returned");
  }

  console.log("YouTube audio URL received");

  return streamUrl;
}

export async function getYouTubeAudioUrl(videoId: string): Promise<string> {
  return getYouTubeBackendStream(videoId);
}