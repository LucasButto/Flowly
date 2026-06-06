"use client";
import { useTranslations } from "next-intl";
import {
  WEEK_ORDER,
  ALL_DAYS,
  WEEKDAYS_MON_FRI,
  DAY_KEYS,
  type Weekday,
} from "@/types/common";
import type { RoutineFrequency } from "@/types/routine";
import SegmentedControl from "@/components/ui/SegmentedControl/SegmentedControl";
import "./DaySelector.scss";

interface DaySelectorProps {
  days: Weekday[];
  frequency: RoutineFrequency;
  onChange: (days: Weekday[], frequency: RoutineFrequency) => void;
}

export default function DaySelector({
  days,
  frequency,
  onChange,
}: DaySelectorProps) {
  const t = useTranslations("days");
  const tf = useTranslations("frequency");

  const handleFrequency = (freq: RoutineFrequency) => {
    if (freq === "daily") onChange([...ALL_DAYS], "daily");
    else if (freq === "weekdays") onChange([...WEEKDAYS_MON_FRI], "weekdays");
    else onChange(days, "custom");
  };

  const toggleDay = (day: Weekday) => {
    const next = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day];
    onChange(next, "custom");
  };

  return (
    <div className="day-selector">
      <SegmentedControl<RoutineFrequency>
        segments={[
          { value: "daily", label: tf("daily") },
          { value: "weekdays", label: tf("weekdays") },
          { value: "custom", label: tf("custom") },
        ]}
        value={frequency}
        onChange={handleFrequency}
        size="sm"
        fullWidth
      />

      <div className="day-selector__days">
        {WEEK_ORDER.map((day) => (
          <button
            key={day}
            type="button"
            className={`day-selector__day ${
              days.includes(day) ? "day-selector__day--on" : ""
            }`}
            onClick={() => toggleDay(day)}
            aria-pressed={days.includes(day)}
          >
            {t(DAY_KEYS[day])}
          </button>
        ))}
      </div>
    </div>
  );
}
