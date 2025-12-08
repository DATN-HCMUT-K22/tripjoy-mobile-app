import { ContactItem } from "@/components/group/ContactItem";
import { mockContacts } from "@/data/mockContacts";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function CreateGroupScreen() {
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [visible, setVisible] = useState(true);
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false);
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").height)
  ).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide up animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: Dimensions.get("window").height,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      router.back();
    });
  };

  const filteredContacts = mockContacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchText.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const toggleContact = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const removeContact = (contactId: string) => {
    setSelectedContacts((prev) => prev.filter((id) => id !== contactId));
  };

  const selectedContactsData = mockContacts.filter((contact) =>
    selectedContacts.includes(contact.id)
  );

  const handleCreate = () => {
    if (groupName.trim() && selectedContacts.length > 0) {
      console.log("Create group:", {
        name: groupName,
        description: groupDescription,
        members: selectedContacts,
      });
      handleClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1 }}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.1)",
              opacity: fadeAnim,
            }}
          />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet */}
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: Dimensions.get("window").height * 0.5,
            backgroundColor: "white",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-black">Nhóm mới</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Group Info Section */}
            <View className="px-4 py-6">
              {/* Avatar and Name Input */}
              <View className="flex-row items-center gap-4 mb-6">
                {/* Avatar Placeholder */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    backgroundColor: "#F3F4F6",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                  }}
                >
                  <Ionicons name="camera-outline" size={28} color="#9CA3AF" />
                </TouchableOpacity>

                {/* Name Input */}
                <View className="flex-1">
                  <TextInput
                    className="text-lg font-medium text-black pb-2 border-b border-gray-300"
                    placeholder="Đặt tên nhóm..."
                    placeholderTextColor="#9CA3AF"
                    value={groupName}
                    onChangeText={setGroupName}
                    underlineColorAndroid="transparent"
                  />
                </View>
              </View>

              {/* Description Input */}
              <View className="mb-6">
                <TextInput
                  className={`text-base text-gray-800 pb-2 ${
                    !isDescriptionFocused
                      ? "border-b border-gray-300"
                      : "border-0"
                  }`}
                  placeholder="Mô tả nhóm (tùy chọn)..."
                  placeholderTextColor="#9CA3AF"
                  value={groupDescription}
                  onChangeText={setGroupDescription}
                  onFocus={() => setIsDescriptionFocused(true)}
                  onBlur={() => setIsDescriptionFocused(false)}
                  multiline
                  underlineColorAndroid="transparent"
                />
              </View>

              {/* Search Bar */}
              <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-3 mb-4">
                <Ionicons name="search-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-2 text-base text-gray-800"
                  placeholder="Tìm tên hoặc email"
                  placeholderTextColor="#9CA3AF"
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>

              {/* Contacts List */}
              <View>
                {filteredContacts.map((contact) => (
                  <ContactItem
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedContacts.includes(contact.id)}
                    onToggle={toggleContact}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Bottom Action Bar */}
          {selectedContacts.length > 0 && (
            <View className="px-4 py-3 bg-white border-t border-gray-200">
              <View className="flex-row items-center justify-between">
                {/* Selected Contacts */}
                <View className="flex-row items-center gap-2 flex-1">
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="flex-1"
                  >
                    <View className="flex-row items-center gap-2">
                      {selectedContactsData.map((contact) => (
                        <View key={contact.id} className="relative">
                          <ExpoImage
                            source={{ uri: contact.avatar }}
                            style={{ width: 40, height: 40, borderRadius: 20 }}
                            contentFit="cover"
                          />
                          <TouchableOpacity
                            onPress={() => removeContact(contact.id)}
                            activeOpacity={0.7}
                            style={{
                              position: "absolute",
                              top: -4,
                              right: -4,
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              backgroundColor: "#EF4444",
                              alignItems: "center",
                              justifyContent: "center",
                              borderWidth: 2,
                              borderColor: "#FFFFFF",
                            }}
                          >
                            <Ionicons name="close" size={12} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Create Button */}
                <TouchableOpacity
                  onPress={handleCreate}
                  activeOpacity={0.8}
                  disabled={!groupName.trim() || selectedContacts.length === 0}
                  style={{
                    backgroundColor:
                      groupName.trim() && selectedContacts.length > 0
                        ? "#34B27D"
                        : "#D1D5DB",
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
