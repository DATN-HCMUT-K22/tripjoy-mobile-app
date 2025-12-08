import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface SimpleCalendarProps {
  onDateRangeSelect?: (start: string, end: string) => void;
  initialStartDate?: string | null;
  initialEndDate?: string | null;
}

export const SimpleCalendar: React.FC<SimpleCalendarProps> = ({
  onDateRangeSelect,
  initialStartDate,
  initialEndDate,
}) => {
  const [selectedStart, setSelectedStart] = useState<string | null>(
    initialStartDate || null
  );
  const [selectedEnd, setSelectedEnd] = useState<string | null>(
    initialEndDate || null
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (initialStartDate) {
      setSelectedStart(initialStartDate);
      const date = new Date(initialStartDate);
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
    if (initialEndDate) {
      setSelectedEnd(initialEndDate);
    }
  }, [initialStartDate, initialEndDate]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const handleDayPress = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(
      currentMonth.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (!selectedStart || (selectedStart && selectedEnd)) {
      // Start new selection
      setSelectedStart(dateStr);
      setSelectedEnd(null);
    } else if (selectedStart && !selectedEnd) {
      // Select end date
      const start = new Date(selectedStart);
      const end = new Date(dateStr);

      if (end < start) {
        // If end is before start, swap them
        setSelectedEnd(selectedStart);
        setSelectedStart(dateStr);
        onDateRangeSelect?.(dateStr, selectedStart);
      } else {
        setSelectedEnd(dateStr);
        onDateRangeSelect?.(selectedStart, dateStr);
      }
    }
  };

  const isInRange = (day: number) => {
    if (!selectedStart) return false;
    const dateStr = `${currentMonth.getFullYear()}-${String(
      currentMonth.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayDate = new Date(dateStr);

    if (selectedStart && selectedEnd) {
      const start = new Date(selectedStart);
      const end = new Date(selectedEnd);
      return dayDate >= start && dayDate <= end;
    } else if (selectedStart) {
      return dateStr === selectedStart;
    }
    return false;
  };

  const isStart = (day: number) => {
    if (!selectedStart) return false;
    const dateStr = `${currentMonth.getFullYear()}-${String(
      currentMonth.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dateStr === selectedStart;
  };

  const isEnd = (day: number) => {
    if (!selectedEnd) return false;
    const dateStr = `${currentMonth.getFullYear()}-${String(
      currentMonth.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dateStr === selectedEnd;
  };

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(currentMonth);

  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  return (
    <View className="bg-white rounded-lg p-4">
      {/* Month Header */}
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={goToPreviousMonth} activeOpacity={0.7}>
          <Ionicons name="chevron-back-outline" size={24} color="#34B27D" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-black">
          {monthNames[month]} {year}
        </Text>
        <TouchableOpacity onPress={goToNextMonth} activeOpacity={0.7}>
          <Ionicons name="chevron-forward-outline" size={24} color="#34B27D" />
        </TouchableOpacity>
      </View>

      {/* Day Names */}
      <View className="flex-row mb-2">
        {dayNames.map((day, index) => (
          <View key={index} className="flex-1 items-center py-2">
            <Text className="text-xs font-semibold text-gray-600">{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View>
        {Array.from({
          length: Math.ceil((daysInMonth + startingDayOfWeek) / 7),
        }).map((_, weekIndex) => (
          <View key={weekIndex} className="flex-row mb-1">
            {Array.from({ length: 7 }).map((_, dayIndex) => {
              const dayNumber =
                weekIndex * 7 + dayIndex - startingDayOfWeek + 1;
              const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;

              if (!isValidDay) {
                return <View key={dayIndex} className="flex-1" />;
              }

              const inRange = isInRange(dayNumber);
              const start = isStart(dayNumber);
              const end = isEnd(dayNumber);

              return (
                <TouchableOpacity
                  key={dayIndex}
                  onPress={() => handleDayPress(dayNumber)}
                  activeOpacity={0.7}
                  className={`flex-1 aspect-square items-center justify-center rounded-lg ${
                    start || end
                      ? "bg-primary"
                      : inRange
                      ? "bg-green-100"
                      : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      start || end
                        ? "text-white"
                        : inRange
                        ? "text-primary"
                        : "text-gray-800"
                    }`}
                  >
                    {dayNumber}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};
