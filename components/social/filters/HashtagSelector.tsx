import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { usePopularHashtags } from "@/hooks/useSocial";

interface HashtagSelectorProps {
  selected?: string;
  onSelect: (hashtag: string) => void;
}

export const HashtagSelector: React.FC<HashtagSelectorProps> = ({
  selected,
  onSelect,
}) => {
  const { data: popularTags = [], isLoading } = usePopularHashtags(20);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#16A34A" />
      </View>
    );
  }

  if (popularTags.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Không có hashtag phổ biến</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={popularTags}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.chip,
              selected === item.name && styles.chipSelected,
            ]}
            onPress={() => onSelect(item.name)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                selected === item.name && styles.chipTextSelected,
              ]}
            >
              #{item.name}
            </Text>
            <Text style={styles.chipCount}>({item.count})</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  listContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipSelected: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  chipText: {
    color: "#0369A1",
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: "#fff",
  },
  chipCount: {
    color: "#0369A1",
    fontSize: 11,
    opacity: 0.7,
  },
});
