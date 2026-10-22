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
        <div className="w-full">
            {label && (
                <label className="label">
                    {label}
                </label>
            )}

            <div className="relative flex flex-row gap-2">
                {
                    countryCode && <div className="flex justify-center items-center px-3.5 rounded-xl border border-slate-300 bg-slate-50 text-[15px] text-slate-700 font-medium tabular-nums">
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
                    value={value ?? ''}
                    onChange={(e) => {
                        if (isPin) {
                            const onlyNumbers = e.target.value.replace(/\D/g, "");
                            onChange(onlyNumbers.slice(0, 6));
                        } else {
                            onChange(e.target.value);
                        }
                    }}
                    className={`field h-12 ${isPassword ? "pr-11" : ""} ${isPin ? "tracking-[0.4em] tabular-nums" : ""}`}
                />

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
        </div>
    );
};