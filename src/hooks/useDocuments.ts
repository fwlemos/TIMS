import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Document } from '@/lib/database.types'

export function useDocuments(entityId?: string, entityType?: string) {
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)

    const fetchDocuments = useCallback(async () => {
        if (!entityId || !entityType) return

        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('entity_id', entityId)
                .eq('entity_type', entityType)
                .order('created_at', { ascending: false })

            if (error) throw error
            setDocuments(data || [])
        } catch (error) {
            console.error('Error fetching documents:', error)
        } finally {
            setLoading(false)
        }
    }, [entityId, entityType])

    const uploadDocument = async (file: File) => {
        if (!entityId || !entityType) return

        setUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
            const filePath = `${entityType}/${entityId}/${fileName}`

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Get Public URL (or signed URL if private, but we used public bucket in setup? No, established private.)
            // Assuming private bucket, we rely on download capabilities. 
            // Ideally we store the path or just construct it.
            // Let's store the full path or public URL. 
            // If private, 'createSignedUrl' is needed for viewing.
            // For invalidation/listing, storing the path is useful.

            const fileUrl = filePath // Store the storage path

            // 3. Insert into Database
            const { error: dbError } = await supabase
                .from('documents')
                .insert({
                    entity_id: entityId,
                    entity_type: entityType,
                    file_name: file.name,
                    file_url: fileUrl,
                    file_size: file.size,
                    mime_type: file.type,
                    uploaded_by: (await supabase.auth.getUser()).data.user?.id
                })

            if (dbError) throw dbError

            await fetchDocuments()
        } catch (error) {
            console.error('Error uploading document:', error)
            throw error
        } finally {
            setUploading(false)
        }
    }

    const deleteDocument = async (document: Document) => {
        try {
            // 1. Delete from Storage
            const { error: storageError } = await supabase.storage
                .from('documents')
                .remove([document.file_url])

            if (storageError) throw storageError

            // 2. Delete from Database
            const { error: dbError } = await supabase
                .from('documents')
                .delete()
                .eq('id', document.id)

            if (dbError) throw dbError

            setDocuments(prev => prev.filter(d => d.id !== document.id))
        } catch (error) {
            console.error('Error deleting document:', error)
            throw error
        }
    }

    const getDownloadUrl = async (path: string) => {
        const { data, error } = await supabase.storage
            .from('documents')
            .createSignedUrl(path, 3600) // 1 hour validity

        if (error) throw error
        return data.signedUrl
    }

    const deleteAllDocuments = async () => {
        if (!entityId || !entityType || documents.length === 0) return

        try {
            // 1. Delete all from Storage
            const fileUrls = documents.map(d => d.file_url)
            if (fileUrls.length > 0) {
                const { error: storageError } = await supabase.storage
                    .from('documents')
                    .remove(fileUrls)
                if (storageError) throw storageError
            }

            // 2. Delete all from Database
            const { error: dbError } = await supabase
                .from('documents')
                .delete()
                .eq('entity_id', entityId)
                .eq('entity_type', entityType)

            if (dbError) throw dbError

            setDocuments([])
        } catch (error) {
            console.error('Error deleting all documents:', error)
            throw error
        }
    }

    return {
        documents,
        loading,
        uploading,
        fetchDocuments,
        uploadDocument,
        deleteDocument,
        getDownloadUrl,
        deleteAllDocuments
    }
}
