import { isInvalidSameDayTimeRange } from "@/utils/timeRange";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import DatePicker from "react-native-date-picker";

type Props = {
  visible: boolean;
  initialStartTime: string;
  initialEndTime: string;
  onClose: () => void;
  onSave: (timeRange: { start: string; end: string }, duration?: number) => void;
};

const pad = (n: number) => n.toString().padStart(2, "0");

const parseTimeToMinutes = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const [hRaw = "", mRaw = ""] = value.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);

  if (!Number.isFinite(h) || !Number.isFinite(m)) return fallback;
  if (h < 0 || h > 23 || m < 0 || m > 59) return fallback;

  return h * 60 + m;
};

const formatMinutes = (minutes: number) => {
  const safe = Math.max(0, Math.min(23 * 60 + 59, minutes));
  const hour = Math.floor(safe / 60);
  const minute = safe % 60;
  return `${pad(hour)}:${pad(minute)}`;
};

const parseTimeToDate = (value: string) => {
  const totalMinutes = parseTimeToMinutes(value, 0);
  const now = new Date();
  const clampedMinutes = Math.min(totalMinutes, 23 * 60 + 59);
  const hour = Math.floor(clampedMinutes / 60);
  const minute = clampedMinutes % 60;

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
    0,
    0
  );
};

const roundToFiveMinutes = (date: Date) => {
  return date;
};

const TimePickerModal: React.FC<Props> = ({
  visible,
  initialStartTime,
  initialEndTime,
  onClose,
  onSave,
}) => {
  const [startTime, setStartTime] = useState<Date>(
    parseTimeToDate(initialStartTime)
  );
  const [endTime, setEndTime] = useState<Date>(parseTimeToDate(initialEndTime));
  const [durationStr, setDurationStr] = useState<string>("60");

  useEffect(() => {
    if (!visible) return;
    const start = parseTimeToDate(initialStartTime);
    const end = parseTimeToDate(initialEndTime);
    setStartTime(start);
    setEndTime(end);
    
    // Calculate initial duration
    const diff = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60));
    setDurationStr(String(Math.round(diff)));
  }, [visible, initialStartTime, initialEndTime]);

  // Update end time when start time or duration changes
  useEffect(() => {
    const dur = parseInt(durationStr, 10) || 0;
    const newEnd = new Date(startTime.getTime() + dur * 60 * 1000);
    setEndTime(newEnd);
  }, [startTime, durationStr]);

  const startMinutes = useMemo(
    () => startTime.getHours() * 60 + startTime.getMinutes(),
    [startTime]
  );
  const endMinutes = useMemo(
    () => endTime.getHours() * 60 + endTime.getMinutes(),
    [endTime]
  );

  const startStr = useMemo(() => formatMinutes(startMinutes), [startMinutes]);
  const endStr = useMemo(() => formatMinutes(endMinutes), [endMinutes]);

  /** Kết thúc phải sau bắt đầu — kiểm tra cả hai chiều (đổi giờ bắt đầu hoặc kết thúc đều bắt lỗi). */
  const hasError = useMemo(
    () => isInvalidSameDayTimeRange(startStr, endStr),
    [startStr, endStr]
  );

  const handleSave = () => {
    if (hasError) return;
    onSave({
      start: startStr,
      end: endStr,
    }, parseInt(durationStr, 10) || 0);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 bg-black/50 items-center justify-center px-4">
        <View className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-xl">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-black">
              Chọn khung giờ
            </Text>
          </View>

          <View className="mb-4 flex-row gap-2">
            <View
              className={`flex-1 rounded-xl border bg-emerald-50 px-3 py-2 ${
                hasError ? "border-red-400" : "border-emerald-200"
              }`}
            >
              <Text className="text-xs text-emerald-700">Bắt đầu</Text>
              <Text className="mt-1 text-base font-bold text-emerald-800">
                {startStr}
              </Text>
            </View>
            <View
              className={`flex-1 rounded-xl border bg-sky-50 px-3 py-2 ${
                hasError ? "border-red-400 border-2" : "border-sky-200"
              }`}
            >
              <Text className="text-xs text-sky-700">Kết thúc</Text>
              <Text className="mt-1 text-base font-bold text-sky-800">
                {endStr}
              </Text>
            </View>
          </View>

          <View className="mb-6">
            <View className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-gray-700">Thời gian bắt đầu</Text>
              <View className="bg-gray-100 rounded-xl p-3 items-center justify-center">
                <DatePicker
                  modal={false}
                  mode="time"
                  locale="vi"
                  minuteInterval={1}
                  date={startTime}
                  onDateChange={setStartTime}
                  is24hourSource="locale"
                />
              </View>
            </View>

            <View className="mb-2">
              <Text className="mb-2 text-sm font-semibold text-gray-700">Thời lượng (phút)</Text>
              <View className="flex-row items-center rounded-xl border border-gray-200 bg-gray-50 p-4">
                <TextInput
                  className="flex-1 text-base text-gray-900"
                  value={durationStr}
                  onChangeText={setDurationStr}
                  keyboardType="numeric"
                  placeholder="Ví dụ: 60"
                />
                <Text className="ml-2 text-gray-400">phút</Text>
              </View>
            </View>
          </View>

          {hasError ? (
            <Text className="mb-3 text-sm text-red-600">
              Giờ kết thúc phải muộn hơn giờ bắt đầu (không được trùng hoặc sớm hơn).
            </Text>
          ) : null}

          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={onClose}
              className="items-center justify-center rounded-xl bg-gray-100 py-4"
              style={{ flex: 1 }}
            >
              <Text className="text-base font-bold text-gray-600">Hủy</Text>
            </TouchableOpacity>
            <View style={{ width: 16 }} />
            <TouchableOpacity
              onPress={handleSave}
              disabled={hasError}
              className={`items-center justify-center rounded-xl py-4 ${
                hasError ? "bg-gray-300" : "bg-primary"
              }`}
              style={{ flex: 1 }}
            >
              <Text className="text-base font-bold text-white">Lưu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default TimePickerModal;
