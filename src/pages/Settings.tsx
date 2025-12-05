import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'
import { Palette, Globe, Shield, Moon, Sun, Check } from 'lucide-react'
import { AdminPermissions } from '@/components/admin/AdminPermissions'

type SettingsTab = 'appearance' | 'language' | 'permissions'

const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'permissions', label: 'Permissions', icon: Shield },
]

const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
]

export default function Settings() {
    const { t, i18n } = useTranslation()
    const [activeTab, setActiveTab] = useState<SettingsTab>('appearance')
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return document.documentElement.classList.contains('dark')
        }
        return false
    })

    const currentLanguage = i18n.language

    const toggleTheme = (dark: boolean) => {
        setIsDark(dark)
        document.documentElement.classList.toggle('dark', dark)
        localStorage.setItem('theme', dark ? 'dark' : 'light')
    }

    const changeLanguage = (langCode: string) => {
        i18n.changeLanguage(langCode)
    }

    const isLanguageActive = (langCode: string) => {
        return currentLanguage === langCode || currentLanguage.startsWith(langCode.split('-')[0])
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold">{t('settings.title')}</h1>
                <p className="text-muted-foreground mt-1">
                    {t('settings.description')}
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium',
                            'transition-all duration-150',
                            activeTab === tab.id
                                ? 'bg-background text-foreground shadow-soft'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === 'appearance' && (
                <div className="card p-6 max-w-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                            {isDark ? (
                                <Moon className="w-5 h-5 text-primary" />
                            ) : (
                                <Sun className="w-5 h-5 text-primary" />
                            )}
                        </div>
                        <div>
                            <h2 className="font-medium">{t('settings.theme')}</h2>
                            <p className="text-sm text-muted-foreground">
                                Choose between light and dark mode
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => toggleTheme(false)}
                            className={clsx(
                                'flex items-center justify-center gap-2 p-4 rounded-lg border transition-colors',
                                !isDark
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:bg-accent'
                            )}
                        >
                            <Sun className="w-5 h-5" />
                            <span className="font-medium">{t('settings.lightMode')}</span>
                            {!isDark && <Check className="w-4 h-4 text-primary ml-2" />}
                        </button>

                        <button
                            onClick={() => toggleTheme(true)}
                            className={clsx(
                                'flex items-center justify-center gap-2 p-4 rounded-lg border transition-colors',
                                isDark
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:bg-accent'
                            )}
                        >
                            <Moon className="w-5 h-5" />
                            <span className="font-medium">{t('settings.darkMode')}</span>
                            {isDark && <Check className="w-4 h-4 text-primary ml-2" />}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'language' && (
                <div className="card p-6 max-w-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Globe className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-medium">{t('settings.language')}</h2>
                            <p className="text-sm text-muted-foreground">
                                Select your preferred language
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                className={clsx(
                                    'flex items-center justify-between p-3 rounded-lg border transition-colors',
                                    isLanguageActive(lang.code)
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:bg-accent'
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-medium">{lang.nativeName}</span>
                                    <span className="text-sm text-muted-foreground">
                                        {lang.name}
                                    </span>
                                </div>
                                {isLanguageActive(lang.code) && (
                                    <Check className="w-4 h-4 text-primary" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'permissions' && <AdminPermissions />}
        </div>
    )
}
