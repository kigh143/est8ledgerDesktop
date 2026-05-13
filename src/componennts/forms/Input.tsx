import { useState } from "react";

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
                <label className="text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}

            <div className="relative flex flex-row mt-2">
                {
                    countryCode && <div className="flex justify-center items-center px-5 rounded-xl border border-gray-300 bg-white ">
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
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-black focus:ring-2 focus:ring-black/10"
                />

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                )}
            </div>
        </div>
    );
};