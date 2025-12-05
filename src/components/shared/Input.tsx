import { forwardRef, InputHTMLAttributes, useState } from 'react'
import { clsx } from 'clsx'
import { Eye, EyeOff } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    hint?: string
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, hint, leftIcon, rightIcon, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false)
        const isPassword = type === 'password'

        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium mb-1.5">
                        {label}
                        {props.required && <span className="text-destructive ml-1">*</span>}
                    </label>
                )}

                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {leftIcon}
                        </div>
                    )}

                    <input
                        type={isPassword && showPassword ? 'text' : type}
                        className={clsx(
                            'input',
                            leftIcon && 'pl-10',
                            (rightIcon || isPassword) && 'pr-10',
                            error && 'border-destructive focus-visible:ring-destructive',
                            className
                        )}
                        ref={ref}
                        {...props}
                    />

                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </button>
                    )}

                    {rightIcon && !isPassword && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {rightIcon}
                        </div>
                    )}
                </div>

                {error && (
                    <p className="text-destructive text-sm mt-1.5">{error}</p>
                )}

                {hint && !error && (
                    <p className="text-muted-foreground text-sm mt-1.5">{hint}</p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'
