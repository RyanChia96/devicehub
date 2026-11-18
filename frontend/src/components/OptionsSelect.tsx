import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

/**
 * Base UI's Select reads `null` as "nothing selected", so an option whose value
 * is the empty string ("All …", "Select …") is carried under this sentinel and
 * translated back before it reaches the caller.
 */
const EMPTY_OPTION = "__empty__";
const toSelectValue = (value: string) => (value === "" ? EMPTY_OPTION : value);
const fromSelectValue = (value: string) => (value === EMPTY_OPTION ? "" : value);

export interface OptionsSelectProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: readonly SelectOption<T>[];
  id?: string;
  /** Form field name; Base UI renders it on a hidden input for form submission
   *  and for error-summary focus lookups. */
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  "aria-label"?: string;
  size?: "sm" | "default";
  /** Layout only (width, margins); the look is the stock shadcn Select. */
  className?: string;
  onBlur?: () => void;
}

/**
 * The stock shadcn Select for a flat list of options. Exists only to spare
 * every call site the items/SelectItem mapping.
 */
export function OptionsSelect<T extends string>({
  value,
  onValueChange,
  options,
  id,
  name,
  placeholder,
  disabled,
  "aria-label": ariaLabel,
  size,
  className,
  onBlur,
}: OptionsSelectProps<T>) {
  const items = options.map((option) => ({
    value: toSelectValue(option.value),
    label: option.label,
  }));
  const hasEmptyOption = options.some((option) => option.value === "");

  return (
    <Select
      items={items}
      name={name}
      disabled={disabled}
      // With no "" option, an empty value means nothing is chosen yet, which
      // is what shows the placeholder.
      value={value === "" && !hasEmptyOption ? null : toSelectValue(value)}
      onValueChange={(next) => {
        if (next === null) return;
        onValueChange(fromSelectValue(String(next)) as T);
      }}
    >
      <SelectTrigger id={id} aria-label={ariaLabel} size={size} className={className} onBlur={onBlur}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={toSelectValue(option.value)}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
