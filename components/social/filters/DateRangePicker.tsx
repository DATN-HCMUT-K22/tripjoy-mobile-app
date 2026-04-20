import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onChange: (startDate?: string, endDate?: string) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
}) => {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Chọn ngày";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === "ios");
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split("T")[0];
      onChange(dateStr, endDate);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === "ios");
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split("T")[0];
      onChange(startDate, dateStr);
    }
  };

  const clearStartDate = () => {
    onChange(undefined, endDate);
  };

  const clearEndDate = () => {
    onChange(startDate, undefined);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.dateContainer}>
          <Text style={styles.label}>Từ ngày</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartPicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={18} color="#6B7280" />
            <Text style={[styles.dateText, !startDate && styles.placeholder]}>
              {formatDate(startDate)}
            </Text>
            {startDate && (
              <TouchableOpacity onPress={clearStartDate}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.dateContainer}>
          <Text style={styles.label}>Đến ngày</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndPicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={18} color="#6B7280" />
            <Text style={[styles.dateText, !endDate && styles.placeholder]}>
              {formatDate(endDate)}
            </Text>
            {endDate && (
              <TouchableOpacity onPress={clearEndDate}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={startDate ? new Date(startDate) : new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleStartDateChange}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate ? new Date(endDate) : new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleEndDateChange}
          minimumDate={startDate ? new Date(startDate) : undefined}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  dateContainer: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  placeholder: {
    color: "#9CA3AF",
  },
});
