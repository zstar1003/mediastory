
interface SelectCellProps<T extends string> {
  value: T | '';
  onChange: (value: T | '') => void;
  options: readonly T[];
  placeholder?: string;
  className?: string;
}

export function SelectCell<T extends string>({
  value,
  onChange,
  options,
  placeholder = '请选择',
  className = '',
}: SelectCellProps<T>) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T | '')}
      className={`w-full px-2 py-1 rounded border border-transparent hover:border-gray-300
        focus:border-blue-500 focus:outline-none transition-colors cursor-pointer
        bg-transparent ${!value ? 'text-gray-400' : ''} ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
