import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from "react-native";
import { formatCurrencyVND } from "@/utils/format";

interface BudgetRangeSliderProps {
  min?: number;
  max?: number;
  onChange: (min?: number, max?: number) => void;
}

export const BudgetRangeSlider: React.FC<BudgetRangeSliderProps> = ({
  min,
  max,
  onChange,
}) => {
  const [minText, setMinText] = useState(min?.toString() || "");
  const [maxText, setMaxText] = useState(max?.toString() || "");

  const handleMinChange = (text: string) => {
    setMinText(text);
    const value = text ? parseInt(text.replace(/[^0-9]/g, "")) : undefined;
    onChange(value, max);
  };

  const handleMaxChange = (text: string) => {
    setMaxText(text);
    const value = text ? parseInt(text.replace(/[^0-9]/g, "")) : undefined;
    onChange(min, value);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Từ (VNĐ)</Text>
          <TextInput
            style={styles.input}
            value={minText}
            onChangeText={handleMinChange}
            placeholder="0"
            keyboardType="number-pad"
            placeholderTextColor="#9CA3AF"
          />
          {minText && (
            <Text style={styles.preview}>
              {formatCurrencyVND(parseInt(minText.replace(/[^0-9]/g, "")) || 0)}
            </Text>
          )}
        </View>

        <Text style={styles.separator}>-</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Đến (VNĐ)</Text>
          <TextInput
            style={styles.input}
            value={maxText}
            onChangeText={handleMaxChange}
            placeholder="∞"
            keyboardType="number-pad"
            placeholderTextColor="#9CA3AF"
          />
          {maxText && (
            <Text style={styles.preview}>
              {formatCurrencyVND(parseInt(maxText.replace(/[^0-9]/g, "")) || 0)}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.quickFilters}>
        <Text style={styles.quickLabel}>Gợi ý:</Text>
        <View style={styles.quickButtons}>
          <QuickButton label="< 5M" onPress={() => onChange(undefined, 5000000)} />
          <QuickButton label="5M - 10M" onPress={() => onChange(5000000, 10000000)} />
          <QuickButton label="10M - 20M" onPress={() => onChange(10000000, 20000000)} />
          <QuickButton label="> 20M" onPress={() => onChange(20000000, undefined)} />
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
  preview: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4,
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
