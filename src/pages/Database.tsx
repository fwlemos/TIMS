import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'
import { Users, Building2, Package, Factory } from 'lucide-react'
import { ContactsView } from '@/components/database/views/ContactsView'
import { CompaniesView } from '@/components/database/views/CompaniesView'
import { ProductsView } from '@/components/database/views/ProductsView'
import { ManufacturersView } from '@/components/database/views/ManufacturersView'

type TabType = 'contacts' | 'companies' | 'products' | 'manufacturers'

const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'manufacturers', label: 'Manufacturers', icon: Factory },
]

export default function Database() {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState<TabType>('contacts')

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold">{t('database.title')}</h1>
                <p className="text-muted-foreground mt-1">
                    {t('database.description')}
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
                        {t(`database.${tab.id}`)}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'contacts' && <ContactsView />}
                {activeTab === 'companies' && <CompaniesView />}
                {activeTab === 'products' && <ProductsView />}
                {activeTab === 'manufacturers' && <ManufacturersView />}
            </div>
        </div>
    )
}
