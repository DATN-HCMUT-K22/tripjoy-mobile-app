import {
  BUDGET_MANUAL_MAX_PER_PERSON_VND,
} from "@/data/budgetOptions";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";

const VND_PER_TRIEU = 1_000_000;
const MAX_TRIEU = Math.floor(BUDGET_MANUAL_MAX_PER_PERSON_VND / VND_PER_TRIEU);

type Props = {
  minVnd: number | null;
  maxVnd: number | null;
  onCommit: (minVnd: number | null, maxVnd: number | null) => void;
  /** true khi đang chọn mức gợi ý (card) — không cho nhập tay */
  disabled?: boolean;
};

function vndToTrieuStr(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return "";
  return String(Math.round(v / VND_PER_TRIEU));
}

function parseTrieuInput(s: string): number | null {
  const digits = s.replace(/\D/g, "");
  if (!digits) return null;
  const t = parseInt(digits, 10);
  if (!Number.isFinite(t) || t < 0) return null;
  const clampedT = Math.min(t, MAX_TRIEU);
  return clampedT * VND_PER_TRIEU;
}

export const BudgetManualRange: React.FC<Props> = ({
  minVnd,
  maxVnd,
  onCommit,
  disabled = false,
}) => {
  const [minStr, setMinStr] = useState(() => vndToTrieuStr(minVnd));
  const [maxStr, setMaxStr] = useState(() => vndToTrieuStr(maxVnd));

  useEffect(() => {
    setMinStr(vndToTrieuStr(minVnd));
    setMaxStr(vndToTrieuStr(maxVnd));
  }, [minVnd, maxVnd]);

  const apply = useCallback(() => {
    if (disabled) return;
    const minV = parseTrieuInput(minStr);
    const maxV = parseTrieuInput(maxStr);
    if (minV == null || maxV == null) {
      onCommit(null, null);
      return;
    }
    if (maxV <= minV) {
      onCommit(null, null);
      return;
    }
    onCommit(minV, maxV);
  }, [minStr, maxStr, onCommit, disabled]);

  const showHintError = useMemo(() => {
    const minV = parseTrieuInput(minStr);
    const maxV = parseTrieuInput(maxStr);
    if (!minStr.trim() || !maxStr.trim()) return false;
    if (minV == null || maxV == null) return true;
    return maxV <= minV;
  }, [minStr, maxStr]);

  return (
    <View
      className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3"
      style={{ opacity: disabled ? 0.55 : 1 }}
    >
      <Text
        className={`text-sm font-semibold text-gray-900 ${
          disabled ? "mb-1" : "mb-3"
        }`}
      >
        Hoặc nhập khoảng
      </Text>
      {disabled ? (
        <Text className="text-xs text-gray-500 mb-3">
          Đang chọn mức gợi ý — bỏ chọn card (nhấn lại) để nhập khoảng thủ công.
        </Text>
      ) : null}
      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <Text className="text-[11px] text-gray-600 mb-1">Tối thiểu</Text>
          <TextInput
            value={minStr}
            onChangeText={setMinStr}
            onBlur={apply}
            keyboardType="number-pad"
            placeholder="vd. 0"
            placeholderTextColor="#9CA3AF"
            editable={!disabled}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base text-gray-900"
          />
        </View>
        <Text className="mt-5 text-gray-400">—</Text>
        <View className="flex-1">
          <Text className="text-[11px] text-gray-600 mb-1">Tối đa</Text>
          <TextInput
            value={maxStr}
            onChangeText={setMaxStr}
            onBlur={apply}
            keyboardType="number-pad"
            placeholder="vd. 25"
            placeholderTextColor="#9CA3AF"
            editable={!disabled}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base text-gray-900"
          />
        </View>
      </View>
      {!disabled && showHintError ? (
        <Text className="text-xs text-amber-700 mt-2">
          Kiểm tra lại: số tối đa phải lớn hơn số tối thiểu.
        </Text>
      ) : null}
    </View>
  );
};
