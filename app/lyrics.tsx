import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { COLORS, GRADIENTS } from "../constants/theme";

export default function LyricsScreen() {
  const params = useLocalSearchParams<{
    title?: string;
    artist?: string;
    lyrics?: string;
  }>();

  const title = params.title || "Unknown Song";

  const artist = params.artist || "Unknown Artist";

  const lyricsText =
    params.lyrics ||
    "No lyrics available for this track yet.";

  const lyricsLines = lyricsText.split("\n");

  return (
    <LinearGradient colors={GRADIENTS.main} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="chevron-back"
            size={26}
            color={COLORS.text}
          />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>
            Lyrics
          </Text>

          <Text style={styles.headerSubtitle}>
            Hidden Tunes
          </Text>
        </View>

        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.songInfo}>
          <Text style={styles.songTitle}>
            {title}
          </Text>

          <Text style={styles.artistName}>
            {artist}
          </Text>
        </View>

        <View style={styles.lyricsCard}>
          {lyricsLines.map((line, index) =>
            line.trim() === "" ? (
              <View
                key={index}
                style={styles.lineBreak}
              />
            ) : (
              <Text
                key={index}
                style={styles.lyricLine}
              >
                {line}
              </Text>
            )
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 58,
  },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },

  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },

  placeholder: {
    width: 42,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  songInfo: {
    marginTop: 10,
    marginBottom: 26,
  },

  songTitle: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  artistName: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },

  lyricsCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 30,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  lyricLine: {
    color: COLORS.text,
    fontSize: 22,
    lineHeight: 38,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  lineBreak: {
    height: 22,
  },
});