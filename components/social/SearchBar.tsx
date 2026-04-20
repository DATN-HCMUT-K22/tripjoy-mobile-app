import { Ionicons } from "@expo/vector-icons";
import React, { useState, useCallback } from "react";
import { TextInput, View, TouchableOpacity, StyleSheet } from "react-native";
import debounce from "lodash.debounce";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress: () => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onFilterPress,
  placeholder = "Tìm kiếm bài viết...",
}) => {
  // Local state for immediate UI updates
  const [localValue, setLocalValue] = useState(value);

  // Debounced callback to avoid API spam (300ms delay)
  const debouncedSearch = useCallback(
    debounce((text: string) => {
      onChangeText(text);
    }, 300),
    [onChangeText]
  );

  const handleTextChange = (text: string) => {
    setLocalValue(text);
    debouncedSearch(text);
  };

  const handleClear = () => {
    setLocalValue("");
    onChangeText("");
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchInput}>
        <Ionicons name="search-outline" size={20} color="#9CA3AF" />
        <TextInput
          value={localValue}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          returnKeyType="search"
        />
        {localValue.length > 0 && (
          <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.filterBtn}
        onPress={onFilterPress}
        activeOpacity={0.7}
      >
        <Ionicons name="options-outline" size={24} color="#16A34A" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  searchInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    padding: 0,
  },
  filterBtn: {
    padding: 8,
  },
});
