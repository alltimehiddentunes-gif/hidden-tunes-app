import { useMemo } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { COLORS, GRADIENTS } from "../../constants/theme";
import { usePlayer } from "../../context/PlayerContext";

import MediaCard from "../../components/MediaCard";
import NeonEQ from "../../components/NeonEQ";

export default function QueueScreen() {
  const {
    currentSong,
    isPlaying,
    playSong,
    playAudiusTrack,
    activeQueue,
    activeQueueIndex,
    activeQueueMode,
    youtubeQueue,
    radioMode,
    nextSong,
    previousSong,
    stopPlayback,
    clearActiveQueue,
  } = usePlayer() as any;

  const queue = useMemo(() => {
    if (activeQueue?.length) {
      return activeQueue.map((track: any, index: number) => ({
        ...track,
        queueIndex: index,
        queueType: activeQueueMode || "standard",
      }));
    }

    return [];
  }, [activeQueue, activeQueueMode]);

  const nowPlaying =
    currentSong ||
    (queue.length > 0 && activeQueueIndex >= 0
      ? queue[activeQueueIndex]
      : null);

  const upNext = queue.filter((item: any, index: number) => {
    if (!nowPlaying) return true;
    if (item.id === nowPlaying.id) return false;
    return index > activeQueueIndex;
  });

  const queueModeLabel =
    activeQueueMode === "radio"
      ? "Personal radio is running"
      : activeQueueMode === "youtube"
      ? "YouTube queue is ready"
      : queue.length > 0
      ? "Persistent queue is ready"
      : "Your next tracks";

  const getArtist = (item: any) => {
    return (
      item?.artist ||
      item?.user?.name ||
      item?.channelTitle ||
      "Unknown Artist"
    );
  };

  const getImage = (item: any) => {
    return item?.cover || item?.thumbnail || item?.artwork || null;
  };

  const playQueueItem = async (item: any) => {
    const index = typeof item.queueIndex === "number" ? item.queueIndex : 0;

    const normalized = {
      ...item,
      artist: getArtist(item),
      user: item.user || {
        name: getArtist(item),
      },
      cover: getImage(item),
      thumbnail: item.thumbnail || getImage(item),
      artwork: item.artwork || getImage(item),
      sourceName: item.sourceName || "Hidden Tunes",
      isOnline: item.isOnline ?? true,
    };

    if (queue.length > 0 && activeQueueMode === "standard") {
      await playSong(normalized, queue, index);
      return;
    }

    if (normalized.type === "youtube" || normalized.sourceName === "YouTube") {
      await playAudiusTrack(normalized);
      return;
    }

    await playSong(normalized, queue, index);
  };

  const renderQueueItem = ({ item }: { item: any }) => {
    const active = currentSong?.id === item.id;

    return (
      <View style={[styles.trackShell, active && styles.trackShellActive]}>
        <MediaCard
          title={item.title || "Unknown Song"}
          subtitle={`${getArtist(item)} • ${item.sourceName || "Hidden Tunes"}`}
          image={getImage(item)}
          type={item.queueType === "radio" ? "radio" : "song"}
          size="medium"
          showPlayButton={false}
          onPress={() => playQueueItem(item)}
        />

        <View style={styles.trackAction}>
          {active && isPlaying ? (
            <View style={styles.eqBox}>
              <NeonEQ isPlaying={isPlaying} size="small" />
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.playButton}
              onPress={() => playQueueItem(item)}
            >
              <Ionicons name="play" size={18} color="#000" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={GRADIENTS.main} style={styles.container}>
      <View style={styles.glowPurple} />
      <View style={styles.glowCyan} />

      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.title}>Queue</Text>
          <Text style={styles.subtitle}>{queueModeLabel}</Text>
        </View>

        {queue.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.clearButton}
            onPress={clearActiveQueue}
          >
            <Ionicons name="trash-outline" size={19} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={upNext}
        keyExtractor={(item, index) =>
          item.id
            ? `queue-${item.queueType}-${item.id}-${index}`
            : `queue-${index}`
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.queueStats}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{queue.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{upNext.length}</Text>
                <Text style={styles.statLabel}>Up Next</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {activeQueueMode === "youtube"
                    ? "YT"
                    : activeQueueMode === "radio"
                    ? "FM"
                    : "HQ"}
                </Text>
                <Text style={styles.statLabel}>Mode</Text>
              </View>
            </View>

            <View style={styles.nowPlayingSection}>
              <Text style={styles.sectionLabel}>Now Playing</Text>

              {nowPlaying ? (
                <View style={styles.nowPlayingCard}>
                  <MediaCard
                    title={nowPlaying.title || "Unknown Song"}
                    subtitle={`${getArtist(nowPlaying)} • ${
                      nowPlaying.sourceName || "Hidden Tunes"
                    }`}
                    image={getImage(nowPlaying)}
                    type={radioMode ? "radio" : "song"}
                    size="medium"
                    showPlayButton={false}
                    onPress={() => playQueueItem(nowPlaying)}
                  />

                  <View style={styles.nowActions}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.controlButton}
                      onPress={previousSong}
                    >
                      <Ionicons
                        name="play-skip-back"
                        size={19}
                        color={COLORS.text}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.mainControlButton}
                      onPress={nextSong}
                    >
                      <Ionicons
                        name="play-skip-forward"
                        size={20}
                        color="#000"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.controlButton}
                      onPress={stopPlayback}
                    >
                      <Ionicons name="stop" size={18} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyNowCard}>
                  <Ionicons
                    name="musical-notes-outline"
                    size={42}
                    color={COLORS.textMuted}
                  />
                  <Text style={styles.emptyNowText}>Nothing playing yet</Text>
                </View>
              )}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Up Next</Text>
              <Text style={styles.sectionSub}>
                {upNext.length > 0
                  ? `${upNext.length} tracks waiting`
                  : "No upcoming tracks"}
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="albums-outline" size={56} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Queue is empty</Text>
            <Text style={styles.emptyText}>
              Search a song, start radio, or play a playlist to build your queue.
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.searchMusicButton}
              onPress={() => router.push("/search")}
            >
              <Ionicons name="search" size={18} color="#000" />
              <Text style={styles.searchMusicText}>Find Music</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={renderQueueItem}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  glowPurple: {
    position: "absolute",
    top: 20,
    left: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(168,85,247,0.18)",
  },

  glowCyan: {
    position: "absolute",
    top: 270,
    right: -140,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(34,211,238,0.1)",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  headerText: {
    flex: 1,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.075)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  clearButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.075)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  title: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.6,
  },

  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 4,
    fontWeight: "700",
  },

  listContent: {
    paddingBottom: 180,
  },

  queueStats: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 22,
  },

  statCard: {
    flex: 1,
    minHeight: 74,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    alignItems: "center",
    justifyContent: "center",
  },

  statNumber: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
  },

  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
  },

  nowPlayingSection: {
    marginBottom: 22,
  },

  sectionLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  nowPlayingCard: {
    position: "relative",
  },

  nowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: -4,
    marginBottom: 10,
    justifyContent: "center",
  },

  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  mainControlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyNowCard: {
    minHeight: 118,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyNowText: {
    color: COLORS.textMuted,
    marginTop: 10,
    fontWeight: "800",
  },

  sectionHeader: {
    marginBottom: 14,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
  },

  sectionSub: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 5,
  },

  trackShell: {
    position: "relative",
  },

  trackShellActive: {
    borderRadius: 28,
    backgroundColor: "rgba(168,85,247,0.12)",
  },

  trackAction: {
    position: "absolute",
    right: 16,
    top: 27,
  },

  playButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  eqBox: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyBox: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 18,
  },

  emptyText: {
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },

  searchMusicButton: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 999,
  },

  searchMusicText: {
    color: "#000",
    fontWeight: "900",
  },
});