
type SelectProps = {
    label: string;
    options: any[];
    value: string;
    onChange: (text: string) => void;
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
        <div className="w-full space-y-2">
            {label && (
                <label className="text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full mt-2 rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10"
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