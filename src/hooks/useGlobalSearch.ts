import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Contact, Company, Product } from '@/lib/database.types'

export interface GlobalSearchResult {
    contacts: (Contact & { company?: { name: string } | null })[]
    companies: Company[]
    products: (Product & { manufacturer?: { name: string } | null })[]
}

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

export function useGlobalSearch() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<GlobalSearchResult>({
        contacts: [],
        companies: [],
        products: [],
    })
    const [isSearching, setIsSearching] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)

    const debounceRef = useRef<NodeJS.Timeout>()

    const search = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < MIN_QUERY_LENGTH) {
            setResults({ contacts: [], companies: [], products: [] })
            setHasSearched(false)
            return
        }

        setIsSearching(true)
        setHasSearched(true)

        try {
            const searchPattern = `%${searchQuery}%`

            // Parallel queries for all entity types
            const [contactsRes, companiesRes, productsRes] = await Promise.all([
                supabase
                    .from('contacts')
                    .select('*, company:companies(name)')
                    .or(`name.ilike.${searchPattern},email.ilike.${searchPattern}`)
                    .is('deleted_at', null)
                    .limit(5),
                supabase
                    .from('companies')
                    .select('*')
                    .or(`name.ilike.${searchPattern},tax_id.ilike.${searchPattern}`)
                    .is('deleted_at', null)
                    .eq('type', 'company') // Exclude manufacturers
                    .limit(5),
                supabase
                    .from('products')
                    .select('*, manufacturer:companies!products_manufacturer_id_fkey(name)')
                    .or(`name.ilike.${searchPattern},ncm.ilike.${searchPattern}`)
                    .is('deleted_at', null)
                    .limit(5),
            ])

            setResults({
                contacts: (contactsRes.data || []) as GlobalSearchResult['contacts'],
                companies: (companiesRes.data || []) as GlobalSearchResult['companies'],
                products: (productsRes.data || []) as GlobalSearchResult['products'],
            })
        } catch (error) {
            console.error('Global search error:', error)
            setResults({ contacts: [], companies: [], products: [] })
        } finally {
            setIsSearching(false)
        }
    }, [])

    // Debounced search effect
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }

        if (query.length >= MIN_QUERY_LENGTH) {
            debounceRef.current = setTimeout(() => {
                search(query)
            }, DEBOUNCE_MS)
        } else {
            setResults({ contacts: [], companies: [], products: [] })
            setHasSearched(false)
        }

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
        }
    }, [query, search])

    const clearSearch = useCallback(() => {
        setQuery('')
        setResults({ contacts: [], companies: [], products: [] })
        setHasSearched(false)
    }, [])

    const totalResults = results.contacts.length + results.companies.length + results.products.length

    return {
        query,
        setQuery,
        results,
        isSearching,
        hasSearched,
        totalResults,
        clearSearch,
    }
}
