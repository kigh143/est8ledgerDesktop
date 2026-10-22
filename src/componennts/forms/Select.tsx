
type SelectProps = {
    label: string;
    options: any[];
    value: string | number | null;
    onChange: (text: string | number) => void;
    placeholder: string,
}

export const Select = ({
    label,
    options = [],
    value,
    onChange,
    placeholder = "Select option",
}: SelectProps) => {
    return (
        <div className="w-full">
            {label && (
                <label className="label">
                    {label}
                </label>
            )}
            <select
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                className="field h-12 cursor-pointer"
            >
                <option value="">{placeholder}</option>

                {options.map((option, index) => (
                    <option key={index} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};