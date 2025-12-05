import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Contact, InsertTables, UpdateTables } from '@/lib/database.types'

export function useContacts() {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchContacts = useCallback(async () => {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
            .from('contacts')
            .select('*, company:companies(id, name)')
            .is('deleted_at', null)
            .order('name')

        if (error) {
            setError(error.message)
            setContacts([])
        } else {
            setContacts(data || [])
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchContacts()
    }, [fetchContacts])

    const createContact = async (contact: InsertTables<'contacts'>) => {
        const { data, error } = await supabase
            .from('contacts')
            .insert(contact)
            .select()
            .single()

        if (error) throw error
        await fetchContacts()
        return data
    }

    const updateContact = async (id: string, updates: UpdateTables<'contacts'>) => {
        const { data, error } = await supabase
            .from('contacts')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        await fetchContacts()
        return data
    }

    const deleteContact = async (id: string) => {
        // Soft delete
        const { error } = await supabase
            .from('contacts')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)

        if (error) throw error
        await fetchContacts()
    }

    return {
        contacts,
        loading,
        error,
        refetch: fetchContacts,
        createContact,
        updateContact,
        deleteContact,
    }
}
