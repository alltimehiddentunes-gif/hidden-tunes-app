import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { COLORS, GRADIENTS } from "../constants/theme";

import {
  searchYouTubeBackend,
  type BackendYouTubeTrack,
} from "../services/youtubeBackend";

type AlbumPreview = {
  id: string;
  album: string;
  artist: string;
  thumbnail: string;
  query: string;
};

const FALLBACK_THUMBNAIL =
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1000";

function getVideoId(track: BackendYouTubeTrack) {
  return String(track.videoId || track.id || "").replace("youtube-", "").trim();
}

export default function GenreScreen() {
  const params = useLocalSearchParams();

  const title = String(params.title || "Genre");
  const query = String(params.query || `${title} music`);

  const [tracks, setTracks] = useState<BackendYouTubeTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGenreTracks();
  }, [query]);

  async function loadGenreTracks() {
    try {
      setLoading(true);

      const results = await searchYouTubeBackend(query);
      setTracks(Array.isArray(results) ? results : []);
    } catch (error) {
      console.log("Genre load error:", error);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }

  const albums: AlbumPreview[] = useMemo(() => {
    return tracks.slice(0, 8).map((track, index) => {
      const videoId = getVideoId(track);
      const safeArtist = track.artist || track.channelTitle || "Unknown Artist";
      const safeThumbnail =
        track.thumbnail || track.artwork || track.cover || FALLBACK_THUMBNAIL;

      return {
        id: `${videoId || "genre-track"}-album-${index}`,
        album: `${safeArtist} Essentials`,
        artist: safeArtist,
        thumbnail: safeThumbnail,
        query: `${safeArtist} album songs`,
      };
    });
  }, [tracks]);

  function openTrack(track: BackendYouTubeTrack) {
    const videoId = getVideoId(track);

    if (!videoId) {
      console.log("Missing YouTube videoId:", track);
      return;
    }

    router.push({
      pathname: "/youtube-player",
      params: {
        id: videoId,
        videoId,
        title: track.title || "Unknown Song",
        artist: track.artist || track.channelTitle || "Unknown Artist",
        channelTitle: track.channelTitle || track.artist || "YouTube",
        thumbnail:
          track.thumbnail || track.artwork || track.cover || FALLBACK_THUMBNAIL,
      },
    } as any);
  }

  function openAlbum(album: AlbumPreview) {
    router.push({
      pathname: "/album",
      params: {
        album: album.album,
        artist: album.artist,
        thumbnail: album.thumbnail,
        query: album.query,
      },
    } as any);
  }

  function openRadio() {
    router.push({
      pathname: "/radio",
      params: {
        title: `${title} Radio`,
        query,
      },
    } as any);
  }

  return (
    <LinearGradient colors={GRADIENTS.main} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.kicker}>GENRE</Text>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {query}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadGenreTracks}
          activeOpacity={0.85}
        >
          <Ionicons name="refresh" size={21} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading {title}...</Text>
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item, index) =>
            `${item.videoId || item.id || "track"}-${index}`
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <View style={styles.radioCard}>
                <View style={styles.radioIcon}>
                  <Ionicons name="radio" size={28} color={COLORS.primary} />
                </View>

                <View style={styles.radioInfo}>
                  <Text style={styles.radioTitle}>{title} Radio</Text>
                  <Text style={styles.radioSubtitle} numberOfLines={1}>
                    Endless WebView discovery from {title}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.86}
                  style={styles.radioButton}
                  onPress={openRadio}
                >
                  <Ionicons name="play" size={17} color="#000" />
                  <Text style={styles.radioButtonText}>Start</Text>
                </TouchableOpacity>
              </View>

              {albums.length > 0 && (
                <View style={styles.albumSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Albums</Text>
                    <Text style={styles.sectionSub}>
                      Artist collections from this genre
                    </Text>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.albumRow}
                  >
                    {albums.map((album) => (
                      <TouchableOpacity
                        key={album.id}
                        activeOpacity={0.86}
                        style={styles.albumCard}
                        onPress={() => openAlbum(album)}
                      >
                        <Image
                          source={{ uri: album.thumbnail }}
                          style={styles.albumCover}
                        />

                        <Text style={styles.albumTitle} numberOfLines={2}>
                          {album.album}
                        </Text>

                        <Text style={styles.albumArtist} numberOfLines={1}>
                          {album.artist}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Songs</Text>
                <Text style={styles.sectionSub}>
                  YouTube WebView results for {title}
                </Text>
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="musical-notes-outline"
                size={58}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyTitle}>No tracks found</Text>
              <Text style={styles.emptyText}>
                Check your backend, then tap refresh.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <TouchableOpacity
              activeOpacity={0.86}
              style={styles.trackCard}
              onPress={() => openTrack(item)}
            >
              <Text style={styles.rank}>
                {String(index + 1).padStart(2, "0")}
              </Text>

              <Image
                source={{
                  uri:
                    item.thumbnail ||
                    item.artwork ||
                    item.cover ||
                    FALLBACK_THUMBNAIL,
                }}
                style={styles.cover}
              />

              <View style={styles.info}>
                <Text style={styles.trackTitle} numberOfLines={1}>
                  {item.title || "Unknown Song"}
                </Text>

                <Text style={styles.artist} numberOfLines={1}>
                  {item.artist || item.channelTitle || "Unknown Artist"}
                </Text>

                <View style={styles.metaRow}>
                  <Ionicons name="logo-youtube" size={13} color="#ff3b30" />
                  <Text style={styles.metaText}>YouTube WebView</Text>
                </View>
              </View>

              <View style={styles.playCircle}>
                <Ionicons name="play" size={16} color={COLORS.text} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    paddingTop: 64,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerText: {
    flex: 1,
    marginLeft: 14,
    marginRight: 12,
  },

  kicker: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
  },

  title: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 3,
  },

  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },

  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: COLORS.textMuted,
    marginTop: 14,
    fontSize: 14,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 165,
  },

  radioCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 28,
    marginBottom: 30,
    backgroundColor: "rgba(255,255,255,0.065)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",
  },

  radioIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  radioInfo: {
    flex: 1,
  },

  radioTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },

  radioSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 5,
  },

  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },

  radioButtonText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 5,
  },

  albumSection: {
    marginBottom: 30,
  },

  sectionHeader: {
    marginBottom: 16,
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

  albumRow: {
    gap: 14,
    paddingRight: 20,
  },

  albumCard: {
    width: 145,
  },

  albumCover: {
    width: 145,
    height: 145,
    borderRadius: 26,
    backgroundColor: COLORS.card,
  },

  albumTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 10,
    lineHeight: 18,
  },

  albumArtist: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 5,
  },

  trackCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 26,
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  rank: {
    width: 30,
    color: "rgba(255,255,255,0.32)",
    fontSize: 15,
    fontWeight: "900",
  },

  cover: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: COLORS.card,
  },

  info: {
    flex: 1,
    marginLeft: 14,
  },

  trackTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },

  artist: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 5,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  metaText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 5,
  },

  playCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  empty: {
    height: 420,
    alignItems: "center",
    justifyContent: "center",
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
  },
});