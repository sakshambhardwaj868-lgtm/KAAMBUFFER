import React from 'react';

interface CurrencyInputProps {
  id: string;
  label: string;
  hinglish?: string;
  value: number;
  onChange: (val: number) => void;
  onBlur?: () => void;
  placeholder?: string;
  helpText?: string;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  required?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  id,
  label,
  hinglish,
  value,
  onChange,
  onBlur,
  placeholder = '0',
  helpText,
  error,
  min = 0,
  max,
  step = 10,
  disabled = false,
  required = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(0);
      return;
    }
    const parsed = parseFloat(raw);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      onChange(parsed);
    }
  };

  const describedBy = [
    helpText ? `${id}-help` : null,
    error ? `${id}-error` : null,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full flex flex-col gap-1.5">
      <div className="flex flex-col">
        <label
          htmlFor={id}
          className="text-xs font-bold text-slate-200 flex items-center justify-between"
        >
          <span>{label}</span>
          {required && (
            <span className="text-[10px] font-bold text-rose-400 ml-1">
              *Required
            </span>
          )}
        </label>
        {hinglish && (
          <span className="text-[11px] text-slate-400 font-medium mt-0.5">
            {hinglish}
          </span>
        )}
      </div>

      <div className="relative rounded-xl shadow-xs">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5"
        >
          <span className={`font-bold text-base select-none ${error ? 'text-rose-400' : 'text-emerald-400'}`}>
            ₹
          </span>
        </div>
        <input
          id={id}
          name={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value === 0 ? '' : value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`num-figure block w-full rounded-xl border bg-[#0D121F] pl-8 pr-4 py-3 text-white font-bold text-base sm:text-lg touch-target transition-all placeholder:text-slate-600 ${
            error
              ? 'border-rose-500/80 focus:border-rose-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20'
              : 'border-white/10 hover:border-white/20 focus:border-emerald-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-400/20'
          } disabled:bg-slate-900/50 disabled:text-slate-500`}
        />
      </div>

      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-semibold text-rose-400 mt-0.5 flex items-center gap-1">
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      ) : helpText ? (
        <p id={`${id}-help`} className="text-[11px] text-slate-400 mt-0.5">
          {helpText}
        </p>
      ) : null}
    </div>
  );
};
