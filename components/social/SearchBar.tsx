import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TextInput, View } from "react-native";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (text: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Tìm kiếm bài đăng...",
  onSearch,
}) => {
  const [searchText, setSearchText] = React.useState("");

  const handleSearch = (text: string) => {
    setSearchText(text);
    onSearch?.(text);
  };

  return (
    <View className="px-4 py-2 bg-white">
      <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          className="flex-1 ml-2 text-base text-gray-800"
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={handleSearch}
        />
      </View>
    </View>
  );
};
