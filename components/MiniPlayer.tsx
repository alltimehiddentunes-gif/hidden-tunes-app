import { useEffect, useMemo, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { COLORS, GRADIENTS } from "../constants/theme";
import { usePlayer } from "../context/PlayerContext";

type YouTubeMini = {
  id: string;
  title: string;
  channelTitle?: string;
  artist?: string;
  thumbnail?: string;
};

const YOUTUBE_MINI_KEY = "hidden_tunes_current_youtube";

export default function MiniPlayer() {
  const {
    currentSong,
    isPlaying,
    isLoading,
    togglePlayPause,
    nextSong,
    position,
    duration,
    radioMode,
    youtubeQueue,
    radioQueue,
  } = usePlayer() as any;

  const [youtubeVideo, setYoutubeVideo] = useState<YouTubeMini | null>(null);

  useEffect(() => {
    const loadYouTubeMini = async () => {
      try {
        const saved = await AsyncStorage.getItem(YOUTUBE_MINI_KEY);
        setYoutubeVideo(saved ? JSON.parse(saved) : null);
      } catch {
        setYoutubeVideo(null);
      }
    };

    loadYouTubeMini();

    const timer = setInterval(loadYouTubeMini, 1500);

    return () => clearInterval(timer);
  }, []);

  const isYoutubeMode = !currentSong && !!youtubeVideo;

  const progress = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return Math.min(position / duration, 1);
  }, [position, duration]);

  const queueLabel = useMemo(() => {
    if (radioMode && radioQueue?.length) return "Radio queue";
    if (youtubeQueue?.length) return `${youtubeQueue.length} in queue`;
    if (isYoutubeMode) return "YouTube";
    return "Now playing";
  }, [radioMode, radioQueue, youtubeQueue, isYoutubeMode]);

  if (!currentSong && !youtubeVideo) return null;

  const title = isYoutubeMode ? youtubeVideo?.title : currentSong?.title;

  const artist = isYoutubeMode
    ? youtubeVideo?.channelTitle || youtubeVideo?.artist || "YouTube"
    : currentSong?.artist || currentSong?.user?.name || "Unknown Artist";

  const cover = isYoutubeMode
    ? youtubeVideo?.thumbnail
    : currentSong?.cover || currentSong?.thumbnail || currentSong?.artwork;

  const openPlayer = () => {
    if (isYoutubeMode && youtubeVideo?.id) {
      router.push({
        pathname: "/youtube-player",
        params: {
          videoId: youtubeVideo.id,
          title: youtubeVideo.title,
          channelTitle: youtubeVideo.channelTitle || youtubeVideo.artist || "YouTube",
          thumbnail: youtubeVideo.thumbnail || "",
        },
      });
      return;
    }

    router.push("/player");
  };

  const handleMainButton = async () => {
    if (isYoutubeMode) {
      openPlayer();
      return;
    }

    await togglePlayPause();
  };

  return (
    <TouchableOpacity activeOpacity={0.92} style={styles.wrapper} onPress={openPlayer}>
      <LinearGradient colors={GRADIENTS.neon} style={styles.border}>
        <BlurView intensity={88} tint="dark" style={styles.container}>
          <View style={styles.coverWrap}>
            {cover ? (
              <Image
                source={typeof cover === "string" ? { uri: cover } : cover}
                style={styles.cover}
              />
            ) : isYoutubeMode ? (
              <View style={styles.youtubeCover}>
                <Ionicons name="logo-youtube" size={30} color="#fff" />
              </View>
            ) : (
              <LinearGradient colors={GRADIENTS.soft} style={styles.youtubeCover}>
                <Ionicons name="musical-notes" size={26} color={COLORS.primary} />
              </LinearGradient>
            )}

            {(isPlaying || isYoutubeMode) && <View style={styles.liveDot} />}
          </View>

          <View style={styles.info}>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, isYoutubeMode && styles.youtubeBadge]}>
                <Ionicons
                  name={isYoutubeMode ? "logo-youtube" : radioMode ? "radio" : "pulse"}
                  size={11}
                  color="#fff"
                />
                <Text style={styles.badgeText}>{queueLabel}</Text>
              </View>
            </View>

            <Text numberOfLines={1} style={styles.title}>
              {title}
            </Text>

            <Text numberOfLines={1} style={styles.artist}>
              {artist}
            </Text>

            {!isYoutubeMode ? (
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
            ) : (
              <Text numberOfLines={1} style={styles.youtubeNote}>
                Tap to reopen video
              </Text>
            )}
          </View>

          {!isYoutubeMode && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.nextButton}
              onPress={(event) => {
                event.stopPropagation();
                nextSong();
              }}
            >
              <Ionicons name="play-skip-forward" size={19} color={COLORS.text} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.playButton, isYoutubeMode && styles.youtubeButton]}
            onPress={(event) => {
              event.stopPropagation();
              handleMainButton();
            }}
          >
            <Ionicons
              name={
                isYoutubeMode
                  ? "open-outline"
                  : isLoading
                  ? "sync"
                  : isPlaying
                  ? "pause"
                  : "play"
              }
              size={isYoutubeMode ? 22 : 23}
              color={isYoutubeMode ? "#fff" : "#000"}
            />
          </TouchableOpacity>
        </BlurView>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 96,
    borderRadius: 30,
    overflow: "hidden",
  },

  border: {
    borderRadius: 30,
    padding: 1.4,
  },

  container: {
    height: 86,
    borderRadius: 29,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: "rgba(5,5,8,0.88)",
  },

  coverWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
  },

  cover: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: COLORS.cardLight,
  },

  youtubeCover: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#ff0033",
    alignItems: "center",
    justifyContent: "center",
  },

  liveDot: {
    position: "absolute",
    right: -2,
    top: -2,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: "#000",
  },

  info: {
    flex: 1,
    marginLeft: 13,
    paddingRight: 8,
  },

  badgeRow: {
    height: 17,
    justifyContent: "center",
  },

  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(168,85,247,0.82)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    gap: 4,
  },

  youtubeBadge: {
    backgroundColor: "rgba(255,0,51,0.9)",
  },

  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
  },

  title: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 1,
  },

  artist: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 3,
    fontWeight: "700",
  },

  youtubeNote: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
    fontWeight: "700",
  },

  progressTrack: {
    height: 4,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginTop: 8,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 99,
    backgroundColor: COLORS.primary,
  },

  nextButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.075)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  youtubeButton: {
    backgroundColor: "#ff0033",
  },
});