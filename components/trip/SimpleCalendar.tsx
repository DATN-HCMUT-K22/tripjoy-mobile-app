import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Ngày local từ năm, tháng 0–11, ngày trong tháng */
function calendarDate(year: number, monthIndex: number, day: number): Date {
  return startOfDay(new Date(year, monthIndex, day));
}

/** Parse `YYYY-MM-DD` theo giờ local (tránh lệch ngày so với UTC). */
function parseISODateLocal(iso: string): Date {
  const parts = iso.trim().split("-");
  if (parts.length === 3) {
    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);
    if (
      Number.isFinite(y) &&
      Number.isFinite(m) &&
      Number.isFinite(d)
    ) {
      return startOfDay(new Date(y, m, d));
    }
  }
  return startOfDay(new Date(iso));
}

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
  const [currentMonth, setCurrentMonth] = useState(() => {
    const t = startOfDay(new Date());
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });

  useEffect(() => {
    const today = startOfDay(new Date());
    const parse = (s: string) => parseISODateLocal(s);

    let start: string | null = null;
    let end: string | null = null;

    if (initialStartDate && parse(initialStartDate) >= today) {
      start = initialStartDate;
    }
    if (initialEndDate && parse(initialEndDate) >= today) {
      end = initialEndDate;
    }
    if (start && end && parse(end) < parse(start)) {
      end = null;
    }

    setSelectedStart(start);
    setSelectedEnd(end);

    if (start) {
      const d = new Date(start);
      const first = new Date(d.getFullYear(), d.getMonth(), 1);
      const firstThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setCurrentMonth(first < firstThisMonth ? firstThisMonth : first);
    } else {
      setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
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
    const today = startOfDay(new Date());
    const pressed = calendarDate(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    if (pressed < today) return;

    const dateStr = `${currentMonth.getFullYear()}-${String(
      currentMonth.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (!selectedStart || (selectedStart && selectedEnd)) {
      // Start new selection
      setSelectedStart(dateStr);
      setSelectedEnd(null);
    } else if (selectedStart && !selectedEnd) {
      // Select end date
      const start = parseISODateLocal(selectedStart);
      const end = parseISODateLocal(dateStr);

      if (end < today || start < today) return;

      if (end < start) {
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
    const dayDate = parseISODateLocal(dateStr);

    if (selectedStart && selectedEnd) {
      const start = parseISODateLocal(selectedStart);
      const end = parseISODateLocal(selectedEnd);
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

  const today = startOfDay(new Date());
  const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstOfViewMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  );
  const canGoToPreviousMonth = firstOfViewMonth > firstOfThisMonth;

  const goToPreviousMonth = () => {
    if (!canGoToPreviousMonth) return;
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
        <TouchableOpacity
          onPress={goToPreviousMonth}
          activeOpacity={canGoToPreviousMonth ? 0.7 : 1}
          disabled={!canGoToPreviousMonth}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={canGoToPreviousMonth ? "#34B27D" : "#D1D5DB"}
          />
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
              const cellDate = calendarDate(year, month, dayNumber);
              const isPast = cellDate < today;

              return (
                <TouchableOpacity
                  key={dayIndex}
                  onPress={() => handleDayPress(dayNumber)}
                  activeOpacity={isPast ? 1 : 0.7}
                  disabled={isPast}
                  className={`flex-1 aspect-square items-center justify-center rounded-lg ${
                    isPast
                      ? "bg-gray-50"
                      : start || end
                        ? "bg-primary"
                        : inRange
                          ? "bg-green-100"
                          : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      isPast
                        ? "text-gray-300"
                        : start || end
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
