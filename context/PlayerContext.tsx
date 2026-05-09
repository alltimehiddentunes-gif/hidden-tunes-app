import { Audio, AVPlaybackStatus } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { BackendYouTubeTrack } from "../services/youtubeBackend";

import {
  RadioTrack,
  buildRelatedRadioQueue,
  buildPersonalRadioQueue,
  extendRadioQueue,
  loadRadioQueue,
  saveRadioQueue,
} from "../services/radioEngine";

import {
  RecentlyPlayedTrack,
  addToRecentlyPlayed,
  loadRecentlyPlayed,
} from "../services/recentlyPlayedEngine";

export type AppSong = {
  id: string;
  title: string;
  artist?: string;
  user?: {
    name?: string;
  };
  channelTitle?: string;
  cover?: any;
  thumbnail?: string;
  artwork?: string;
  audio?: any;
  url?: string;
  streamUrl?: string;
  source?: string;
  sourceName?: string;
  type?: "local" | "audius" | "archive" | "youtube_video";
  isOnline?: boolean;
  videoId?: string;
};

type RepeatMode = "off" | "one" | "all";
type ActiveQueueMode = "standard" | "youtube" | "radio";

type PlayerContextType = {
  currentSong: AppSong | null;
  isPlaying: boolean;
  isLoading: boolean;
  positionMillis: number;
  durationMillis: number;
  position: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeatMode: RepeatMode;

  songs: AppSong[];
  onlineSongs: AppSong[];
  activeQueue: AppSong[];
  activeQueueIndex: number;
  activeQueueMode: ActiveQueueMode;

  favorites: AppSong[];
  recentlyPlayed: RecentlyPlayedTrack[];

  youtubeQueue: BackendYouTubeTrack[];
  youtubeQueueIndex: number;

  radioQueue: RadioTrack[];
  radioMode: boolean;
  radioIndex: number;

  playSong: (song: AppSong, queue?: AppSong[], index?: number) => Promise<void>;
  playQueue: (queue: AppSong[], startIndex?: number) => Promise<void>;
  playAudiusTrack: (song: AppSong) => Promise<void>;
  playYouTubeQueue: (
    tracks: BackendYouTubeTrack[],
    startIndex?: number
  ) => Promise<void>;

  startRadio: (seedTrack: AppSong) => Promise<void>;
  startPersonalRadio: () => Promise<void>;
  playNextRadioTrack: () => Promise<boolean>;
  stopRadio: () => Promise<void>;

  togglePlayPause: () => Promise<void>;
  stopPlayback: () => Promise<void>;
  nextSong: () => Promise<void>;
  previousSong: () => Promise<void>;
  seekTo: (millis: number) => Promise<void>;
  setVolume: (value: number) => Promise<void>;
  toggleMute: () => Promise<void>;
  toggleShuffle: () => void;
  toggleRepeatMode: () => void;
  toggleFavorite: (song: AppSong) => Promise<void>;
  isFavorite: (song: AppSong | null) => boolean;
  clearActiveQueue: () => Promise<void>;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const CURRENT_SONG_KEY = "hidden_tunes_current_song";
const FAVORITES_KEY = "hidden_tunes_favorites";
const YOUTUBE_QUEUE_KEY = "hidden_tunes_youtube_queue";
const YOUTUBE_QUEUE_INDEX_KEY = "hidden_tunes_youtube_queue_index";
const POSITION_KEY = "hidden_tunes_position";
const RADIO_MODE_KEY = "hidden_tunes_radio_mode";
const RADIO_INDEX_KEY = "hidden_tunes_radio_index";
const REPEAT_MODE_KEY = "hidden_tunes_repeat_mode";
const SHUFFLE_KEY = "hidden_tunes_shuffle";
const VOLUME_KEY = "hidden_tunes_volume";
const MUTED_KEY = "hidden_tunes_muted";

const ACTIVE_QUEUE_KEY = "hidden_tunes_active_queue";
const ACTIVE_QUEUE_INDEX_KEY = "hidden_tunes_active_queue_index";
const ACTIVE_QUEUE_MODE_KEY = "hidden_tunes_active_queue_mode";

export function PlayerProvider({ children }: { children: ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const isChangingTrackRef = useRef(false);
  const lastPositionSaveRef = useRef(0);

  const currentSongRef = useRef<AppSong | null>(null);
  const repeatModeRef = useRef<RepeatMode>("off");
  const volumeRef = useRef(1);
  const isMutedRef = useRef(false);
  const shuffleRef = useRef(false);

  const activeQueueRef = useRef<AppSong[]>([]);
  const activeQueueIndexRef = useRef(0);
  const activeQueueModeRef = useRef<ActiveQueueMode>("standard");

  const youtubeQueueRef = useRef<BackendYouTubeTrack[]>([]);
  const youtubeQueueIndexRef = useRef(0);

  const radioQueueRef = useRef<RadioTrack[]>([]);
  const radioModeRef = useRef(false);
  const radioIndexRef = useRef(0);

  const [currentSong, setCurrentSong] = useState<AppSong | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);

  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");

  const [songs] = useState<AppSong[]>([]);
  const [activeQueue, setActiveQueue] = useState<AppSong[]>([]);
  const [activeQueueIndex, setActiveQueueIndex] = useState(0);
  const [activeQueueMode, setActiveQueueMode] =
    useState<ActiveQueueMode>("standard");

  const [favorites, setFavorites] = useState<AppSong[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedTrack[]>(
    []
  );

  const [youtubeQueue, setYouTubeQueue] = useState<BackendYouTubeTrack[]>([]);
  const [youtubeQueueIndex, setYouTubeQueueIndex] = useState(0);

  const [radioQueue, setRadioQueue] = useState<RadioTrack[]>([]);
  const [radioMode, setRadioMode] = useState(false);
  const [radioIndex, setRadioIndex] = useState(0);

  const sanitizeYouTubeVideoId = (value: any) => {
    const text = String(value || "").replace("youtube-", "").trim();

    if (/^[a-zA-Z0-9_-]{11}$/.test(text)) {
      return text;
    }

    const match = text.match(/[a-zA-Z0-9_-]{11}/);
    return match ? match[0] : text;
  };

  const isYouTubeSong = (song?: AppSong | null) => {
    return (
      song?.type === "youtube_video" ||
      song?.sourceName === "YouTube" ||
      song?.source === "youtube" ||
      Boolean(song?.videoId)
    );
  };

  const normalizeYouTubeTrack = (
    track: Partial<BackendYouTubeTrack>
  ): BackendYouTubeTrack => {
    const realVideoId = sanitizeYouTubeVideoId(track.videoId || track.id);

    const artist = String(track.artist || track.channelTitle || "YouTube");
    const thumbnail = String(
      track.thumbnail ||
        track.artwork ||
        track.cover ||
        `https://img.youtube.com/vi/${realVideoId}/hqdefault.jpg`
    );

    return {
      id: `youtube-${realVideoId}`,
      videoId: realVideoId,
      title: String(track.title || "YouTube Music"),
      artist,
      channelTitle: String(track.channelTitle || artist),
      thumbnail,
      artwork: thumbnail,
      cover: thumbnail,
      sourceName: "YouTube",
      source: "youtube",
      type: "youtube_video",
      isYouTube: true,
      isOnline: true,
      duration: track.duration,
      url: track.url,
      streamUrl: track.streamUrl,
    };
  };

  const onlineSongs: AppSong[] = youtubeQueue.map((track) => {
    const normalized = normalizeYouTubeTrack(track);

    return {
      id: normalized.videoId,
      videoId: normalized.videoId,
      title: normalized.title,
      artist: normalized.artist || normalized.channelTitle || "YouTube",
      user: {
        name: normalized.artist || normalized.channelTitle || "YouTube",
      },
      channelTitle: normalized.channelTitle,
      thumbnail: normalized.thumbnail,
      cover: normalized.thumbnail,
      artwork: normalized.thumbnail,
      sourceName: "YouTube",
      source: "youtube",
      type: "youtube_video",
      isOnline: true,
    };
  });

  useEffect(() => {
    configureAudio();
    restoreSavedData();

    return () => {
      unloadCurrentSound();
    };
  }, []);

  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);

  useEffect(() => {
    activeQueueRef.current = activeQueue;
  }, [activeQueue]);

  useEffect(() => {
    activeQueueIndexRef.current = activeQueueIndex;
  }, [activeQueueIndex]);

  useEffect(() => {
    activeQueueModeRef.current = activeQueueMode;
  }, [activeQueueMode]);

  useEffect(() => {
    youtubeQueueRef.current = youtubeQueue;
  }, [youtubeQueue]);

  useEffect(() => {
    youtubeQueueIndexRef.current = youtubeQueueIndex;
  }, [youtubeQueueIndex]);

  useEffect(() => {
    radioQueueRef.current = radioQueue;
  }, [radioQueue]);

  useEffect(() => {
    radioModeRef.current = radioMode;
  }, [radioMode]);

  useEffect(() => {
    radioIndexRef.current = radioIndex;
  }, [radioIndex]);

  const configureAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.log("Configure audio error:", error);
    }
  };

  const makeSafeSongId = (song: AppSong) => {
    if (song.videoId) {
      return sanitizeYouTubeVideoId(song.videoId);
    }

    if (isYouTubeSong(song)) {
      return sanitizeYouTubeVideoId(song.id);
    }

    return String(
      song.id ||
        `${song.title || "track"}-${
          song.artist || song.channelTitle || "artist"
        }`
    ).trim();
  };

  const normalizeSong = (song: AppSong): AppSong => {
    const artist =
      song.artist ||
      song.user?.name ||
      song.channelTitle ||
      song.sourceName ||
      "Unknown Artist";

    const image = song.cover || song.thumbnail || song.artwork;
    const normalizedId = makeSafeSongId(song);
    const youtube = isYouTubeSong(song);

    return {
      ...song,
      id: normalizedId,
      videoId: youtube ? normalizedId : song.videoId,
      title: song.title || "Unknown Song",
      artist,
      user: song.user || {
        name: artist,
      },
      channelTitle: song.channelTitle || artist,
      cover: image,
      thumbnail: song.thumbnail || image,
      artwork: song.artwork || image,
      streamUrl: youtube ? undefined : song.streamUrl || song.url,
      url: youtube ? undefined : song.url,
      sourceName: youtube
        ? "YouTube"
        : song.sourceName || song.source || "Hidden Tunes",
      source: youtube ? "youtube" : song.source,
      type: youtube ? "youtube_video" : song.type,
      isOnline: song.isOnline ?? true,
    };
  };

  const persistActiveQueue = async (
    queue: AppSong[],
    index: number,
    mode: ActiveQueueMode
  ) => {
    try {
      await AsyncStorage.multiSet([
        [ACTIVE_QUEUE_KEY, JSON.stringify(queue.map(normalizeSong))],
        [ACTIVE_QUEUE_INDEX_KEY, String(index)],
        [ACTIVE_QUEUE_MODE_KEY, mode],
      ]);
    } catch (error) {
      console.log("Persist active queue error:", error);
    }
  };

  const syncActiveQueue = async (
    queue: AppSong[],
    index: number,
    mode: ActiveQueueMode
  ) => {
    const normalizedQueue = queue.map(normalizeSong);
    const safeIndex = Math.max(0, Math.min(index, normalizedQueue.length - 1));

    setActiveQueue(normalizedQueue);
    setActiveQueueIndex(safeIndex);
    setActiveQueueMode(mode);

    activeQueueRef.current = normalizedQueue;
    activeQueueIndexRef.current = safeIndex;
    activeQueueModeRef.current = mode;

    await persistActiveQueue(normalizedQueue, safeIndex, mode);
  };

  const restoreSavedData = async () => {
    try {
      const [
        savedSong,
        savedFavorites,
        savedQueue,
        savedIndex,
        savedPosition,
        savedRadioMode,
        savedRadioIndex,
        savedRepeatMode,
        savedShuffle,
        savedVolume,
        savedMuted,
        savedActiveQueue,
        savedActiveQueueIndex,
        savedActiveQueueMode,
      ] = await Promise.all([
        AsyncStorage.getItem(CURRENT_SONG_KEY),
        AsyncStorage.getItem(FAVORITES_KEY),
        AsyncStorage.getItem(YOUTUBE_QUEUE_KEY),
        AsyncStorage.getItem(YOUTUBE_QUEUE_INDEX_KEY),
        AsyncStorage.getItem(POSITION_KEY),
        AsyncStorage.getItem(RADIO_MODE_KEY),
        AsyncStorage.getItem(RADIO_INDEX_KEY),
        AsyncStorage.getItem(REPEAT_MODE_KEY),
        AsyncStorage.getItem(SHUFFLE_KEY),
        AsyncStorage.getItem(VOLUME_KEY),
        AsyncStorage.getItem(MUTED_KEY),
        AsyncStorage.getItem(ACTIVE_QUEUE_KEY),
        AsyncStorage.getItem(ACTIVE_QUEUE_INDEX_KEY),
        AsyncStorage.getItem(ACTIVE_QUEUE_MODE_KEY),
      ]);

      const savedRadioQueue = await loadRadioQueue();
      const upgradedRecent = await loadRecentlyPlayed();

      if (savedSong) {
        const parsedSong = normalizeSong(JSON.parse(savedSong));

        if (!isYouTubeSong(parsedSong)) {
          setCurrentSong(parsedSong);
          currentSongRef.current = parsedSong;
        }
      }

      if (savedPosition) {
        const millis = Number(savedPosition);
        if (!Number.isNaN(millis)) setPositionMillis(millis);
      }

      if (savedFavorites) {
        const parsedFavorites = JSON.parse(savedFavorites);
        if (Array.isArray(parsedFavorites)) {
          setFavorites(parsedFavorites.map(normalizeSong));
        }
      }

      if (savedQueue) {
        const parsedQueue = JSON.parse(savedQueue);
        if (Array.isArray(parsedQueue)) {
          const normalizedQueue = parsedQueue.map(normalizeYouTubeTrack);
          setYouTubeQueue(normalizedQueue);
          youtubeQueueRef.current = normalizedQueue;
        }
      }

      if (savedIndex) {
        const parsedIndex = Number(savedIndex);
        if (!Number.isNaN(parsedIndex)) {
          setYouTubeQueueIndex(parsedIndex);
          youtubeQueueIndexRef.current = parsedIndex;
        }
      }

      if (savedRadioQueue.length > 0) {
        setRadioQueue(savedRadioQueue);
        radioQueueRef.current = savedRadioQueue;
      }

      if (savedRadioMode === "true") {
        setRadioMode(true);
        radioModeRef.current = true;
      }

      if (savedRadioIndex) {
        const parsedRadioIndex = Number(savedRadioIndex);
        if (!Number.isNaN(parsedRadioIndex)) {
          setRadioIndex(parsedRadioIndex);
          radioIndexRef.current = parsedRadioIndex;
        }
      }

      if (
        savedRepeatMode === "off" ||
        savedRepeatMode === "one" ||
        savedRepeatMode === "all"
      ) {
        setRepeatMode(savedRepeatMode);
        repeatModeRef.current = savedRepeatMode;
      }

      if (savedShuffle === "true") {
        setShuffle(true);
        shuffleRef.current = true;
      }

      if (savedVolume) {
        const parsedVolume = Number(savedVolume);
        if (!Number.isNaN(parsedVolume)) {
          setVolumeState(parsedVolume);
          volumeRef.current = parsedVolume;
        }
      }

      if (savedMuted === "true") {
        setIsMuted(true);
        isMutedRef.current = true;
      }

      if (savedActiveQueue) {
        const parsedActiveQueue = JSON.parse(savedActiveQueue);

        if (Array.isArray(parsedActiveQueue)) {
          const normalizedQueue = parsedActiveQueue
            .map(normalizeSong)
            .filter((song) => !isYouTubeSong(song));

          const parsedActiveIndex = Number(savedActiveQueueIndex || 0);
          const safeMode: ActiveQueueMode =
            savedActiveQueueMode === "radio" ||
            savedActiveQueueMode === "standard"
              ? savedActiveQueueMode
              : "standard";

          setActiveQueue(normalizedQueue);
          activeQueueRef.current = normalizedQueue;

          if (!Number.isNaN(parsedActiveIndex)) {
            const safeIndex = Math.max(
              0,
              Math.min(parsedActiveIndex, Math.max(normalizedQueue.length - 1, 0))
            );

            setActiveQueueIndex(safeIndex);
            activeQueueIndexRef.current = safeIndex;
          }

          setActiveQueueMode(safeMode);
          activeQueueModeRef.current = safeMode;
        }
      }

      setRecentlyPlayed(upgradedRecent);
    } catch (error) {
      console.log("Restore player data error:", error);
    }
  };

  const unloadCurrentSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.log("Unload sound error:", error);
    }
  };

  const saveCurrentSong = async (song: AppSong) => {
    if (isYouTubeSong(song)) return;

    try {
      await AsyncStorage.setItem(CURRENT_SONG_KEY, JSON.stringify(song));
    } catch (error) {
      console.log("Save current song error:", error);
    }
  };

  const saveRecentlyPlayed = async (song: AppSong) => {
    try {
      const updated = await addToRecentlyPlayed(song);
      setRecentlyPlayed(updated);
    } catch (error) {
      console.log("Add recently played error:", error);
    }
  };

  const persistYouTubeQueue = async (
    queue: BackendYouTubeTrack[],
    index: number
  ) => {
    try {
      const normalizedQueue = queue.map(normalizeYouTubeTrack);

      await AsyncStorage.multiSet([
        [YOUTUBE_QUEUE_KEY, JSON.stringify(normalizedQueue)],
        [YOUTUBE_QUEUE_INDEX_KEY, String(index)],
      ]);
    } catch (error) {
      console.log("Persist YouTube queue error:", error);
    }
  };

  const persistRadioState = async (
    queue: RadioTrack[],
    index: number,
    enabled: boolean
  ) => {
    try {
      await saveRadioQueue(queue);
      await AsyncStorage.multiSet([
        [RADIO_INDEX_KEY, String(index)],
        [RADIO_MODE_KEY, String(enabled)],
      ]);
    } catch (error) {
      console.log("Persist radio state error:", error);
    }
  };

  const handlePlaybackStatusUpdate = async (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    const nextPosition = status.positionMillis || 0;
    const nextDuration = status.durationMillis || 0;

    setPositionMillis(nextPosition);
    setDurationMillis(nextDuration);
    setIsPlaying(status.isPlaying || false);

    const now = Date.now();

    if (now - lastPositionSaveRef.current > 2500) {
      lastPositionSaveRef.current = now;

      try {
        await AsyncStorage.setItem(POSITION_KEY, String(nextPosition));
      } catch (error) {
        console.log("Save playback position error:", error);
      }
    }

    if (status.didJustFinish && !isChangingTrackRef.current) {
      try {
        await AsyncStorage.removeItem(POSITION_KEY);
      } catch {}

      if (repeatModeRef.current === "one") {
        await soundRef.current?.setPositionAsync(0);
        await soundRef.current?.playAsync();
        return;
      }

      await nextSong();
    }
  };

  const loadAndPlay = async (song: AppSong) => {
    try {
      const normalizedSong = normalizeSong(song);

      if (isYouTubeSong(normalizedSong)) {
        console.log(
          "Blocked native YouTube playback. Use /youtube-player WebView instead."
        );
        setIsPlaying(false);
        setIsLoading(false);
        return;
      }

      isChangingTrackRef.current = true;
      setIsLoading(true);

      await unloadCurrentSound();

      const cleanStreamUrl =
        typeof normalizedSong.streamUrl === "string"
          ? normalizedSong.streamUrl.trim()
          : "";

      const source = normalizedSong.audio
        ? normalizedSong.audio
        : cleanStreamUrl.length > 0
        ? { uri: cleanStreamUrl }
        : null;

      if (!source) {
        console.log(
          "Missing audio source:",
          JSON.stringify(normalizedSong, null, 2)
        );
        setIsPlaying(false);
        setIsLoading(false);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        source,
        {
          shouldPlay: true,
          volume: isMutedRef.current ? 0 : volumeRef.current,
          progressUpdateIntervalMillis: 1000,
        },
        handlePlaybackStatusUpdate
      );

      soundRef.current = sound;

      try {
        const savedPosition = await AsyncStorage.getItem(POSITION_KEY);

        if (savedPosition && currentSongRef.current?.id === normalizedSong.id) {
          const millis = Number(savedPosition);

          if (!Number.isNaN(millis) && millis > 0) {
            await sound.setPositionAsync(millis);
          }
        }
      } catch (error) {
        console.log("Restore playback position error:", error);
      }

      setCurrentSong(normalizedSong);
      currentSongRef.current = normalizedSong;
      setIsPlaying(true);

      await saveCurrentSong(normalizedSong);
      await saveRecentlyPlayed(normalizedSong);
    } catch (error) {
      console.log("Load and play error:", error);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
      isChangingTrackRef.current = false;
    }
  };

  const getNextQueueIndex = (currentIndex: number, queueLength: number) => {
    if (queueLength <= 0) return -1;

    if (shuffleRef.current && queueLength > 1) {
      let randomIndex = currentIndex;

      while (randomIndex === currentIndex) {
        randomIndex = Math.floor(Math.random() * queueLength);
      }

      return randomIndex;
    }

    const nextIndex = currentIndex + 1;

    if (nextIndex >= queueLength) {
      return repeatModeRef.current === "all" ? 0 : -1;
    }

    return nextIndex;
  };

  const getPreviousQueueIndex = (currentIndex: number, queueLength: number) => {
    if (queueLength <= 0) return -1;

    const previousIndex = currentIndex - 1;

    if (previousIndex < 0) {
      return repeatModeRef.current === "all" ? queueLength - 1 : 0;
    }

    return previousIndex;
  };

  const playQueueAtIndex = async (index: number) => {
    const queue = activeQueueRef.current.filter((song) => !isYouTubeSong(song));

    if (!queue.length) return;

    const safeIndex = Math.max(0, Math.min(index, queue.length - 1));
    const song = normalizeSong(queue[safeIndex]);

    setActiveQueueIndex(safeIndex);
    activeQueueIndexRef.current = safeIndex;

    await persistActiveQueue(queue, safeIndex, activeQueueModeRef.current);
    await AsyncStorage.removeItem(POSITION_KEY);

    await loadAndPlay(song);
  };

  const playQueue = async (queue: AppSong[], startIndex = 0) => {
    const nativeQueue = queue
      .map(normalizeSong)
      .filter((song) => !isYouTubeSong(song));

    if (!nativeQueue.length) return;

    const safeIndex = Math.max(0, Math.min(startIndex, nativeQueue.length - 1));

    setRadioMode(false);
    radioModeRef.current = false;
    await AsyncStorage.setItem(RADIO_MODE_KEY, "false");

    await syncActiveQueue(nativeQueue, safeIndex, "standard");
    await AsyncStorage.removeItem(POSITION_KEY);

    await loadAndPlay(nativeQueue[safeIndex]);
  };

  const playSong = async (song: AppSong, queue?: AppSong[], index?: number) => {
    const normalizedSong = normalizeSong(song);

    if (isYouTubeSong(normalizedSong)) {
      console.log(
        "Blocked playSong for YouTube. Route to /youtube-player instead."
      );
      return;
    }

    if (queue?.length) {
      const nativeQueue = queue
        .map(normalizeSong)
        .filter((item) => !isYouTubeSong(item));

      const foundIndex = nativeQueue.findIndex(
        (item) => makeSafeSongId(item) === normalizedSong.id
      );

      await playQueue(
        nativeQueue,
        index ?? Math.max(0, foundIndex >= 0 ? foundIndex : 0)
      );
      return;
    }

    const existingQueue = activeQueueRef.current.filter(
      (item) => !isYouTubeSong(item)
    );

    const existingIndex = existingQueue.findIndex(
      (item) => makeSafeSongId(item) === normalizedSong.id
    );

    if (existingIndex >= 0) {
      setActiveQueueIndex(existingIndex);
      activeQueueIndexRef.current = existingIndex;
      await persistActiveQueue(
        existingQueue,
        existingIndex,
        activeQueueModeRef.current
      );
    } else {
      await syncActiveQueue([normalizedSong], 0, "standard");
    }

    await loadAndPlay(normalizedSong);
  };

  const playAudiusTrack = async (song: AppSong) => {
    const normalizedSong = normalizeSong(song);

    if (isYouTubeSong(normalizedSong)) {
      console.log(
        "Blocked playAudiusTrack for YouTube. Use /youtube-player WebView instead."
      );
      setIsPlaying(false);
      setIsLoading(false);
      return;
    }

    await loadAndPlay({
      ...normalizedSong,
      type: normalizedSong.type || "audius",
      isOnline: true,
    });
  };

  const playYouTubeQueue = async (
    tracks: BackendYouTubeTrack[],
    startIndex = 0
  ) => {
    if (!tracks.length) return;

    const normalizedTracks = tracks.map(normalizeYouTubeTrack);
    const safeIndex = Math.max(
      0,
      Math.min(startIndex, normalizedTracks.length - 1)
    );

    setRadioMode(false);
    radioModeRef.current = false;
    await AsyncStorage.setItem(RADIO_MODE_KEY, "false");

    setYouTubeQueue(normalizedTracks);
    setYouTubeQueueIndex(safeIndex);
    youtubeQueueRef.current = normalizedTracks;
    youtubeQueueIndexRef.current = safeIndex;

    await persistYouTubeQueue(normalizedTracks, safeIndex);
  };

  const playRadioAtIndex = async (index: number) => {
    const queue = radioQueueRef.current;

    if (!queue.length) return false;

    const safeIndex = Math.max(0, Math.min(index, queue.length - 1));

    setRadioIndex(safeIndex);
    radioIndexRef.current = safeIndex;

    await persistRadioState(queue, safeIndex, true);

    return true;
  };

  const startRadio = async (seedTrack: AppSong) => {
    try {
      setIsLoading(true);

      const queue = await buildRelatedRadioQueue({
        title: seedTrack.title,
        artist: seedTrack.artist || seedTrack.channelTitle,
        channelTitle: seedTrack.channelTitle,
      });

      setRadioMode(true);
      radioModeRef.current = true;

      setRadioQueue(queue);
      radioQueueRef.current = queue;

      setRadioIndex(0);
      radioIndexRef.current = 0;

      await persistRadioState(queue, 0, true);
    } catch (error) {
      console.log("Start radio error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startPersonalRadio = async () => {
    try {
      setIsLoading(true);

      const queue = await buildPersonalRadioQueue();

      setRadioMode(true);
      radioModeRef.current = true;

      setRadioQueue(queue);
      radioQueueRef.current = queue;

      setRadioIndex(0);
      radioIndexRef.current = 0;

      await persistRadioState(queue, 0, true);
    } catch (error) {
      console.log("Start personal radio error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const playNextRadioTrack = async () => {
    try {
      if (!radioModeRef.current) return false;

      let queue = radioQueueRef.current;
      const nextIndex = radioIndexRef.current + 1;

      if (queue.length === 0) return false;

      if (nextIndex >= queue.length - 2) {
        const seedTrack = queue[queue.length - 1];

        queue = await extendRadioQueue(queue, seedTrack);

        setRadioQueue(queue);
        radioQueueRef.current = queue;

        await persistRadioState(queue, radioIndexRef.current, true);
      }

      if (nextIndex < queue.length) {
        return await playRadioAtIndex(nextIndex);
      }

      return false;
    } catch (error) {
      console.log("Play next radio error:", error);
      return false;
    }
  };

  const stopRadio = async () => {
    setRadioMode(false);
    radioModeRef.current = false;

    setRadioIndex(0);
    radioIndexRef.current = 0;

    await AsyncStorage.multiSet([
      [RADIO_MODE_KEY, "false"],
      [RADIO_INDEX_KEY, "0"],
    ]);
  };

  const stopPlayback = async () => {
    try {
      isChangingTrackRef.current = true;

      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
        } catch {}

        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setIsPlaying(false);
      setIsLoading(false);
      setPositionMillis(0);
      setDurationMillis(0);

      currentSongRef.current = null;
      setCurrentSong(null);

      await AsyncStorage.multiRemove([CURRENT_SONG_KEY, POSITION_KEY]);
    } catch (error) {
      console.log("Stop playback error:", error);
    } finally {
      isChangingTrackRef.current = false;
    }
  };

  const nextSong = async () => {
    const queue = activeQueueRef.current.filter((song) => !isYouTubeSong(song));

    if (!queue.length) return;

    const nextIndex = getNextQueueIndex(activeQueueIndexRef.current, queue.length);

    if (nextIndex === -1) {
      setIsPlaying(false);
      return;
    }

    await playQueueAtIndex(nextIndex);
  };

  const previousSong = async () => {
    const queue = activeQueueRef.current.filter((song) => !isYouTubeSong(song));

    if (!queue.length) return;

    const previousIndex = getPreviousQueueIndex(
      activeQueueIndexRef.current,
      queue.length
    );

    if (previousIndex === -1) return;

    await playQueueAtIndex(previousIndex);
  };

  const togglePlayPause = async () => {
    if (!soundRef.current) return;

    const status = await soundRef.current.getStatusAsync();
    if (!status.isLoaded) return;

    if (status.isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const seekTo = async (millis: number) => {
    if (!soundRef.current) return;

    await soundRef.current.setPositionAsync(millis);
    setPositionMillis(millis);

    try {
      await AsyncStorage.setItem(POSITION_KEY, String(millis));
    } catch {}
  };

  const setVolume = async (value: number) => {
    const safeValue = Math.max(0, Math.min(value, 1));

    setVolumeState(safeValue);
    volumeRef.current = safeValue;

    await AsyncStorage.setItem(VOLUME_KEY, String(safeValue));

    if (!isMutedRef.current && soundRef.current) {
      await soundRef.current.setVolumeAsync(safeValue);
    }
  };

  const toggleMute = async () => {
    const nextMuted = !isMutedRef.current;

    setIsMuted(nextMuted);
    isMutedRef.current = nextMuted;

    await AsyncStorage.setItem(MUTED_KEY, String(nextMuted));

    if (soundRef.current) {
      await soundRef.current.setVolumeAsync(nextMuted ? 0 : volumeRef.current);
    }
  };

  const toggleShuffle = () => {
    setShuffle((prev) => {
      const next = !prev;
      shuffleRef.current = next;
      AsyncStorage.setItem(SHUFFLE_KEY, String(next));
      return next;
    });
  };

  const toggleRepeatMode = () => {
    setRepeatMode((prev) => {
      const next: RepeatMode =
        prev === "off" ? "one" : prev === "one" ? "all" : "off";

      repeatModeRef.current = next;
      AsyncStorage.setItem(REPEAT_MODE_KEY, next);

      return next;
    });
  };

  const toggleFavorite = async (song: AppSong) => {
    if (!song?.id) return;

    const normalizedSong = normalizeSong(song);
    const exists = favorites.some((item) => item.id === normalizedSong.id);

    const updated = exists
      ? favorites.filter((item) => item.id !== normalizedSong.id)
      : [normalizedSong, ...favorites];

    setFavorites(updated);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  };

  const isFavorite = (song: AppSong | null) => {
    if (!song?.id) return false;
    return favorites.some((item) => item.id === song.id);
  };

  const clearActiveQueue = async () => {
    setActiveQueue([]);
    setActiveQueueIndex(0);
    setActiveQueueMode("standard");

    activeQueueRef.current = [];
    activeQueueIndexRef.current = 0;
    activeQueueModeRef.current = "standard";

    await AsyncStorage.multiRemove([
      ACTIVE_QUEUE_KEY,
      ACTIVE_QUEUE_INDEX_KEY,
      ACTIVE_QUEUE_MODE_KEY,
    ]);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        isLoading,
        positionMillis,
        durationMillis,
        position: positionMillis,
        duration: durationMillis,
        volume,
        isMuted,
        shuffle,
        repeatMode,

        songs,
        onlineSongs,
        activeQueue,
        activeQueueIndex,
        activeQueueMode,

        favorites,
        recentlyPlayed,

        youtubeQueue,
        youtubeQueueIndex,

        radioQueue,
        radioMode,
        radioIndex,

        playSong,
        playQueue,
        playAudiusTrack,
        playYouTubeQueue,

        startRadio,
        startPersonalRadio,
        playNextRadioTrack,
        stopRadio,

        togglePlayPause,
        stopPlayback,
        nextSong,
        previousSong,
        seekTo,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeatMode,
        toggleFavorite,
        isFavorite,
        clearActiveQueue,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error("usePlayer must be used inside PlayerProvider");
  }

  return context;
}