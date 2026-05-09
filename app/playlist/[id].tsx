import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useFocusEffect, useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, GRADIENTS } from "../../constants/theme";
import { usePlayer } from "../../context/PlayerContext";

import MediaCard from "../../components/MediaCard";
import PlaylistArtworkCollage from "../../components/PlaylistArtworkCollage";
import NeonEQ from "../../components/NeonEQ";

import {
  deletePlaylist,
  getPlaylistById,
  HiddenTunesPlaylist,
  removeTrackFromPlaylist,
} from "../../services/playlistEngine";

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams();
  const playlistId = String(id);

  const { playSong, playQueue, currentSong, isPlaying } = usePlayer() as any;

  const [playlist, setPlaylist] = useState<HiddenTunesPlaylist | null>(null);

  const tracks = useMemo(() => playlist?.tracks || [], [playlist]);

  const loadPlaylist = async () => {
    const data = await getPlaylistById(playlistId);
    setPlaylist(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadPlaylist();
    }, [playlistId])
  );

  const getTrackId = (track: any) => {
    return String(
      track?.id || track?.videoId || `${track?.title}-${track?.artist}`
    )
      .replace("youtube-", "")
      .trim();
  };

  const getTrackImage = (track: any) => {
    return track?.cover || track?.thumbnail || track?.artwork || null;
  };

  const getTrackArtist = (track: any) => {
    return (
      track?.artist ||
      track?.user?.name ||
      track?.channelTitle ||
      track?.sourceName ||
      "Hidden Tunes"
    );
  };

  const normalizeTrack = (track: any) => {
    const artist = getTrackArtist(track);
    const image = getTrackImage(track);

    return {
      ...track,
      id: getTrackId(track),
      title: track?.title || "Unknown Song",
      artist,
      user: track?.user || {
        name: artist,
      },
      channelTitle: track?.channelTitle || artist,
      cover: image,
      thumbnail: track?.thumbnail || image,
      artwork: track?.artwork || image,
      streamUrl: track?.streamUrl || track?.url,
      sourceName: track?.sourceName || track?.source || "Hidden Tunes",
      isOnline: track?.isOnline ?? true,
    };
  };

  const normalizedTracks = useMemo(() => {
    return tracks.map(normalizeTrack);
  }, [tracks]);

  const playTrack = async (track: any) => {
    if (!track || !normalizedTracks.length) return;

    const trackId = getTrackId(track);
    const startIndex = Math.max(
      0,
      normalizedTracks.findIndex((item: any) => item.id === trackId)
    );

    await playSong(normalizeTrack(track), normalizedTracks, startIndex);
  };

  const handlePlayAll = async () => {
    if (!normalizedTracks.length) return;

    if (playQueue) {
      await playQueue(normalizedTracks, 0);
      return;
    }

    await playTrack(normalizedTracks[0]);
  };

  const handleRemoveTrack = async (trackId: string) => {
    await removeTrackFromPlaylist(playlistId, trackId);
    await loadPlaylist();
  };

  const handleDeletePlaylist = () => {
    Alert.alert(
      "Delete Playlist",
      `Delete "${playlist?.name}"? This cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deletePlaylist(playlistId);
            router.back();
          },
        },
      ]
    );
  };

  if (!playlist) {
    return (
      <LinearGradient colors={GRADIENTS.main} style={styles.container}>
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.topButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.missingBox}>
          <Ionicons
            name="alert-circle-outline"
            size={50}
            color={COLORS.textMuted}
          />

          <Text style={styles.missing}>Playlist not found.</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={GRADIENTS.main} style={styles.container}>
      <View style={styles.glowPurple} />
      <View style={styles.glowCyan} />

      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.topButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDeletePlaylist} style={styles.topButton}>
          <Ionicons name="trash-outline" size={21} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={normalizedTracks}
        keyExtractor={(item, index) => `${getTrackId(item)}_${index}`}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.hero}>
            <View style={styles.coverShadow}>
              <PlaylistArtworkCollage tracks={normalizedTracks} size={188} />
            </View>

            <Text numberOfLines={2} style={styles.title}>
              {playlist.name}
            </Text>

            <Text style={styles.subtitle}>
              {normalizedTracks.length}{" "}
              {normalizedTracks.length === 1 ? "song" : "songs"}
            </Text>

            <View style={styles.actionRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePlayAll}
                disabled={!normalizedTracks.length}
                style={[
                  styles.playBtn,
                  !normalizedTracks.length && styles.playBtnDisabled,
                ]}
              >
                <Ionicons name="play" size={20} color="#000" />
                <Text style={styles.playText}>Play Playlist</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push("/queue")}
                disabled={!normalizedTracks.length}
                style={[
                  styles.queueBtn,
                  !normalizedTracks.length && styles.playBtnDisabled,
                ]}
              >
                <Ionicons name="list" size={21} color={COLORS.text} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push("/search" as any)}
                style={styles.addBtn}
              >
                <Ionicons name="add" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.helperPill}>
              <Ionicons name="sync" size={13} color={COLORS.primary} />
              <Text style={styles.helperText}>
                Playlist queue saves automatically
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons
              name="musical-notes-outline"
              size={50}
              color={COLORS.textMuted}
            />

            <Text style={styles.emptyTitle}>No songs yet</Text>

            <Text style={styles.emptyText}>
              Add songs from Search, Radio, or Player using the plus button.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const trackId = getTrackId(item);
          const active = currentSong?.id === trackId;

          return (
            <View style={[styles.trackShell, active && styles.trackShellActive]}>
              <MediaCard
                title={item.title || "Unknown Song"}
                subtitle={`${getTrackArtist(item)} • ${
                  item.sourceName || "Hidden Tunes"
                }`}
                image={getTrackImage(item)}
                type="song"
                size="medium"
                showPlayButton={false}
                onPress={() => playSong(item, normalizedTracks, index)}
              />

              <View style={styles.trackActions}>
                {active ? (
                  <View style={styles.eqBox}>
                    <NeonEQ isPlaying={isPlaying} size="small" />
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.playIconButton}
                    onPress={() => playSong(item, normalizedTracks, index)}
                  >
                    <Ionicons name="play" size={18} color="#000" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.removeButton}
                  onPress={() => handleRemoveTrack(trackId)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 58,
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
    top: 300,
    right: -140,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(34,211,238,0.11)",
  },

  topHeader: {
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 2,
  },

  topButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.075)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  hero: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 26,
  },

  coverShadow: {
    width: 188,
    height: 188,
    borderRadius: 46,
    marginBottom: 22,
    shadowColor: "#A855F7",
    shadowOpacity: 0.3,
    shadowRadius: 28,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    elevation: 8,
  },

  title: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.7,
  },

  subtitle: {
    color: COLORS.textMuted,
    marginTop: 8,
    fontWeight: "800",
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 22,
  },

  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 22,
  },

  playBtnDisabled: {
    opacity: 0.45,
  },

  playText: {
    color: "#000",
    fontWeight: "900",
  },

  queueBtn: {
    width: 50,
    height: 50,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  addBtn: {
    width: 50,
    height: 50,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  helperPill: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.075)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  helperText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },

  list: {
    paddingHorizontal: 18,
    paddingBottom: 160,
  },

  trackShell: {
    position: "relative",
    marginBottom: 2,
  },

  trackShellActive: {
    borderRadius: 26,
    backgroundColor: "rgba(168,85,247,0.12)",
  },

  trackActions: {
    position: "absolute",
    right: 14,
    top: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  playIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.075)",
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
    alignItems: "center",
    paddingTop: 35,
    paddingHorizontal: 28,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 14,
  },

  emptyText: {
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },

  missingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  missing: {
    color: COLORS.text,
    textAlign: "center",
    marginTop: 14,
    fontSize: 16,
    fontWeight: "800",
  },
});