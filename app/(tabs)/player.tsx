import { useEffect } from "react";
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

import { COLORS } from "../../constants/theme";
import { usePlayer } from "../../context/PlayerContext";
import LiveWaveform from "../../components/LiveWaveform";

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
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
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.9);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
    >
      <Animated.View style={[styles.iconButton, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function PlayerScreen() {
  const {
    currentSong,
    isPlaying,
    position,
    duration,
    volume,
    isMuted,
    shuffle,
    repeatMode,
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
  } = usePlayer();

  const floatY = useSharedValue(0);
  const playScale = useSharedValue(1);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-7, { duration: 1900 }),
        withTiming(0, { duration: 1900 })
      ),
      -1,
      true
    );
  }, []);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const playButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playScale.value }],
  }));

  const favorite = currentSong ? isFavorite(currentSong) : false;

  if (!currentSong) {
    return (
      <LinearGradient
        colors={["#03130b", "#020617", "#000000"]}
        style={styles.container}
      >
        <View style={styles.emptyWrapper}>
          <View style={styles.emptyGlow} />

          <View style={styles.emptyArtwork}>
            <Ionicons name="musical-notes" size={74} color={COLORS.primary} />
          </View>

          <Text style={styles.emptyTitle}>Nothing Playing</Text>

          <Text style={styles.emptyText}>
            Search Audius or play a song from Home to begin your premium
            listening experience.
          </Text>

          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.emptyButton}
            onPress={() => router.push("/search")}
          >
            <Ionicons name="search" size={20} color="#000" />
            <Text style={styles.emptyButtonText}>Discover Music</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#03130b", "#020617", "#000000"]}
      style={styles.container}
    >
      <View style={styles.backgroundGlow} />

      <LinearGradient
        colors={[
          "rgba(34,197,94,0.24)",
          "rgba(34,197,94,0.09)",
          "transparent",
        ]}
        style={styles.heroBlur}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Animated.View style={styles.topBar}>
          <PremiumIconButton onPress={() => router.push("/")}>
            <Ionicons name="chevron-down" size={24} color={COLORS.text} />
          </PremiumIconButton>

          <View style={styles.topTextBox}>
            <Text style={styles.smallLabel}>NOW PLAYING</Text>
            <Text style={styles.topTitle}>
              {currentSong.isOnline ? "Online Stream" : "Hidden Tunes"}
            </Text>
          </View>

          <PremiumIconButton>
            <Ionicons
              name="ellipsis-horizontal"
              size={24}
              color={COLORS.text}
            />
          </PremiumIconButton>
        </Animated.View>

        <Animated.View style={[styles.coverStage, floatingStyle]}>
          <View style={styles.coverHalo} />

          <View style={styles.coverFrameOuter}>
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.22)",
                "rgba(34,197,94,0.12)",
                "rgba(255,255,255,0.04)",
              ]}
              style={styles.coverFrameGradient}
            >
              <View style={styles.coverFrameInner}>
                <Image
                  source={
                    typeof currentSong.cover === "string"
                      ? { uri: currentSong.cover }
                      : currentSong.cover
                  }
                  style={styles.cover}
                />

                <LinearGradient
                  colors={[
                    "rgba(255,255,255,0.18)",
                    "transparent",
                    "rgba(0,0,0,0.34)",
                  ]}
                  style={styles.coverOverlay}
                />
              </View>
            </LinearGradient>
          </View>

          <View style={styles.coverReflection} />
        </Animated.View>

        <Animated.View style={styles.songCard}>
          <View style={styles.songHeader}>
            <View style={styles.songTextBox}>
              <Text numberOfLines={1} style={styles.title}>
                {currentSong.title}
              </Text>

              <Text numberOfLines={1} style={styles.artist}>
                {currentSong.artist ||
                  currentSong.user?.name ||
                  "Unknown Artist"}
              </Text>
            </View>

            <TouchableOpacity onPress={() => toggleFavorite(currentSong)}>
              <Ionicons
                name={favorite ? "heart" : "heart-outline"}
                size={31}
                color={favorite ? COLORS.primary : COLORS.text}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.progressBox}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration || 1}
              value={position}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor="rgba(255,255,255,0.18)"
              thumbTintColor={COLORS.primary}
              onSlidingComplete={(value) => seekTo(value)}
            />

            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          <View style={styles.waveform}>
            <LiveWaveform
              isPlaying={isPlaying}
              size="small"
              color={COLORS.primary}
            />
          </View>

          <View style={styles.mainControls}>
            <PremiumIconButton onPress={toggleShuffle}>
              <Ionicons
                name="shuffle"
                size={23}
                color={shuffle ? COLORS.primary : COLORS.textMuted}
              />
            </PremiumIconButton>

            <PremiumIconButton onPress={previousSong}>
              <Ionicons name="play-skip-back" size={29} color={COLORS.text} />
            </PremiumIconButton>

            <Pressable
              onPress={togglePlayPause}
              onPressIn={() => {
                playScale.value = withSpring(0.9);
              }}
              onPressOut={() => {
                playScale.value = withSpring(1);
              }}
            >
              <Animated.View style={[styles.playButton, playButtonStyle]}>
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={40}
                  color="#000"
                />
              </Animated.View>
            </Pressable>

            <PremiumIconButton onPress={nextSong}>
              <Ionicons
                name="play-skip-forward"
                size={29}
                color={COLORS.text}
              />
            </PremiumIconButton>

            <PremiumIconButton onPress={toggleRepeatMode}>
              <Ionicons
                name={repeatMode === "one" ? "repeat-outline" : "repeat"}
                size={23}
                color={repeatMode !== "off" ? COLORS.primary : COLORS.textMuted}
              />
            </PremiumIconButton>
          </View>

          <View style={styles.volumeCard}>
            <TouchableOpacity onPress={toggleMute}>
              <Ionicons
                name={isMuted || volume === 0 ? "volume-mute" : "volume-high"}
                size={23}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>

            <Slider
              style={styles.volumeSlider}
              minimumValue={0}
              maximumValue={1}
              value={isMuted ? 0 : volume}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor="rgba(255,255,255,0.18)"
              thumbTintColor={COLORS.primary}
              onSlidingComplete={(value) => setVolume(value)}
            />
          </View>

          <View style={styles.sourcePill}>
            <Ionicons
              name={
                currentSong.isOnline
                  ? "cloud-outline"
                  : "phone-portrait-outline"
              }
              size={15}
              color={COLORS.primary}
            />

            <Text style={styles.sourceText}>
              {currentSong.isOnline
                ? "Streaming online"
                : "Playing from local library"}
            </Text>
          </View>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  emptyWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyGlow: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(34,197,94,0.12)",
  },

  emptyArtwork: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(15,23,42,0.75)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 34,
  },

  emptyText: {
    color: COLORS.textMuted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 24,
    marginTop: 14,
    paddingHorizontal: 10,
  },

  emptyButton: {
    marginTop: 28,
    height: 56,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 8,
  },

  backgroundGlow: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "rgba(34,197,94,0.18)",
  },

  heroBlur: {
    position: "absolute",
    top: -120,
    alignSelf: "center",
    width: 520,
    height: 520,
    borderRadius: 260,
  },

  content: {
    paddingTop: 50,
    paddingHorizontal: 22,
    paddingBottom: 30,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  topTextBox: {
    alignItems: "center",
  },

  smallLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },

  topTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 4,
  },

  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(15,23,42,0.72)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  coverStage: {
    marginTop: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  coverHalo: {
    position: "absolute",
    width: 290,
    height: 290,
    borderRadius: 145,
    backgroundColor: "rgba(34,197,94,0.16)",
  },

  coverFrameOuter: {
    width: "92%",
    aspectRatio: 1,
    borderRadius: 44,
    shadowColor: "#22c55e",
    shadowOpacity: 0.48,
    shadowRadius: 34,
    shadowOffset: {
      width: 0,
      height: 22,
    },
    elevation: 28,
  },

  coverFrameGradient: {
    flex: 1,
    borderRadius: 44,
    padding: 3,
  },

  coverFrameInner: {
    flex: 1,
    borderRadius: 41,
    overflow: "hidden",
    backgroundColor: COLORS.cardLight,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.14)",
  },

  cover: {
    width: "100%",
    height: "100%",
  },

  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  coverReflection: {
    marginTop: 15,
    width: "62%",
    height: 16,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.14)",
  },

  songCard: {
    marginTop: 24,
    backgroundColor: "rgba(15,23,42,0.76)",
    borderRadius: 32,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  songHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  songTextBox: {
    flex: 1,
    paddingRight: 14,
  },

  title: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "900",
  },

  artist: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 6,
    fontWeight: "700",
  },

  progressBox: {
    marginTop: 20,
  },

  slider: {
    width: "100%",
    height: 34,
  },

  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -2,
  },

  timeText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },

  waveform: {
    marginTop: 18,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  mainControls: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  playButton: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 15,
  },

  volumeCard: {
    marginTop: 24,
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 14,
    backgroundColor: "rgba(2,6,23,0.68)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    flexDirection: "row",
    alignItems: "center",
  },

  volumeSlider: {
    flex: 1,
    marginLeft: 10,
  },

  sourcePill: {
    alignSelf: "center",
    marginTop: 16,
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: "rgba(34,197,94,0.1)",
    flexDirection: "row",
    alignItems: "center",
  },

  sourceText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 7,
  },
});