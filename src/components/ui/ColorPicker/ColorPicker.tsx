"use client";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { PRESET_COLORS } from "@/utils/colors";
import { contrastText } from "@/utils/colors";
import "./ColorPicker.scss";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="fl-colorpicker" role="radiogroup">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={color}
          className="fl-colorpicker__swatch"
          style={{ background: color }}
          onClick={() => onChange(color)}
        >
          {value === color && (
            <CheckRoundedIcon style={{ color: contrastText(color) }} />
          )}
        </button>
      ))}
    </div>
  );
}
