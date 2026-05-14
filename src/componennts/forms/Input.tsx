import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type InputProps = {
    label: string;
    type?: "text" | 'pin' | 'password';
    placeholder: string;
    value: string | number | undefined|null;
    onChange: (text: string) => void,
    countryCode?: string
}

export const Input = ({
    label,
    type = "text",
    placeholder,
    value,
    onChange,
    countryCode = ''
}: InputProps) => {
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";
    const isPin = type === "pin";

    return (
        <div className="w-full space-y-2">
            {label && (
                <label className="text-sm font-semibold text-slate-900">
                    {label}
                </label>
            )}

            <div className="relative flex flex-row mt-2 gap-2">
                {
                    countryCode && <div className="flex justify-center items-center px-4 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium">
                        +{countryCode}
                    </div>
                }

                <input
                    type={
                        isPassword
                            ? showPassword
                                ? "text"
                                : "password"
                            : isPin
                                ? "password"
                                : type
                    }
                    inputMode={isPin ? "numeric" : undefined}
                    maxLength={isPin ? 6 : undefined}
                    pattern={isPin ? "[0-9]*" : undefined}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => {
                        if (isPin) {
                            const onlyNumbers = e.target.value.replace(/\D/g, "");
                            onChange(onlyNumbers.slice(0, 6));
                        } else {
                            onChange(e.target.value);
                        }
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-[#3f0ee3] focus:ring-2 focus:ring-[#3f0ee3]/20"
                />

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
        </div>
    );
};