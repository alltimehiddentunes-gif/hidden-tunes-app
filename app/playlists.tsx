import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import PlaylistArtworkCollage from "../components/PlaylistArtworkCollage";
import { COLORS, GRADIENTS } from "../constants/theme";

type Playlist = {
  id: string;
  name: string;
  tracks: any[];
  artwork?: string | null;
  createdAt?: number;
};

const PLAYLISTS_KEY = "hidden_tunes_playlists";

export default function PlaylistsScreen() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      setLoading(true);

      const saved = await AsyncStorage.getItem(PLAYLISTS_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setPlaylists(parsed);
        }
      }
    } catch (error) {
      console.log("Load playlists error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Playlist }) => {
    const trackCount = item.tracks?.length || 0;

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        style={styles.cardWrapper}
        onPress={() =>
          router.push({
            pathname: "/playlist/[id]",
            params: {
              id: item.id,
            },
          })
        }
      >
        <LinearGradient colors={GRADIENTS.card} style={styles.card}>
          <PlaylistArtworkCollage tracks={item.tracks || []} size={82} />

          <View style={styles.info}>
            <Text numberOfLines={1} style={styles.title}>
              {item.name}
            </Text>

            <Text style={styles.meta}>
              {trackCount} {trackCount === 1 ? "song" : "songs"}
            </Text>
          </View>

          <View style={styles.arrow}>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.textMuted}
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={GRADIENTS.main} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Your Playlists</Text>

        <Text style={styles.subheading}>
          Premium collections for every vibe
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading playlists...</Text>
        </View>
      ) : playlists.length === 0 ? (
        <View style={styles.center}>
          <LinearGradient colors={GRADIENTS.card} style={styles.emptyIcon}>
            <Ionicons name="library" size={42} color={COLORS.textMuted} />
          </LinearGradient>

          <Text style={styles.emptyTitle}>No playlists yet</Text>

          <Text style={styles.emptySubtitle}>
            Start building your Hidden Tunes collection
          </Text>
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    paddingTop: 80,
    paddingHorizontal: 22,
    paddingBottom: 18,
  },

  heading: {
    fontSize: 34,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -1,
  },

  subheading: {
    marginTop: 8,
    fontSize: 15,
    color: COLORS.textMuted,
  },

  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 180,
  },

  cardWrapper: {
    marginBottom: 16,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 26,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  info: {
    flex: 1,
    marginLeft: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },

  meta: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textMuted,
  },

  arrow: {
    marginLeft: 10,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  loadingText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },

  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },

  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
  },

  emptySubtitle: {
    marginTop: 10,
    fontSize: 15,
    textAlign: "center",
    color: COLORS.textMuted,
    lineHeight: 22,
  },
});