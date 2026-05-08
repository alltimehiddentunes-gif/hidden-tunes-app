import { AppSong, usePlayer } from "@/context/PlayerContext";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import WebView from "react-native-webview";

import { COLORS, GRADIENTS } from "@/constants/theme";

type YouTubeQueueItem = {
  id: string;
  title: string;
  artist?: string;
  channelTitle?: string;
  thumbnail?: string;
  sourceName?: "YouTube";
  isOnline?: true;
  type?: "youtube";
};

export default function YouTubePlayerScreen() {
  const { toggleFavorite, isFavorite } = usePlayer();

  const webViewRef = useRef<WebView>(null);

  const { videoId, id, title, channelTitle, artist, thumbnail, queue } =
    useLocalSearchParams<{
      videoId?: string;
      id?: string;
      title: string;
      channelTitle?: string;
      artist?: string;
      thumbnail?: string;
      queue?: string;
    }>();

  const routeVideoId = String(videoId || id || "");

  const parsedQueue = useMemo<YouTubeQueueItem[]>(() => {
    try {
      if (!queue) return [];

      const decoded = JSON.parse(String(queue));
      if (!Array.isArray(decoded)) return [];

      return decoded
        .filter((item) => item?.id || item?.videoId)
        .map((item) => {
          const itemId = String(item.id || item.videoId);

          return {
            id: itemId,
            title: String(item.title || "YouTube Music"),
            artist: String(item.artist || item.channelTitle || "YouTube"),
            channelTitle: String(item.channelTitle || item.artist || "YouTube"),
            thumbnail: String(
              item.thumbnail ||
                item.cover ||
                `https://img.youtube.com/vi/${itemId}/hqdefault.jpg`
            ),
            sourceName: "YouTube",
            isOnline: true,
            type: "youtube",
          };
        });
    } catch (error) {
      console.log("YouTube queue parse error:", error);
      return [];
    }
  }, [queue]);

  const startVideo: YouTubeQueueItem = {
    id: routeVideoId,
    title: String(title || "YouTube Music"),
    artist: String(artist || channelTitle || "YouTube"),
    channelTitle: String(channelTitle || artist || "YouTube"),
    thumbnail: String(
      thumbnail || `https://img.youtube.com/vi/${routeVideoId}/hqdefault.jpg`
    ),
    sourceName: "YouTube",
    isOnline: true,
    type: "youtube",
  };

  const cleanQueue =
    parsedQueue.length > 0 ? parsedQueue : startVideo.id ? [startVideo] : [];

  const startIndex = Math.max(
    cleanQueue.findIndex((item) => item.id === startVideo.id),
    0
  );

  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [reloadKey, setReloadKey] = useState(0);

  const currentVideo = cleanQueue[currentIndex] || startVideo;

  const safeVideoId = String(currentVideo.id || "");
  const safeTitle = String(currentVideo.title || "YouTube Music");
  const safeChannel = String(
    currentVideo.channelTitle || currentVideo.artist || "YouTube"
  );
  const safeThumbnail = String(
    currentVideo.thumbnail ||
      `https://img.youtube.com/vi/${safeVideoId}/hqdefault.jpg`
  );

  const watchUrl = `https://www.youtube.com/watch?v=${safeVideoId}`;

  const favoriteSong: AppSong = {
    id: safeVideoId,
    title: safeTitle,
    artist: safeChannel,
    user: {
      name: safeChannel,
    },
    channelTitle: safeChannel,
    thumbnail: safeThumbnail,
    cover: safeThumbnail,
    sourceName: "YouTube",
    type: "youtube",
    isOnline: true,
  };

  const favoriteActive = isFavorite(favoriteSong);

  async function handleToggleFavorite() {
    if (!safeVideoId) return;
    await toggleFavorite(favoriteSong);
  }

  useEffect(() => {
    const saveYouTubeMini = async () => {
      if (!safeVideoId) return;

      try {
        await AsyncStorage.setItem(
          "hidden_tunes_current_youtube",
          JSON.stringify({
            id: safeVideoId,
            videoId: safeVideoId,
            title: safeTitle,
            channelTitle: safeChannel,
            artist: safeChannel,
            thumbnail: safeThumbnail,
            sourceName: "YouTube",
            isOnline: true,
            type: "youtube",
          })
        );
      } catch (error) {
        console.log("Save YouTube MiniPlayer error:", error);
      }
    };

    saveYouTubeMini();
  }, [safeVideoId, safeTitle, safeChannel, safeThumbnail]);

  const playCurrent = () => {
    setReloadKey((prev) => prev + 1);
  };

  const playNext = () => {
    if (cleanQueue.length === 0) return;

    const nextIndex =
      currentIndex + 1 < cleanQueue.length ? currentIndex + 1 : 0;

    setCurrentIndex(nextIndex);
    setReloadKey((prev) => prev + 1);
  };

  const playPrevious = () => {
    if (cleanQueue.length === 0) return;

    const previousIndex =
      currentIndex - 1 >= 0 ? currentIndex - 1 : cleanQueue.length - 1;

    setCurrentIndex(previousIndex);
    setReloadKey((prev) => prev + 1);
  };

  const openYouTube = async () => {
    if (!safeVideoId) return;

    try {
      await Linking.openURL(watchUrl);
    } catch (error) {
      console.log("Open YouTube error:", error);
    }
  };

  const playerHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <style>
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background: #000;
            overflow: hidden;
          }

          #player {
            width: 100%;
            height: 100%;
            background: #000;
          }
        </style>
      </head>

      <body>
        <div id="player"></div>

        <script src="https://www.youtube.com/iframe_api"></script>

        <script>
          var player;

          function sendToApp(type, data) {
            try {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: type,
                data: data || null
              }));
            } catch (e) {}
          }

          function onYouTubeIframeAPIReady() {
            player = new YT.Player("player", {
              width: "100%",
              height: "100%",
              videoId: "${safeVideoId}",
              playerVars: {
                autoplay: 1,
                controls: 1,
                rel: 0,
                modestbranding: 1,
                playsinline: 1,
                enablejsapi: 1,
                origin: "https://hiddentunes.com"
              },
              events: {
                onReady: function(event) {
                  sendToApp("READY");
                  event.target.playVideo();
                },
                onStateChange: function(event) {
                  sendToApp("STATE_CHANGE", event.data);

                  if (event.data === 0) {
                    sendToApp("ENDED");
                  }
                },
                onError: function(event) {
                  sendToApp("ERROR", event.data);
                }
              }
            });
          }
        </script>
      </body>
    </html>
  `;

  return (
    <LinearGradient colors={GRADIENTS.main} style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={COLORS.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleToggleFavorite}
        >
          <Ionicons
            name={favoriteActive ? "heart" : "heart-outline"}
            size={25}
            color={favoriteActive ? "#ff0066" : COLORS.text}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.playerCard}>
        {safeVideoId ? (
          <WebView
            ref={webViewRef}
            key={`${safeVideoId}-${reloadKey}`}
            source={{ html: playerHtml, baseUrl: "https://hiddentunes.com" }}
            style={styles.webview}
            allowsFullscreenVideo
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            originWhitelist={["*"]}
            thirdPartyCookiesEnabled
            sharedCookiesEnabled
            onMessage={(event) => {
              try {
                const message = JSON.parse(event.nativeEvent.data);

                if (message.type === "ENDED") {
                  playNext();
                }

                if (message.type === "ERROR") {
                  console.log("YouTube player error:", message.data);
                }
              } catch {
                // Ignore invalid WebView messages safely
              }
            }}
          />
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="alert-circle" size={38} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No YouTube video found.</Text>
          </View>
        )}
      </View>

      <View style={styles.infoBox}>
        <Text numberOfLines={3} style={styles.title}>
          {safeTitle}
        </Text>

        <Text numberOfLines={1} style={styles.channel}>
          {safeChannel}
        </Text>

        <TouchableOpacity
          style={styles.favoriteWideButton}
          onPress={handleToggleFavorite}
        >
          <Ionicons
            name={favoriteActive ? "heart" : "heart-outline"}
            size={21}
            color={favoriteActive ? "#ff0066" : COLORS.text}
          />
          <Text style={styles.favoriteWideText}>
            {favoriteActive ? "Added to Favorites" : "Add to Favorites"}
          </Text>
        </TouchableOpacity>

        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.controlButton} onPress={playPrevious}>
            <Ionicons name="play-skip-back" size={25} color={COLORS.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.playButton} onPress={playCurrent}>
            <Ionicons name="play" size={34} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={playNext}>
            <Ionicons name="play-skip-forward" size={25} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <Text style={styles.queueText}>
          {cleanQueue.length > 1
            ? `YouTube queue: ${currentIndex + 1} / ${cleanQueue.length}`
            : "Single YouTube video"}
        </Text>

        <TouchableOpacity style={styles.youtubeButton} onPress={openYouTube}>
          <Ionicons name="logo-youtube" size={22} color="#fff" />
          <Text style={styles.youtubeButtonText}>Watch on YouTube</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          YouTube favorites are saved in your main Hidden Tunes library.
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 58,
    paddingHorizontal: 18,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  favoriteButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  playerCard: {
    width: "100%",
    height: 230,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  webview: {
    flex: 1,
    backgroundColor: "#000",
  },

  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    color: COLORS.textMuted,
    marginTop: 10,
    fontWeight: "700",
  },

  infoBox: {
    marginTop: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 29,
  },

  channel: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 8,
  },

  favoriteWideButton: {
    marginTop: 18,
    height: 50,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  favoriteWideText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 8,
  },

  controlsRow: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },

  controlButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  playButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#ff0033",
    alignItems: "center",
    justifyContent: "center",
  },

  queueText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 14,
  },

  youtubeButton: {
    height: 52,
    borderRadius: 999,
    backgroundColor: "#ff0033",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  youtubeButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    marginLeft: 8,
  },

  note: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 16,
    textAlign: "center",
  },
});