import FormField, { getFieldDescriptionIds } from '../FormField/FormField';

function TextField({
  id,
  name,
  label,
  value,
  onChange,
  error,
  hint,
  optional = false,
  multiline = false,
  rows = 4,
  maxLength,
  showCounter = false,
  type = 'text',
  ...inputProps
}) {
  const Control = multiline ? 'textarea' : 'input';

  return (
    <FormField
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      length={showCounter ? value.length : undefined}
      maxLength={showCounter ? maxLength : undefined}
    >
      <Control
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        className="form-control"
        aria-invalid={error ? true : undefined}
        aria-required={optional ? undefined : 'true'}
        aria-describedby={getFieldDescriptionIds(id, { hint, error })}
        {...(multiline ? { rows } : { type })}
        {...inputProps}
      />
    </FormField>
  );
}

export default TextField;
