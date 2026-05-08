import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { Ionicons } from "@expo/vector-icons";

import { router } from "expo-router";

import { COLORS, GRADIENTS } from "../../constants/theme";
import { usePlayer } from "../../context/PlayerContext";

export default function QueueScreen() {
  const {
    songs,
    onlineSongs,
    currentSong,
    isPlaying,
    playSong,
  } = usePlayer();

  const queue = [...onlineSongs, ...songs];

  return (
    <LinearGradient colors={GRADIENTS.main} style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={COLORS.text}
          />
        </TouchableOpacity>

        <View>
          <Text style={styles.title}>Queue</Text>
          <Text style={styles.subtitle}>Your next tracks</Text>
        </View>
      </View>

      <FlatList
        data={queue}
        keyExtractor={(item, index) =>
          item.id ? `queue-${item.id}` : `queue-${index}`
        }
        contentContainerStyle={{ paddingBottom: 180 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const active = currentSong?.id === item.id;

          return (
            <TouchableOpacity
              style={[styles.songRow, active && styles.activeRow]}
              activeOpacity={0.85}
              onPress={() => playSong(item)}
            >
              <Image
                source={
                  typeof item.cover === "string"
                    ? { uri: item.cover }
                    : item.cover
                }
                style={styles.cover}
              />

              <View style={styles.songInfo}>
                <Text
                  numberOfLines={1}
                  style={[styles.songTitle, active && styles.activeText]}
                >
                  {item.title}
                </Text>

                <Text
                  numberOfLines={1}
                  style={styles.songArtist}
                >
                  {item.artist ||
                    item.user?.name ||
                    "Unknown Artist"}
                </Text>
              </View>

              {active && isPlaying ? (
                <Ionicons
                  name="volume-high"
                  size={22}
                  color={COLORS.primary}
                />
              ) : (
                <Ionicons
                  name="play-circle-outline"
                  size={28}
                  color={COLORS.textMuted}
                />
              )}
            </TouchableOpacity>
          );
        }}
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

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,

    backgroundColor: "rgba(15,23,42,0.8)",

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

  songRow: {
    backgroundColor: "rgba(15,23,42,0.7)",

    borderRadius: 22,

    padding: 12,

    marginBottom: 12,

    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "transparent",
  },

  activeRow: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(34,197,94,0.12)",
  },

  cover: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: COLORS.cardLight,
  },

  songInfo: {
    flex: 1,
    marginLeft: 14,
  },

  songTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },

  activeText: {
    color: COLORS.primary,
  },

  songArtist: {
    color: COLORS.textMuted,
    marginTop: 5,
    fontSize: 13,
  },
});