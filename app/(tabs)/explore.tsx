import { useEffect, useState } from "react";
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
import { router } from "expo-router";

import { COLORS, GRADIENTS } from "../../constants/theme";
import { HIDDEN_TUNES_GENRES } from "../../utils/genres";

import {
  getTrendingYouTubeBackend,
  type BackendYouTubeTrack,
} from "../../services/youtubeBackend";

const MOODS = ["Afrobeats", "Amapiano", "Afro Soul", "Dancehall"];

type GenreItem = {
  id: string;
  title: string;
  query: string;
  emoji?: string;
};

function getSafeVideoId(track: BackendYouTubeTrack) {
  return String(track.videoId || track.id || "").replace("youtube-", "").trim();
}

export default function ExploreScreen() {
  const [tracks, setTracks] = useState<BackendYouTubeTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrending();
  }, []);

  async function loadTrending() {
    try {
      setLoading(true);

      const results = await getTrendingYouTubeBackend();
      setTracks(Array.isArray(results) ? results : []);
    } catch (error) {
      console.log("Trending load error:", error);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }

  function openGenre(genre: GenreItem) {
    router.push({
      pathname: "/genre",
      params: {
        id: genre.id,
        title: genre.title,
        query: genre.query,
      },
    } as any);
  }

  function openMood(mood: string) {
    router.push({
      pathname: "/genre",
      params: {
        id: mood.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        title: mood,
        query: `${mood} music`,
      },
    } as any);
  }

  function openTrack(track: BackendYouTubeTrack) {
    const videoId = getSafeVideoId(track);

    if (!videoId) {
      console.log("Missing YouTube videoId:", track);
      return;
    }

    router.push({
      pathname: "/youtube-player",
      params: {
        id: videoId,
        videoId,
        title: track.title,
        artist: track.artist,
        channelTitle: track.channelTitle,
        thumbnail: track.thumbnail,
      },
    } as any);
  }

  const featured = tracks[0];
  const listTracks = tracks.slice(1);

  return (
    <LinearGradient colors={GRADIENTS.main} style={styles.container}>
      <FlatList
        data={listTracks}
        keyExtractor={(item) => item.videoId || item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.topBar}>
              <View>
                <Text style={styles.kicker}>EXPLORE</Text>
                <Text style={styles.heading}>Trending Sounds</Text>
              </View>

              <TouchableOpacity
                style={styles.refreshButton}
                onPress={loadTrending}
                activeOpacity={0.85}
              >
                <Ionicons name="refresh" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {MOODS.map((mood) => (
                <TouchableOpacity
                  key={mood}
                  style={styles.chip}
                  activeOpacity={0.85}
                  onPress={() => openMood(mood)}
                >
                  <Text style={styles.chipText}>{mood}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.genreHeader}>
              <Text style={styles.sectionTitle}>Browse genres</Text>
              <Text style={styles.sectionSub}>
                Albums, singles and deep discovery
              </Text>
            </View>

            <View style={styles.genreGrid}>
              {HIDDEN_TUNES_GENRES.map((genre) => (
                <TouchableOpacity
                  key={genre.id}
                  activeOpacity={0.86}
                  style={styles.genreCard}
                  onPress={() => openGenre(genre as GenreItem)}
                >
                  <Text style={styles.genreEmoji}>{genre.emoji}</Text>

                  <Text numberOfLines={1} style={styles.genreTitle}>
                    {genre.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {loading ? (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>
                  Loading trending music...
                </Text>
              </View>
            ) : featured ? (
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => openTrack(featured)}
                style={styles.heroWrap}
              >
                <Image
                  source={{ uri: featured.thumbnail || featured.artwork }}
                  style={styles.heroImage}
                />

                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.92)"]}
                  style={styles.heroOverlay}
                />

                <View style={styles.heroBadge}>
                  <Ionicons name="flame" size={14} color="#ffcc66" />
                  <Text style={styles.heroBadgeText}>Top pick today</Text>
                </View>

                <View style={styles.heroContent}>
                  <Text style={styles.heroTitle} numberOfLines={2}>
                    {featured.title}
                  </Text>

                  <Text style={styles.heroArtist} numberOfLines={1}>
                    {featured.artist}
                  </Text>

                  <View style={styles.heroAction}>
                    <Ionicons name="play" size={18} color="#000" />
                    <Text style={styles.heroActionText}>Open video</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.empty}>
                <Ionicons
                  name="musical-notes-outline"
                  size={58}
                  color={COLORS.textMuted}
                />
                <Text style={styles.emptyTitle}>No Trending Songs</Text>
                <Text style={styles.emptyText}>
                  Restart backend, then tap refresh.
                </Text>
              </View>
            )}

            {!loading && tracks.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Hot right now</Text>
                <Text style={styles.sectionSub}>
                  WebView-only YouTube discovery
                </Text>
              </View>
            )}
          </>
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity
            activeOpacity={0.86}
            style={styles.trackCard}
            onPress={() => openTrack(item)}
          >
            <Text style={styles.rank}>
              {String(index + 2).padStart(2, "0")}
            </Text>

            <Image
              source={{ uri: item.thumbnail || item.artwork }}
              style={styles.cover}
            />

            <View style={styles.info}>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {item.title}
              </Text>

              <Text style={styles.artist} numberOfLines={1}>
                {item.artist}
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingTop: 68,
    paddingHorizontal: 20,
    paddingBottom: 165,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kicker: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
  },
  heading: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: "900",
    marginTop: 4,
  },
  refreshButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chips: {
    gap: 10,
    paddingTop: 22,
    paddingBottom: 22,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  chipText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  genreHeader: {
    marginTop: 4,
    marginBottom: 14,
  },
  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  genreCard: {
    width: "47%",
    minHeight: 92,
    borderRadius: 24,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.065)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "space-between",
  },
  genreEmoji: {
    fontSize: 26,
  },
  genreTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 12,
  },
  loader: {
    height: 360,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: 14,
    fontSize: 14,
  },
  heroWrap: {
    height: 360,
    borderRadius: 34,
    overflow: "hidden",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 30,
  },
  heroImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroBadge: {
    position: "absolute",
    top: 18,
    left: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  heroBadgeText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 6,
  },
  heroContent: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: 22,
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 31,
  },
  heroArtist: {
    color: COLORS.textMuted,
    fontSize: 15,
    marginTop: 8,
  },
  heroAction: {
    marginTop: 18,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  heroActionText: {
    color: "#000",
    fontWeight: "900",
    marginLeft: 8,
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
    height: 340,
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
  },
});