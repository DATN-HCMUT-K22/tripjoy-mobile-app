import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { GetPostsParams } from "@/services/social";
import { HashtagSelector } from "./HashtagSelector";
import { BudgetRangeSlider } from "./BudgetRangeSlider";
import { DateRangePicker } from "./DateRangePicker";
import { DurationFilter } from "./DurationFilter";
import { PeopleCountFilter } from "./PeopleCountFilter";

interface FilterModalProps {
  visible: boolean;
  filters: GetPostsParams;
  onApply: (filters: GetPostsParams) => void;
  onClose: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  filters,
  onApply,
  onClose,
}) => {
  const [localFilters, setLocalFilters] = useState<GetPostsParams>(filters);

  // Sync local filters when modal opens
  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    setLocalFilters({});
    onApply({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bộ lọc</Text>
          <View style={styles.closeButton} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hashtag Selection */}
          <FilterSection title="Hashtag">
            <HashtagSelector
              selected={localFilters.hashtag}
              onSelect={(tag) =>
                setLocalFilters((prev) => ({ ...prev, hashtag: tag }))
              }
            />
          </FilterSection>

          {/* Budget Range */}
          <FilterSection title="Ngân sách">
            <BudgetRangeSlider
              min={localFilters.min_budget}
              max={localFilters.max_budget}
              onChange={(min, max) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  min_budget: min,
                  max_budget: max,
                }))
              }
            />
          </FilterSection>

          {/* Date Range */}
          <FilterSection title="Thời gian">
            <DateRangePicker
              startDate={localFilters.start_date}
              endDate={localFilters.end_date}
              onChange={(start, end) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  start_date: start,
                  end_date: end,
                }))
              }
            />
          </FilterSection>

          {/* Duration */}
          <FilterSection title="Thời lượng">
            <DurationFilter
              minDays={localFilters.min_days}
              maxDays={localFilters.max_days}
              onChange={(min, max) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  min_days: min,
                  max_days: max,
                }))
              }
            />
          </FilterSection>

          {/* People Count */}
          <FilterSection title="Số người">
            <PeopleCountFilter
              min={localFilters.min_people}
              max={localFilters.max_people}
              onChange={(min, max) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  min_people: min,
                  max_people: max,
                }))
              }
            />
          </FilterSection>
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>Xóa bộ lọc</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApply}
            activeOpacity={0.7}
          >
            <Text style={styles.applyButtonText}>Áp dụng</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const FilterSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16A34A",
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});
