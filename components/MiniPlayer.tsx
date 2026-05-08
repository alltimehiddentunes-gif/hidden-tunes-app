import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
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
};

const YOUTUBE_MINI_KEY = "hidden_tunes_current_youtube";

export default function MiniPlayer() {
  const { currentSong, isPlaying, togglePlayPause, position, duration } =
    usePlayer();

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

  if (!currentSong && !youtubeVideo) return null;

  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;

  const isYoutubeMode = !currentSong && !!youtubeVideo;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      style={styles.wrapper}
      onPress={() => {
        if (isYoutubeMode && youtubeVideo?.id) {
          router.push({
            pathname: "/youtube-player",
            params: {
              videoId: youtubeVideo.id,
              title: youtubeVideo.title,
              channelTitle:
                youtubeVideo.channelTitle || youtubeVideo.artist || "YouTube",
            },
          });
          return;
        }

        router.push("/player");
      }}
    >
      <LinearGradient colors={GRADIENTS.neon} style={styles.border}>
        <BlurView intensity={85} tint="dark" style={styles.container}>
          <View style={styles.coverWrap}>
            {isYoutubeMode ? (
              <View style={styles.youtubeCover}>
                <Ionicons name="logo-youtube" size={30} color="#fff" />
              </View>
            ) : (
              <Image
                source={
                  typeof currentSong?.cover === "string"
                    ? { uri: currentSong.cover }
                    : currentSong?.cover
                }
                style={styles.cover}
              />
            )}

            {(isPlaying || isYoutubeMode) && <View style={styles.liveDot} />}
          </View>

          <View style={styles.info}>
            <View style={styles.badgeRow}>
              {isYoutubeMode && (
                <View style={styles.youtubeBadge}>
                  <Ionicons name="logo-youtube" size={12} color="#fff" />
                  <Text style={styles.youtubeBadgeText}>YouTube</Text>
                </View>
              )}
            </View>

            <Text numberOfLines={1} style={styles.title}>
              {isYoutubeMode ? youtubeVideo?.title : currentSong?.title}
            </Text>

            <Text numberOfLines={1} style={styles.artist}>
              {isYoutubeMode
                ? youtubeVideo?.channelTitle || youtubeVideo?.artist || "YouTube"
                : currentSong?.artist || currentSong?.user?.name || "Unknown Artist"}
            </Text>

            {!isYoutubeMode && (
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${progress * 100}%` }]}
                />
              </View>
            )}

            {isYoutubeMode && (
              <Text numberOfLines={1} style={styles.youtubeNote}>
                Tap to reopen video
              </Text>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.playButton, isYoutubeMode && styles.youtubeButton]}
            onPress={(event) => {
              event.stopPropagation();

              if (isYoutubeMode) {
                if (!youtubeVideo?.id) return;

                router.push({
                  pathname: "/youtube-player",
                  params: {
                    videoId: youtubeVideo.id,
                    title: youtubeVideo.title,
                    channelTitle:
                      youtubeVideo.channelTitle ||
                      youtubeVideo.artist ||
                      "YouTube",
                  },
                });

                return;
              }

              togglePlayPause();
            }}
          >
            <Ionicons
              name={isYoutubeMode ? "open-outline" : isPlaying ? "pause" : "play"}
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
    borderRadius: 28,
    overflow: "hidden",
  },

  border: {
    borderRadius: 28,
    padding: 1.4,
  },

  container: {
    height: 82,
    borderRadius: 27,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: "rgba(5,5,8,0.86)",
  },

  coverWrap: {
    width: 58,
    height: 58,
    borderRadius: 19,
  },

  cover: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: COLORS.cardLight,
  },

  youtubeCover: {
    width: 58,
    height: 58,
    borderRadius: 19,
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
    paddingRight: 12,
  },

  badgeRow: {
    height: 16,
    justifyContent: "center",
  },

  youtubeBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,0,51,0.9)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    gap: 4,
  },

  youtubeBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
  },

  title: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
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