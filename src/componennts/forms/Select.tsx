
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
        <div className="w-full space-y-2">
            {label && (
                <label className="text-sm font-semibold text-slate-900">
                    {label}
                </label>
            )}
            <select
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full mt-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-[#3f0ee3] focus:ring-2 focus:ring-[#3f0ee3]/20 cursor-pointer"
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