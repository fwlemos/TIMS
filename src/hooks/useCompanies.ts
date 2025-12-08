import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Company, InsertTables, UpdateTables } from '@/lib/database.types'

export type CompanyFilters = {
    type?: 'company' | 'manufacturer'
}

export function useCompanies(filters?: CompanyFilters) {
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCompanies = useCallback(async () => {
        setLoading(true)
        setError(null)

        let query = supabase
            .from('companies')
            .select('*')
            .is('deleted_at', null)
            .order('name')

        if (filters?.type) {
            if (filters.type === 'company') {
                query = query.or('type.eq.company,type.is.null')
            } else {
                query = query.eq('type', filters.type)
            }
        }

        const { data, error } = await query

        if (error) {
            setError(error.message)
            setCompanies([])
        } else {
            setCompanies(data || [])
        }
        setLoading(false)
    }, [filters?.type])

    useEffect(() => {
        fetchCompanies()
    }, [fetchCompanies])

    const createCompany = async (company: InsertTables<'companies'>) => {
        const { data, error } = await supabase
            .from('companies')
            .insert(company)
            .select()
            .single()

        if (error) throw error
        await fetchCompanies()
        return data
    }

    const updateCompany = async (id: string, updates: UpdateTables<'companies'>) => {
        const { data, error } = await supabase
            .from('companies')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        await fetchCompanies()
        return data
    }

    const deleteCompany = async (id: string) => {
        const { error } = await supabase
            .from('companies')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)

        if (error) throw error
        await fetchCompanies()
    }

    // Manufacturer helpers
    const isContractExpiringSoon = (company: Company): boolean => {
        if (!company.manufacturer_contract_validity) return false
        const validity = new Date(company.manufacturer_contract_validity)
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        return validity <= thirtyDaysFromNow
    }

    const isContractExpired = (company: Company): boolean => {
        if (!company.manufacturer_contract_validity) return false
        return new Date(company.manufacturer_contract_validity) < new Date()
    }

    return {
        companies,
        loading,
        error,
        refetch: fetchCompanies,
        createCompany,
        updateCompany,
        deleteCompany,
        isContractExpiringSoon,
        isContractExpired,
    }
}
