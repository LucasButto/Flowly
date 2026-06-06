"use client";
import { TextareaHTMLAttributes, forwardRef } from "react";
import "./Field.scss";

const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextArea({ className = "", rows = 3, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`fl-input fl-textarea ${className}`}
      {...rest}
    />
  );
});

export default TextArea;
