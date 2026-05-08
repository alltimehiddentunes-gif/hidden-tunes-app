import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio, AVPlaybackStatus } from "expo-av";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  BackendYouTubeTrack,
  getYouTubeAudioUrl,
} from "../services/youtubeBackend";

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
  audio?: any;
  streamUrl?: string;
  sourceName?: string;
  type?: "local" | "audius" | "archive" | "youtube";
  isOnline?: boolean;
};

type RepeatMode = "off" | "one" | "all";

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
  favorites: AppSong[];
  recentlyPlayed: AppSong[];

  youtubeQueue: BackendYouTubeTrack[];
  youtubeQueueIndex: number;

  playSong: (song: AppSong) => Promise<void>;
  playAudiusTrack: (song: AppSong) => Promise<void>;
  playYouTubeQueue: (
    tracks: BackendYouTubeTrack[],
    startIndex?: number
  ) => Promise<void>;

  togglePlayPause: () => Promise<void>;
  nextSong: () => Promise<void>;
  previousSong: () => Promise<void>;
  seekTo: (millis: number) => Promise<void>;

  setVolume: (value: number) => Promise<void>;
  toggleMute: () => Promise<void>;
  toggleShuffle: () => void;
  toggleRepeatMode: () => void;

  toggleFavorite: (song: AppSong) => Promise<void>;
  isFavorite: (song: AppSong | null) => boolean;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const CURRENT_SONG_KEY = "hidden_tunes_current_song";
const FAVORITES_KEY = "hidden_tunes_favorites";
const RECENTLY_PLAYED_KEY = "hidden_tunes_recently_played";
const YOUTUBE_QUEUE_KEY = "hidden_tunes_youtube_queue";
const YOUTUBE_QUEUE_INDEX_KEY = "hidden_tunes_youtube_queue_index";
const POSITION_KEY = "hidden_tunes_position";

export function PlayerProvider({ children }: { children: ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const isChangingTrackRef = useRef(false);

  const currentSongRef = useRef<AppSong | null>(null);
  const repeatModeRef = useRef<RepeatMode>("off");
  const volumeRef = useRef(1);
  const isMutedRef = useRef(false);

  const youtubeQueueRef = useRef<BackendYouTubeTrack[]>([]);
  const youtubeQueueIndexRef = useRef(0);

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
  const [favorites, setFavorites] = useState<AppSong[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<AppSong[]>([]);

  const [youtubeQueue, setYouTubeQueue] = useState<BackendYouTubeTrack[]>([]);
  const [youtubeQueueIndex, setYouTubeQueueIndex] = useState(0);

  const onlineSongs: AppSong[] = youtubeQueue.map((track) => ({
    id: track.id,
    title: track.title,
    artist: track.artist || track.channelTitle || "YouTube",
    user: {
      name: track.artist || track.channelTitle || "YouTube",
    },
    channelTitle: track.channelTitle,
    thumbnail: track.thumbnail,
    cover: track.thumbnail,
    sourceName: "YouTube",
    type: "youtube",
    isOnline: true,
  }));

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
    youtubeQueueRef.current = youtubeQueue;
  }, [youtubeQueue]);

  useEffect(() => {
    youtubeQueueIndexRef.current = youtubeQueueIndex;
  }, [youtubeQueueIndex]);

  const configureAudio = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  };

  const restoreSavedData = async () => {
    try {
      const savedSong = await AsyncStorage.getItem(CURRENT_SONG_KEY);
      const savedFavorites = await AsyncStorage.getItem(FAVORITES_KEY);
      const savedRecent = await AsyncStorage.getItem(RECENTLY_PLAYED_KEY);
      const savedQueue = await AsyncStorage.getItem(YOUTUBE_QUEUE_KEY);
      const savedIndex = await AsyncStorage.getItem(YOUTUBE_QUEUE_INDEX_KEY);
      const savedPosition = await AsyncStorage.getItem(POSITION_KEY);

      if (savedSong) {
        const parsedSong = JSON.parse(savedSong);
        setCurrentSong(parsedSong);
        currentSongRef.current = parsedSong;
      }

      if (savedPosition) {
        const millis = Number(savedPosition);
        if (!Number.isNaN(millis)) {
          setPositionMillis(millis);
        }
      }

      if (savedFavorites) {
        const parsedFavorites = JSON.parse(savedFavorites);
        if (Array.isArray(parsedFavorites)) {
          setFavorites(parsedFavorites);
        }
      }

      if (savedRecent) {
        const parsedRecent = JSON.parse(savedRecent);
        if (Array.isArray(parsedRecent)) {
          setRecentlyPlayed(parsedRecent);
        }
      }

      if (savedQueue) {
        const parsedQueue = JSON.parse(savedQueue);
        if (Array.isArray(parsedQueue)) {
          setYouTubeQueue(parsedQueue);
          youtubeQueueRef.current = parsedQueue;
        }
      }

      if (savedIndex) {
        const parsedIndex = Number(savedIndex);
        if (!Number.isNaN(parsedIndex)) {
          setYouTubeQueueIndex(parsedIndex);
          youtubeQueueIndexRef.current = parsedIndex;
        }
      }
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
    await AsyncStorage.setItem(CURRENT_SONG_KEY, JSON.stringify(song));
  };

  const addRecentlyPlayed = async (song: AppSong) => {
    setRecentlyPlayed((previous) => {
      const updated = [
        song,
        ...previous.filter((item) => item.id !== song.id),
      ].slice(0, 30);

      AsyncStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(updated));

      return updated;
    });
  };

  const persistYouTubeQueue = async (
    queue: BackendYouTubeTrack[],
    index: number
  ) => {
    await AsyncStorage.setItem(YOUTUBE_QUEUE_KEY, JSON.stringify(queue));
    await AsyncStorage.setItem(YOUTUBE_QUEUE_INDEX_KEY, String(index));
  };

  const handlePlaybackStatusUpdate = async (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    setPositionMillis(status.positionMillis || 0);
    setDurationMillis(status.durationMillis || 0);
    setIsPlaying(status.isPlaying || false);

    try {
      await AsyncStorage.setItem(
        POSITION_KEY,
        String(status.positionMillis || 0)
      );
    } catch (error) {
      console.log("Save playback position error:", error);
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
      isChangingTrackRef.current = true;
      setIsLoading(true);

      await unloadCurrentSound();

      const normalizedSong: AppSong = {
        ...song,
        artist:
          song.artist ||
          song.user?.name ||
          song.channelTitle ||
          "Unknown Artist",
        user: song.user || {
          name: song.artist || song.channelTitle || "Unknown Artist",
        },
      };

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
        return;
      }

      console.log("Loading audio source:", source);

      const { sound } = await Audio.Sound.createAsync(
        source,
        {
          shouldPlay: true,
          volume: isMutedRef.current ? 0 : volumeRef.current,
        },
        handlePlaybackStatusUpdate
      );

      soundRef.current = sound;

      try {
        const savedPosition = await AsyncStorage.getItem(POSITION_KEY);

        if (savedPosition && currentSongRef.current?.id === normalizedSong.id) {
          const millis = Number(savedPosition);

          if (!Number.isNaN(millis) && millis > 0) {
            console.log("Restoring playback position:", millis);
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
      await addRecentlyPlayed(normalizedSong);

      console.log("Playback started:", normalizedSong.title);
    } catch (error) {
      console.log("Load and play error:", error);
    } finally {
      setIsLoading(false);
      isChangingTrackRef.current = false;
    }
  };

  const playSong = async (song: AppSong) => {
    await loadAndPlay(song);
  };

  const playAudiusTrack = async (song: AppSong) => {
    try {
      if (song.type === "youtube" || song.sourceName === "YouTube") {
        console.log("Fetching YouTube audio for:", song.title);

        const audioUrl = await getYouTubeAudioUrl(song.id);

        if (!audioUrl || typeof audioUrl !== "string") {
          console.log("Invalid YouTube audio URL:", audioUrl);
          return;
        }

        const cleanAudioUrl = audioUrl.trim();

        if (!cleanAudioUrl.startsWith("http")) {
          console.log("Bad YouTube audio URL:", cleanAudioUrl);
          return;
        }

        await loadAndPlay({
          ...song,
          artist: song.artist || song.user?.name || song.channelTitle || "YouTube",
          user: song.user || {
            name: song.artist || song.channelTitle || "YouTube",
          },
          channelTitle: song.channelTitle || song.artist || "YouTube",
          cover: song.cover || song.thumbnail,
          streamUrl: cleanAudioUrl,
          sourceName: "YouTube",
          type: "youtube",
          isOnline: true,
        });

        return;
      }

      await loadAndPlay({
        ...song,
        type: song.type || "audius",
        isOnline: true,
      });
    } catch (error) {
      console.log("playAudiusTrack error:", error);
    }
  };

  const playYouTubeQueue = async (
    tracks: BackendYouTubeTrack[],
    startIndex = 0
  ) => {
    if (!tracks.length) return;

    const safeIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));

    setYouTubeQueue(tracks);
    setYouTubeQueueIndex(safeIndex);
    youtubeQueueRef.current = tracks;
    youtubeQueueIndexRef.current = safeIndex;

    await persistYouTubeQueue(tracks, safeIndex);
    await playYouTubeAtIndex(safeIndex);
  };

  const playYouTubeAtIndex = async (index: number) => {
    try {
      const queue = youtubeQueueRef.current;

      if (!queue.length) return;

      const safeIndex = Math.max(0, Math.min(index, queue.length - 1));
      const track = queue[safeIndex];

      setYouTubeQueueIndex(safeIndex);
      youtubeQueueIndexRef.current = safeIndex;

      await persistYouTubeQueue(queue, safeIndex);

      const audioUrl = await getYouTubeAudioUrl(track.id);

      if (!audioUrl || typeof audioUrl !== "string") {
        console.log("Invalid YouTube audio URL:", audioUrl);
        return;
      }

      const cleanAudioUrl = audioUrl.trim();

      if (!cleanAudioUrl.startsWith("http")) {
        console.log("Bad YouTube audio URL:", cleanAudioUrl);
        return;
      }

      const song: AppSong = {
        id: track.id,
        title: track.title,
        artist: track.artist || track.channelTitle || "YouTube",
        user: {
          name: track.artist || track.channelTitle || "YouTube",
        },
        channelTitle: track.channelTitle,
        thumbnail: track.thumbnail,
        cover: track.thumbnail,
        streamUrl: cleanAudioUrl,
        sourceName: "YouTube",
        type: "youtube",
        isOnline: true,
      };

      console.log("Playing YouTube audio:", cleanAudioUrl);

      await loadAndPlay(song);
    } catch (error) {
      console.log("Play YouTube at index error:", error);
    }
  };

  const nextSong = async () => {
    const current = currentSongRef.current;

    if (current?.type === "youtube") {
      const queue = youtubeQueueRef.current;
      const index = youtubeQueueIndexRef.current;

      if (!queue.length) return;

      let nextIndex = index + 1;

      if (nextIndex >= queue.length) {
        if (repeatModeRef.current === "all") {
          nextIndex = 0;
        } else {
          setIsPlaying(false);
          return;
        }
      }

      await AsyncStorage.removeItem(POSITION_KEY);
      await playYouTubeAtIndex(nextIndex);
    }
  };

  const previousSong = async () => {
    const current = currentSongRef.current;

    if (current?.type === "youtube") {
      const queue = youtubeQueueRef.current;
      const index = youtubeQueueIndexRef.current;

      if (!queue.length) return;

      let previousIndex = index - 1;

      if (previousIndex < 0) {
        previousIndex = repeatModeRef.current === "all" ? queue.length - 1 : 0;
      }

      await AsyncStorage.removeItem(POSITION_KEY);
      await playYouTubeAtIndex(previousIndex);
    }
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
  };

  const setVolume = async (value: number) => {
    setVolumeState(value);
    volumeRef.current = value;

    if (!isMutedRef.current && soundRef.current) {
      await soundRef.current.setVolumeAsync(value);
    }
  };

  const toggleMute = async () => {
    const nextMuted = !isMutedRef.current;

    setIsMuted(nextMuted);
    isMutedRef.current = nextMuted;

    if (soundRef.current) {
      await soundRef.current.setVolumeAsync(nextMuted ? 0 : volumeRef.current);
    }
  };

  const toggleShuffle = () => {
    setShuffle((prev) => !prev);
  };

  const toggleRepeatMode = () => {
    setRepeatMode((prev) => {
      if (prev === "off") return "one";
      if (prev === "one") return "all";
      return "off";
    });
  };

  const toggleFavorite = async (song: AppSong) => {
    if (!song?.id) return;

    const normalizedSong: AppSong = {
      ...song,
      artist:
        song.artist ||
        song.user?.name ||
        song.channelTitle ||
        "Unknown Artist",
      user: song.user || {
        name: song.artist || song.channelTitle || "Unknown Artist",
      },
    };

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
        favorites,
        recentlyPlayed,
        youtubeQueue,
        youtubeQueueIndex,
        playSong,
        playAudiusTrack,
        playYouTubeQueue,
        togglePlayPause,
        nextSong,
        previousSong,
        seekTo,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeatMode,
        toggleFavorite,
        isFavorite,
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