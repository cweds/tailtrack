import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control, FieldPath, FieldValues } from "react-hook-form";

interface BaseFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
}

interface TextFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  type: "text";
  placeholder?: string;
}

interface SelectFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  type: "select";
  placeholder?: string;
  options: { value: string; label: string }[];
}

type FormFieldWrapperProps<T extends FieldValues> = TextFieldProps<T> | SelectFieldProps<T>;

export function FormFieldWrapper<T extends FieldValues>(props: FormFieldWrapperProps<T>) {
  const { control, name, label, type } = props;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {type === "text" ? (
              <Input 
                placeholder={props.placeholder || `Enter ${label.toLowerCase()}`} 
                {...field} 
              />
            ) : (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder={props.placeholder || `Select ${label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {props.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}