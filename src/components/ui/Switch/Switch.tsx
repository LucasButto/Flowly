"use client";
import "./Switch.scss";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export default function Switch({
  checked,
  onChange,
  label,
  disabled,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`fl-switch ${checked ? "fl-switch--on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="fl-switch__thumb" />
    </button>
  );
}
