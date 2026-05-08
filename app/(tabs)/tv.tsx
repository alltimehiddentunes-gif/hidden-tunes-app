import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, GRADIENTS } from "@/constants/theme";
import { fetchChannelVideos, YouTubeVideo } from "@/services/youtube";

export default function HiddenTunesTVScreen() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await fetchChannelVideos();
      setVideos(data);
    } catch (error) {
      console.log("Hidden Tunes TV load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const openVideo = async (videoId: string) => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.log("Open video error:", error);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  return (
    <LinearGradient colors={GRADIENTS.main} style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Hidden Tunes TV</Text>
          <Text style={styles.subtitle}>Latest videos from your channel</Text>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={loadVideos}>
          <Ionicons name="refresh" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading Hidden Tunes TV...</Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 170 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.videoCard}
              onPress={() => openVideo(item.id)}
            >
              <View style={styles.thumbnailBox}>
                <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />

                <View style={styles.playOverlay}>
                  <Ionicons name="play" size={30} color="#fff" />
                </View>

                <View style={styles.badge}>
                  <Ionicons name="logo-youtube" size={14} color="#fff" />
                  <Text style={styles.badgeText}>TV</Text>
                </View>
              </View>

              <View style={styles.videoInfo}>
                <Text numberOfLines={2} style={styles.videoTitle}>
                  {item.title}
                </Text>

                <Text numberOfLines={1} style={styles.channel}>
                  {item.channelTitle}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="tv-outline" size={42} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No videos found.</Text>
            </View>
          }
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: "900",
  },

  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 5,
  },

  refreshButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingBox: {
    marginTop: 80,
    alignItems: "center",
  },

  loadingText: {
    color: COLORS.textMuted,
    marginTop: 14,
    fontWeight: "700",
  },

  videoCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 26,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  thumbnailBox: {
    width: "100%",
    height: 190,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#111",
  },

  thumbnail: {
    width: "100%",
    height: "100%",
  },

  playOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 64,
    height: 64,
    borderRadius: 32,
    marginLeft: -32,
    marginTop: -32,
    backgroundColor: "rgba(255,0,51,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },

  badge: {
    position: "absolute",
    right: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,0,51,0.95)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 5,
  },

  videoInfo: {
    paddingTop: 14,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },

  videoTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },

  channel: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 6,
  },

  emptyBox: {
    marginTop: 90,
    alignItems: "center",
  },

  emptyText: {
    color: COLORS.textMuted,
    marginTop: 12,
    fontWeight: "700",
  },
});