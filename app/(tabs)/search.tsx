import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import NeonEQ from "../../components/NeonEQ";

import { COLORS, GRADIENTS } from "../../constants/theme";
import { usePlayer } from "../../context/PlayerContext";

import { searchArchiveAudio } from "../../services/archiveSearch";
import {
  searchYouTubeBackend,
  getYouTubeAudioUrl,
} from "../../services/youtubeBackend";

type SearchType = "all" | "audius" | "archive" | "youtube";

export default function SearchScreen() {
  const { playAudiusTrack, currentSong, isPlaying, togglePlayPause } =
    usePlayer();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [activeSource, setActiveSource] = useState<SearchType>("all");

  const searchTracks = async (
    text: string,
    source: SearchType = activeSource
  ) => {
    setQuery(text);

    if (!text.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);

      let finalResults: any[] = [];

      if (source === "all" || source === "audius") {
        try {
          const response = await fetch(
            `https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(
              text
            )}`
          );

          const json = await response.json();

          const audiusResults = (json.data || []).map((item: any) => ({
            ...item,
            sourceName: "Audius",
            streamUrl: `https://discoveryprovider.audius.co/v1/tracks/${item.id}/stream`,
          }));

          finalResults.push(...audiusResults);
        } catch (error) {
          console.log("Audius search error:", error);
        }
      }

      if (source === "all" || source === "archive") {
        try {
          const archiveResults = await searchArchiveAudio(text);
          finalResults.push(...archiveResults);
        } catch (error) {
          console.log("Archive search error:", error);
        }
      }

      if (source === "all" || source === "youtube") {
        try {
          const youtubeResults = await searchYouTubeBackend(text);
          finalResults.push(...youtubeResults);
        } catch (error) {
          console.log("YouTube backend search error:", error);
        }
      }

      setResults(finalResults);
    } catch (error) {
      console.log("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchTracks("afrobeats");
  }, []);

  const sourceColor = (source?: string) => {
    if (source === "YouTube") return "#ff0033";
    if (source === "Internet Archive") return COLORS.pink;
    return COLORS.primary;
  };

  const getCover = (item: any) => {
    return (
      item.cover ||
      item.thumbnail ||
      item.artwork?.["1000x1000"] ||
      item.artwork?.["480x480"] ||
      item.artwork?.["150x150"] ||
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1000"
    );
  };

  const getArtist = (item: any) => {
    return item.artist || item.channelTitle || item.user?.name || "Unknown Artist";
  };

  const buildYouTubeQueue = () => {
    return results
      .filter((track) => track.sourceName === "YouTube" && track.id)
      .map((track) => ({
        id: String(track.id),
        title: String(track.title || "YouTube Music"),
        artist: String(getArtist(track)),
        channelTitle: String(track.channelTitle || getArtist(track)),
        thumbnail: String(getCover(track)),
      }));
  };

  const handlePress = async (item: any) => {
    const cover = getCover(item);

    if (item.sourceName === "YouTube") {
      try {
        if (isPlaying) {
          await togglePlayPause();
        }

        const streamUrl = await getYouTubeAudioUrl(String(item.id));

        const playableTrack = {
          ...item,
          streamUrl,
          cover,
          artist: getArtist(item),
          channelTitle: item.channelTitle || getArtist(item),
        };

        router.push({
          pathname: "/youtube-player",
          params: {
            videoId: String(item.id),
            title: playableTrack.title || "YouTube Music",
            artist: playableTrack.artist,
            channelTitle: playableTrack.channelTitle,
            streamUrl,
            cover,
            track: JSON.stringify(playableTrack),
            queue: JSON.stringify(buildYouTubeQueue()),
          },
        });
      } catch (error) {
        console.log("YouTube audio extraction error:", error);
      }

      return;
    }

    await playAudiusTrack({
      ...item,
      cover,
      artist: getArtist(item),
    });
  };

  return (
    <LinearGradient colors={GRADIENTS.main} style={styles.container}>
      <View style={styles.glowPurple} />
      <View style={styles.glowCyan} />

      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.title}>Search</Text>
          <Text style={styles.subtitle}>Audius, Archive & YouTube</Text>
        </View>
      </View>

      <View style={styles.searchBorder}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.cyan} />

          <TextInput
            placeholder="Search songs or artists..."
            placeholderTextColor={COLORS.textDim}
            style={styles.input}
            value={query}
            onChangeText={(text) => searchTracks(text, activeSource)}
          />

          {query.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setQuery("");
                setResults([]);
              }}
            >
              <Ionicons name="close-circle" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterRow}>
        {[
          { key: "all", label: "ALL" },
          { key: "audius", label: "AUDIUS" },
          { key: "archive", label: "ARCHIVE" },
          { key: "youtube", label: "YOUTUBE" },
        ].map((item) => {
          const active = activeSource === item.key;

          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterButton, active && styles.filterButtonActive]}
              onPress={() => {
                const source = item.key as SearchType;
                setActiveSource(source);

                if (query.trim()) {
                  searchTracks(query, source);
                }
              }}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Searching streams...</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, index) =>
            item.id
              ? `${item.sourceName || "track"}-${String(item.id)}`
              : `track-${index}`
          }
          contentContainerStyle={{ paddingBottom: 180 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const cover = getCover(item);
            const active =
              currentSong?.id === String(item.id) && item.sourceName !== "YouTube";

            return (
              <TouchableOpacity
                style={[styles.songRow, active && styles.songRowActive]}
                activeOpacity={0.85}
                onPress={() => handlePress(item)}
              >
                <LinearGradient colors={GRADIENTS.neon} style={styles.coverBorder}>
                  <Image source={{ uri: cover }} style={styles.cover} />
                </LinearGradient>

                <View style={styles.songInfo}>
                  <Text numberOfLines={1} style={styles.songTitle}>
                    {item.title}
                  </Text>

                  <Text numberOfLines={1} style={styles.songArtist}>
                    {getArtist(item)}
                  </Text>

                  <View style={styles.metaRow}>
                    <Ionicons
                      name={item.sourceName === "YouTube" ? "logo-youtube" : "radio"}
                      size={14}
                      color={sourceColor(item.sourceName)}
                    />

                    <Text
                      style={[
                        styles.metaText,
                        { color: sourceColor(item.sourceName) },
                      ]}
                    >
                      {item.sourceName || "Audius"}
                    </Text>
                  </View>
                </View>

                {active ? (
                  <View style={styles.eqBox}>
                    <NeonEQ isPlaying={isPlaying} size="small" />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.playButton,
                      item.sourceName === "YouTube" && styles.youtubeButton,
                    ]}
                  >
                    <Ionicons
                      name={item.sourceName === "YouTube" ? "logo-youtube" : "play"}
                      size={20}
                      color="#000"
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
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
    top: 35,
    left: -110,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(168,85,247,0.2)",
  },
  glowCyan: {
    position: "absolute",
    top: 250,
    right: -130,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(34,211,238,0.12)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTextBox: {
    flex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  title: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: "900",
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  searchBorder: {
    borderRadius: 23,
    padding: 1.5,
    backgroundColor: "rgba(168,85,247,0.42)",
    marginBottom: 18,
  },
  searchBox: {
    height: 58,
    borderRadius: 22,
    backgroundColor: "rgba(18,7,31,0.96)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: "700",
  },
  filterRow: {
    flexDirection: "row",
    marginBottom: 18,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  filterButtonActive: {
    backgroundColor: "rgba(168,85,247,0.28)",
  },
  filterText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "900",
  },
  filterTextActive: {
    color: COLORS.text,
  },
  loadingBox: {
    marginTop: 40,
    alignItems: "center",
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: 12,
  },
  songRow: {
    backgroundColor: "rgba(255,255,255,0.055)",
    borderRadius: 26,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  songRowActive: {
    backgroundColor: "rgba(168,85,247,0.13)",
  },
  coverBorder: {
    width: 72,
    height: 72,
    borderRadius: 21,
    padding: 2,
  },
  cover: {
    width: "100%",
    height: "100%",
    borderRadius: 19,
  },
  songInfo: {
    flex: 1,
    marginLeft: 14,
  },
  songTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
  },
  songArtist: {
    color: COLORS.textMuted,
    marginTop: 5,
    fontSize: 13,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 9,
  },
  metaText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "800",
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  youtubeButton: {
    backgroundColor: "#ff0033",
  },
  eqBox: {
    width: 54,
    alignItems: "center",
    justifyContent: "center",
  },
});