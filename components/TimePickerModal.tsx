import { isInvalidSameDayTimeRange } from "@/utils/timeRange";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import DatePicker from "react-native-date-picker";

type Props = {
  visible: boolean;
  initialStartTime: string;
  initialEndTime: string;
  onClose: () => void;
  onSave: (timeRange: { start: string; end: string }) => void;
};

const pad = (n: number) => n.toString().padStart(2, "0");

const parseTimeToMinutes = (value: string, fallback: number) => {
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
  const next = new Date(date);
  next.setSeconds(0, 0);
  return next;
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

  useEffect(() => {
    if (!visible) return;
    setStartTime(parseTimeToDate(initialStartTime));
    setEndTime(parseTimeToDate(initialEndTime));
  }, [visible, initialStartTime, initialEndTime]);

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
    });
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

          <View className="mb-3 flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-2 text-sm font-semibold text-gray-600">
                Bắt đầu
              </Text>
              <View className="bg-gray-100 rounded-xl p-3 items-center justify-center">
                <DatePicker
                  modal={false}
                  mode="time"
                  locale="vi"
                  minuteInterval={1}
                  date={startTime}
                  onDateChange={(value) =>
                    setStartTime(roundToFiveMinutes(value))
                  }
                />
              </View>
            </View>

            <View className="flex-1">
              <Text className="mb-2 text-sm font-semibold text-gray-600">
                Kết thúc
              </Text>
              <View className="rounded-xl bg-gray-100 p-3 items-center justify-center">
                <DatePicker
                  modal={false}
                  mode="time"
                  locale="vi"
                  minuteInterval={1}
                  date={endTime}
                  onDateChange={(value) => setEndTime(roundToFiveMinutes(value))}
                />
              </View>
            </View>
          </View>

          {hasError ? (
            <Text className="mb-3 text-sm text-red-600">
              Giờ kết thúc phải muộn hơn giờ bắt đầu (không được trùng hoặc sớm hơn).
            </Text>
          ) : null}

          <View className="flex-row justify-end gap-2">
            <TouchableOpacity
              onPress={onClose}
              className="px-4 py-3 rounded-xl border border-gray-300"
            >
              <Text className="text-sm font-semibold text-gray-700">Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={hasError}
              className={`px-5 py-3 rounded-xl ${
                hasError ? "bg-gray-300" : "bg-[#34B27D]"
              }`}
              style={{ opacity: hasError ? 0.7 : 1 }}
            >
              <Text
                className={`text-sm font-semibold ${
                  hasError ? "text-gray-600" : "text-white"
                }`}
              >
                Lưu
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default TimePickerModal;
