// Date/time picker for scheduling blog posts

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  minDate?: string;
}

export function DateTimePicker({ value, onChange, label, minDate }: DateTimePickerProps) {
  // Format to datetime-local input format (YYYY-MM-DDTHH:mm)
  const formatForInput = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const localDate = e.target.value;
    if (localDate) {
      onChange(new Date(localDate).toISOString());
    } else {
      onChange('');
    }
  };

  const defaultMin = minDate || new Date().toISOString().slice(0, 16);

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <input
        type="datetime-local"
        value={formatForInput(value)}
        onChange={handleChange}
        min={defaultMin}
        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
      />
    </div>
  );
}
