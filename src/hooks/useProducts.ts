import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product, InsertTables, UpdateTables } from '@/lib/database.types'

export function useProducts() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchProducts = useCallback(async () => {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
            .from('products')
            .select('*, manufacturer:companies!manufacturer_id(id, name)')
            .is('deleted_at', null)
            .order('name')

        if (error) {
            setError(error.message)
            setProducts([])
        } else {
            setProducts(data || [])
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

    const createProduct = async (product: InsertTables<'products'>) => {
        const { data, error } = await supabase
            .from('products')
            .insert(product)
            .select()
            .single()

        if (error) throw error
        await fetchProducts()
        return data
    }

    const updateProduct = async (id: string, updates: UpdateTables<'products'>) => {
        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        await fetchProducts()
        return data
    }

    const deleteProduct = async (id: string) => {
        const { error } = await supabase
            .from('products')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)

        if (error) throw error
        await fetchProducts()
    }

    return {
        products,
        loading,
        error,
        refetch: fetchProducts,
        createProduct,
        updateProduct,
        deleteProduct,
    }
}
