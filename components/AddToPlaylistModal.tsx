import { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import {
  addTrackToPlaylist,
  createPlaylist,
  getPlaylists,
  HiddenTunesPlaylist,
  PlaylistTrack,
} from "../services/playlistEngine";

type Props = {
  visible: boolean;
  track: PlaylistTrack | null;
  onClose: () => void;
  onAdded?: () => void;
};

export default function AddToPlaylistModal({
  visible,
  track,
  onClose,
  onAdded,
}: Props) {
  const [playlists, setPlaylists] = useState<HiddenTunesPlaylist[]>([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (visible) load();
  }, [visible]);

  const load = async () => {
    const data = await getPlaylists();
    setPlaylists(data);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;

    const playlist = await createPlaylist(newName.trim());

    if (track) {
      await addTrackToPlaylist(playlist.id, track);
    }

    setNewName("");
    await load();
    onAdded?.();
    onClose();
  };

  const handleAdd = async (playlistId: string) => {
    if (!track) return;

    await addTrackToPlaylist(playlistId, track);
    onAdded?.();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Add to Playlist</Text>

            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.createBox}>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="New playlist name"
              placeholderTextColor={COLORS.textMuted}
              style={styles.input}
            />

            <TouchableOpacity onPress={handleCreate} style={styles.createBtn}>
              <Ionicons name="add" size={20} color="#000" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={playlists}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.empty}>No playlists yet. Create one above.</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.playlistRow}
                onPress={() => handleAdd(item.id)}
              >
                <View style={styles.playlistIcon}>
                  <Ionicons name="list" size={22} color={COLORS.primary} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.playlistName}>{item.name}</Text>
                  <Text style={styles.playlistCount}>
                    {item.tracks.length} songs
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: "78%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
  },
  createBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 8,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  createBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  playlistRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    gap: 12,
  },
  playlistIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  playlistName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  playlistCount: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  empty: {
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 30,
  },
});