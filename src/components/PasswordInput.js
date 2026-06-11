import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({
  id,
  className = 'form-control',
  value,
  onChange,
  placeholder,
  required,
  autoComplete,
  disabled = false
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="input-group">
      <input
        type={visible ? 'text' : 'password'}
        id={id}
        className={className}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        disabled={disabled}
      />
      <button
        type="button"
        className="input-group__suffix"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </button>
    </div>
  );
}
