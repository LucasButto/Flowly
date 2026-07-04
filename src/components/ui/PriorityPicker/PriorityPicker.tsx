"use client";
import { useTranslations } from "next-intl";
import Select from "@/components/ui/Field/Select";
import { PRIORITIES, type Priority } from "@/types/common";

interface PriorityPickerProps {
  /** "" = sin prioridad. */
  value: Priority | "";
  onChange: (value: Priority | "") => void;
}

export default function PriorityPicker({
  value,
  onChange,
}: PriorityPickerProps) {
  const tp = useTranslations("priority");

  return (
    <Select value={value} onChange={(v) => onChange(v as Priority | "")}>
      <option value="">{tp("none")}</option>
      {PRIORITIES.map((p) => (
        <option key={p} value={p}>
          {tp(p)}
        </option>
      ))}
    </Select>
  );
}
