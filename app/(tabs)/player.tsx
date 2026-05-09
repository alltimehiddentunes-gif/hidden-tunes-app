import { useEffect, useMemo, useState } from "react";

import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { COLORS, GRADIENTS } from "../../constants/theme";
import { usePlayer } from "../../context/PlayerContext";

import LiveWaveform from "../../components/LiveWaveform";
import AddToPlaylistModal from "../../components/AddToPlaylistModal";

function formatTime(ms: number) {
  const totalSeconds = Math.floor((ms || 0) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function PremiumIconButton({ children, onPress }: any) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          scale.value = withSequence(withSpring(0.88), withSpring(1));
          onPress?.();
        }}
        style={styles.iconButton}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PlayerScreen() {
  const {
    currentSong,
    isPlaying,
    isLoading,
    positionMillis,
    durationMillis,
    position,
    duration,
    togglePlayPause,
    seekTo,
    nextSong,
    previousSong,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    shuffle,
    toggleShuffle,
    repeatMode,
    toggleRepeatMode,
    toggleFavorite,
    isFavorite,
    radioMode,
    youtubeQueue,
    radioQueue,
  } = usePlayer() as any;

  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [selectedPlaylistTrack, setSelectedPlaylistTrack] = useState<any>(null);

  const rotate = useSharedValue(0);
  const pulse = useSharedValue(1);

  const playbackPosition = positionMillis ?? position ?? 0;
  const playbackDuration = durationMillis ?? duration ?? 1;

  const favoriteActive = isFavorite?.(currentSong);

  const queueLabel = useMemo(() => {
    if (radioMode && radioQueue?.length) return "RADIO MODE";
    if (youtubeQueue?.length) return `${youtubeQueue.length} IN QUEUE`;
    return "NOW PLAYING";
  }, [radioMode, radioQueue, youtubeQueue]);

  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(360, {
        duration: 18000,
      }),
      -1
    );

    pulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1400 }),
        withTiming(1, { duration: 1400 })
      ),
      -1
    );
  }, []);

  const artworkAnimated = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: isPlaying ? `${rotate.value}deg` : "0deg",
      },
      {
        scale: isPlaying ? pulse.value : 1,
      },
    ],
  }));

  if (!currentSong) {
    return (
      <LinearGradient colors={GRADIENTS.main} style={styles.emptyContainer}>
        <View style={styles.glowPurple} />
        <View style={styles.emptyIcon}>
          <Ionicons
            name="musical-notes-outline"
            size={64}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.emptyText}>Nothing Playing</Text>

        <Text style={styles.emptySubText}>
          Start a song from Search, Radio, or your playlists.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.emptyButton}
          onPress={() => router.push("/search")}
        >
          <Ionicons name="search" size={18} color="#000" />
          <Text style={styles.emptyButtonText}>Find Music</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const artwork =
    currentSong.artwork ||
    currentSong.cover ||
    currentSong.thumbnail ||
    null;

  const artworkSource =
    typeof artwork === "string" ? { uri: artwork } : artwork;

  const artist =
    currentSong.artist ||
    currentSong.user?.name ||
    currentSong.channelTitle ||
    currentSong.sourceName ||
    "Hidden Tunes";

  return (
    <LinearGradient colors={GRADIENTS.main} style={styles.container}>
      <View style={styles.glowPurple} />
      <View style={styles.glowCyan} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.topButton}>
            <Ionicons name="chevron-down" size={26} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.topCenter}>
            <Text style={styles.playingLabel}>{queueLabel}</Text>

            <Text numberOfLines={1} style={styles.artistTop}>
              {artist}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.topButton}
            onPress={() => {
              setSelectedPlaylistTrack(currentSong);
              setPlaylistModalVisible(true);
            }}
          >
            <Ionicons name="add-circle-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.artworkGlow}>
          <LinearGradient colors={GRADIENTS.neon} style={styles.artworkBorder}>
            <Animated.View style={[styles.artworkWrapper, artworkAnimated]}>
              {artworkSource ? (
                <Image source={artworkSource} style={styles.artwork} />
              ) : (
                <LinearGradient colors={GRADIENTS.soft} style={styles.artworkFallback}>
                  <Ionicons
                    name="musical-notes"
                    size={72}
                    color={COLORS.primary}
                  />
                </LinearGradient>
              )}
            </Animated.View>
          </LinearGradient>
        </View>

        <View style={styles.songInfo}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={styles.songTitle}>
              {currentSong.title}
            </Text>

            <Text numberOfLines={1} style={styles.artistName}>
              {artist}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.favoriteButton, favoriteActive && styles.favoriteActive]}
            onPress={() => toggleFavorite?.(currentSong)}
          >
            <Ionicons
              name={favoriteActive ? "heart" : "heart-outline"}
              size={26}
              color={favoriteActive ? COLORS.primary : COLORS.text}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.statusPill}>
          <Ionicons
            name={isLoading ? "sync" : isPlaying ? "pulse" : "pause-circle"}
            size={15}
            color={COLORS.primary}
          />
          <Text style={styles.statusText}>
            {isLoading
              ? "Loading stream"
              : isPlaying
              ? "Premium playback active"
              : "Paused"}
          </Text>
        </View>

        <View style={styles.waveformContainer}>
          <LiveWaveform isPlaying={isPlaying} />
        </View>

        <View style={styles.sliderContainer}>
          <Slider
            style={{ width: "100%" }}
            minimumValue={0}
            maximumValue={playbackDuration || 1}
            value={playbackPosition}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor="#ffffff20"
            thumbTintColor={COLORS.primary}
            onSlidingComplete={seekTo}
          />

          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(playbackPosition)}</Text>
            <Text style={styles.timeText}>{formatTime(playbackDuration)}</Text>
          </View>
        </View>

        <View style={styles.controlsRow}>
          <PremiumIconButton onPress={toggleShuffle}>
            <Ionicons
              name="shuffle"
              size={24}
              color={shuffle ? COLORS.primary : COLORS.textMuted}
            />
          </PremiumIconButton>

          <PremiumIconButton onPress={previousSong}>
            <Ionicons name="play-skip-back" size={34} color={COLORS.text} />
          </PremiumIconButton>

          <Pressable onPress={togglePlayPause} style={styles.playButton}>
            <Ionicons
              name={isLoading ? "sync" : isPlaying ? "pause" : "play"}
              size={38}
              color="#000"
            />
          </Pressable>

          <PremiumIconButton onPress={nextSong}>
            <Ionicons name="play-skip-forward" size={34} color={COLORS.text} />
          </PremiumIconButton>

          <PremiumIconButton onPress={toggleRepeatMode}>
            <Ionicons
              name={repeatMode === "one" ? "repeat-outline" : "repeat"}
              size={24}
              color={repeatMode !== "off" ? COLORS.primary : COLORS.textMuted}
            />
          </PremiumIconButton>
        </View>

        <View style={styles.extraActions}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.extraAction}
            onPress={() => router.push("/queue")}
          >
            <Ionicons name="list" size={19} color={COLORS.text} />
            <Text style={styles.extraActionText}>Queue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.extraAction}
            onPress={() => {
              setSelectedPlaylistTrack(currentSong);
              setPlaylistModalVisible(true);
            }}
          >
            <Ionicons name="add" size={20} color={COLORS.text} />
            <Text style={styles.extraActionText}>Playlist</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.volumeSection}>
          <TouchableOpacity onPress={toggleMute} style={styles.volumeIcon}>
            <Ionicons
              name={isMuted ? "volume-mute" : "volume-high"}
              size={22}
              color={COLORS.text}
            />
          </TouchableOpacity>

          <Slider
            style={{ flex: 1 }}
            minimumValue={0}
            maximumValue={1}
            value={volume}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor="#ffffff20"
            thumbTintColor={COLORS.primary}
            onValueChange={setVolume}
          />
        </View>
      </ScrollView>

      <AddToPlaylistModal
        visible={playlistModalVisible}
        track={selectedPlaylistTrack}
        onClose={() => setPlaylistModalVisible(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  glowPurple: {
    position: "absolute",
    top: 50,
    left: -120,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(168,85,247,0.18)",
  },

  glowCyan: {
    position: "absolute",
    top: 300,
    right: -130,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(34,211,238,0.1)",
  },

  content: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 150,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  emptyIcon: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  emptyText: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 18,
  },

  emptySubText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
  },

  emptyButton: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 999,
  },

  emptyButtonText: {
    color: "#000",
    fontWeight: "900",
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  topButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.075)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  topCenter: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 14,
  },

  playingLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "900",
  },

  artistTop: {
    color: COLORS.text,
    marginTop: 4,
    fontWeight: "800",
    maxWidth: 210,
  },

  artworkGlow: {
    alignSelf: "center",
    marginTop: 38,
    shadowColor: "#A855F7",
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: {
      width: 0,
      height: 16,
    },
    elevation: 9,
  },

  artworkBorder: {
    width: 314,
    height: 314,
    borderRadius: 157,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },

  artworkWrapper: {
    width: 308,
    height: 308,
    borderRadius: 154,
    overflow: "hidden",
    backgroundColor: COLORS.card,
  },

  artwork: {
    width: "100%",
    height: "100%",
  },

  artworkFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  songInfo: {
    marginTop: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  songTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.6,
  },

  artistName: {
    color: COLORS.textMuted,
    marginTop: 6,
    fontSize: 15,
    fontWeight: "700",
  },

  favoriteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.075)",
    alignItems: "center",
    justifyContent: "center",
  },

  favoriteActive: {
    backgroundColor: "rgba(168,85,247,0.15)",
  },

  statusPill: {
    marginTop: 16,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.075)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  statusText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },

  waveformContainer: {
    marginTop: 28,
    marginBottom: 10,
  },

  sliderContainer: {
    marginTop: 12,
  },

  timeRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  timeText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },

  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 34,
  },

  iconButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255,255,255,0.075)",
    alignItems: "center",
    justifyContent: "center",
  },

  playButton: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 8,
  },

  extraActions: {
    marginTop: 24,
    flexDirection: "row",
    gap: 12,
  },

  extraAction: {
    flex: 1,
    minHeight: 52,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  extraActionText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
  },

  volumeSection: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  volumeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.075)",
    alignItems: "center",
    justifyContent: "center",
  },
});