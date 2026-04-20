import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from "react-native";

interface DurationFilterProps {
  minDays?: number;
  maxDays?: number;
  onChange: (minDays?: number, maxDays?: number) => void;
}

export const DurationFilter: React.FC<DurationFilterProps> = ({
  minDays,
  maxDays,
  onChange,
}) => {
  const [minText, setMinText] = useState(minDays?.toString() || "");
  const [maxText, setMaxText] = useState(maxDays?.toString() || "");

  const handleMinChange = (text: string) => {
    setMinText(text);
    const value = text ? parseInt(text) : undefined;
    onChange(value, maxDays);
  };

  const handleMaxChange = (text: string) => {
    setMaxText(text);
    const value = text ? parseInt(text) : undefined;
    onChange(minDays, value);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Từ (ngày)</Text>
          <TextInput
            style={styles.input}
            value={minText}
            onChangeText={handleMinChange}
            placeholder="1"
            keyboardType="number-pad"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <Text style={styles.separator}>-</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Đến (ngày)</Text>
          <TextInput
            style={styles.input}
            value={maxText}
            onChangeText={handleMaxChange}
            placeholder="∞"
            keyboardType="number-pad"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <View style={styles.quickFilters}>
        <Text style={styles.quickLabel}>Gợi ý:</Text>
        <View style={styles.quickButtons}>
          <QuickButton label="1-3 ngày" onPress={() => onChange(1, 3)} />
          <QuickButton label="3-7 ngày" onPress={() => onChange(3, 7)} />
          <QuickButton label="7-14 ngày" onPress={() => onChange(7, 14)} />
          <QuickButton label="> 14 ngày" onPress={() => onChange(14, undefined)} />
        </View>
      </View>
    </View>
  );
};

const QuickButton = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <Text style={styles.quickBtn} onPress={onPress}>
    {label}
  </Text>
);

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  inputContainer: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
  },
  separator: {
    fontSize: 18,
    color: "#9CA3AF",
    marginTop: 28,
  },
  quickFilters: {
    marginTop: 16,
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  quickButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickBtn: {
    fontSize: 12,
    color: "#0369A1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#E0F2FE",
    borderRadius: 12,
    overflow: "hidden",
  },
});
