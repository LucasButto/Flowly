"use client";
import { InputHTMLAttributes, forwardRef } from "react";
import "./Field.scss";

const TextInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function TextInput({ className = "", ...rest }, ref) {
  return <input ref={ref} className={`fl-input ${className}`} {...rest} />;
});

export default TextInput;
