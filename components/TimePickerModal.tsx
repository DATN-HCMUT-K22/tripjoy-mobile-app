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

const parseTimeToDate = (value: string) => {
  const [h = "0", m = "0"] = value.split(":");
  const now = new Date();
  const hour = Number.isFinite(Number(h)) ? Number(h) : 0;
  const minute = Number.isFinite(Number(m)) ? Number(m) : 0;
  const roundedMinute = Math.min(55, Math.max(0, Math.round(minute / 5) * 5));

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    roundedMinute,
    0,
    0
  );
};

const roundToFiveMinutes = (date: Date) => {
  const next = new Date(date);
  const rounded = Math.round(next.getMinutes() / 5) * 5;
  next.setMinutes(Math.min(55, Math.max(0, rounded)), 0, 0);
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

  const hasError = useMemo(() => {
    return startTime.getTime() >= endTime.getTime();
  }, [startTime, endTime]);

  const handleSave = () => {
    if (hasError) return;
    onSave({
      start: `${pad(startTime.getHours())}:${pad(startTime.getMinutes())}`,
      end: `${pad(endTime.getHours())}:${pad(endTime.getMinutes())}`,
    });
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 bg-black/50 items-center justify-center px-4">
        <View className="w-full rounded-2xl bg-white p-4 shadow-xl max-w-lg">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-black">
              Chọn khung giờ
            </Text>
          </View>

          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-600 mb-2">
                Bắt đầu
              </Text>
              <View className="bg-gray-100 rounded-xl p-3 items-center justify-center">
                <DatePicker
                  modal={false}
                  mode="time"
                  locale="vi"
                  minuteInterval={5}
                  date={startTime}
                  onDateChange={(value) =>
                    setStartTime(roundToFiveMinutes(value))
                  }
                />
              </View>
            </View>

            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-600 mb-2">
                Kết thúc
              </Text>
              <View className="bg-gray-100 rounded-xl p-3 items-center justify-center">
                <DatePicker
                  modal={false}
                  mode="time"
                  locale="vi"
                  minuteInterval={5}
                  date={endTime}
                  onDateChange={(value) =>
                    setEndTime(roundToFiveMinutes(value))
                  }
                />
              </View>
            </View>
          </View>

          {hasError && (
            <Text className="text-sm text-red-500 mb-3">
              Giờ bắt đầu phải nhỏ hơn giờ kết thúc.
            </Text>
          )}

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
