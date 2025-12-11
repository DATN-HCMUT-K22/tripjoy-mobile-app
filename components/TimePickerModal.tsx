import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

type Props = {
  visible: boolean;
  initialStartTime: string;
  initialEndTime: string;
  onClose: () => void;
  onSave: (timeRange: { start: string; end: string }) => void;
};

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
const ITEM_HEIGHT = 44; // ước lượng chiều cao mỗi dòng để scroll chính xác
const VISIBLE_HEIGHT = 180; // chiều cao khung scroll (phù hợp với style hiện tại)

const pad = (n: number) => n.toString().padStart(2, "0");

const parseTime = (value: string) => {
  const [h = "0", m = "0"] = value.split(":");
  const hour = Number(h);
  const minute = Number(m);
  return {
    hour: Number.isFinite(hour) ? hour : 0,
    minute: Number.isFinite(minute) ? minute : 0,
  };
};

const TimePickerModal: React.FC<Props> = ({
  visible,
  initialStartTime,
  initialEndTime,
  onClose,
  onSave,
}) => {
  const [startHour, setStartHour] = useState(8);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(10);
  const [endMinute, setEndMinute] = useState(0);

  const startHourRef = useRef<ScrollView>(null);
  const startMinuteRef = useRef<ScrollView>(null);
  const endHourRef = useRef<ScrollView>(null);
  const endMinuteRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!visible) return;
    const { hour: sHour, minute: sMinute } = parseTime(initialStartTime);
    const { hour: eHour, minute: eMinute } = parseTime(initialEndTime);

    setStartHour(sHour);
    setStartMinute(sMinute);
    setEndHour(eHour);
    setEndMinute(eMinute);

    const minuteIndexStart = Math.max(0, Math.min(11, Math.round(sMinute / 5)));
    const minuteIndexEnd = Math.max(0, Math.min(11, Math.round(eMinute / 5)));

    const scrollToIndex = (
      ref: React.RefObject<ScrollView | null>,
      index: number,
      total: number
    ) => {
      const maxOffset = Math.max(0, total * ITEM_HEIGHT - VISIBLE_HEIGHT);
      const target =
        index * ITEM_HEIGHT - (VISIBLE_HEIGHT / 2 - ITEM_HEIGHT / 2);
      const y = Math.min(Math.max(0, target), maxOffset);
      ref.current?.scrollTo({ y, animated: false });
    };

    requestAnimationFrame(() => {
      scrollToIndex(startHourRef, sHour, hours.length);
      scrollToIndex(startMinuteRef, minuteIndexStart, minutes.length);
      scrollToIndex(endHourRef, eHour, hours.length);
      scrollToIndex(endMinuteRef, minuteIndexEnd, minutes.length);
    });
  }, [visible, initialStartTime, initialEndTime]);

  const hasError = useMemo(() => {
    if (startHour > endHour) return true;
    if (startHour === endHour && startMinute >= endMinute) return true;
    return false;
  }, [startHour, startMinute, endHour, endMinute]);

  const handleSave = () => {
    if (hasError) return;
    onSave({
      start: `${pad(startHour)}:${pad(startMinute)}`,
      end: `${pad(endHour)}:${pad(endMinute)}`,
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
              <View className="flex-row bg-gray-100 rounded-xl p-2">
                <ScrollView
                  ref={startHourRef}
                  style={{ flex: 1, maxHeight: 180 }}
                  showsVerticalScrollIndicator={false}
                >
                  {hours.map((h) => (
                    <TouchableOpacity
                      key={`s-h-${h}`}
                      className={`py-2 rounded-lg items-center ${
                        h === startHour ? "bg-white" : ""
                      }`}
                      onPress={() => setStartHour(h)}
                    >
                      <Text
                        className={`text-base ${
                          h === startHour
                            ? "text-emerald-600 font-bold"
                            : "text-gray-700"
                        }`}
                      >
                        {pad(h)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView
                  ref={startMinuteRef}
                  style={{ flex: 1, maxHeight: 180 }}
                  showsVerticalScrollIndicator={false}
                >
                  {minutes.map((m) => (
                    <TouchableOpacity
                      key={`s-m-${m}`}
                      className={`py-2 rounded-lg items-center ${
                        m === startMinute ? "bg-white" : ""
                      }`}
                      onPress={() => setStartMinute(m)}
                    >
                      <Text
                        className={`text-base ${
                          m === startMinute
                            ? "text-emerald-600 font-bold"
                            : "text-gray-700"
                        }`}
                      >
                        {pad(m)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-600 mb-2">
                Kết thúc
              </Text>
              <View className="flex-row bg-gray-100 rounded-xl p-2">
                <ScrollView
                  ref={endHourRef}
                  style={{ flex: 1, maxHeight: 180 }}
                  showsVerticalScrollIndicator={false}
                >
                  {hours.map((h) => (
                    <TouchableOpacity
                      key={`e-h-${h}`}
                      className={`py-2 rounded-lg items-center ${
                        h === endHour ? "bg-white" : ""
                      }`}
                      onPress={() => setEndHour(h)}
                    >
                      <Text
                        className={`text-base ${
                          h === endHour
                            ? "text-emerald-600 font-bold"
                            : "text-gray-700"
                        }`}
                      >
                        {pad(h)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView
                  ref={endMinuteRef}
                  style={{ flex: 1, maxHeight: 180 }}
                  showsVerticalScrollIndicator={false}
                >
                  {minutes.map((m) => (
                    <TouchableOpacity
                      key={`e-m-${m}`}
                      className={`py-2 rounded-lg items-center ${
                        m === endMinute ? "bg-white" : ""
                      }`}
                      onPress={() => setEndMinute(m)}
                    >
                      <Text
                        className={`text-base ${
                          m === endMinute
                            ? "text-emerald-600 font-bold"
                            : "text-gray-700"
                        }`}
                      >
                        {pad(m)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
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
