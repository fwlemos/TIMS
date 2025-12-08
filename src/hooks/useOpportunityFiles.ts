import { useCallback } from 'react'
import { useDocuments } from './useDocuments'
import { supabase } from '@/lib/supabase'
import type { Document } from '@/lib/database.types'

export function useOpportunityFiles(opportunityId: string | undefined) {
    const {
        documents,
        loading,
        uploading,
        fetchDocuments,
        uploadDocument: baseUpload,
        deleteDocument: baseDelete,
        getDownloadUrl
    } = useDocuments(opportunityId, 'opportunity')

    const uploadFile = useCallback(async (file: File) => {
        if (!opportunityId) return

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            throw new Error(`File ${file.name} exceeds 10MB limit`)
        }

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
            'image/png',
            'image/jpeg',
            'image/jpg'
        ]
        if (!allowedTypes.includes(file.type)) {
            // Check extension as fallback if mime type is generic
            const ext = file.name.split('.').pop()?.toLowerCase()
            const allowedExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg']
            if (!ext || !allowedExts.includes(ext)) {
                throw new Error(`File type ${file.type} not allowed`)
            }
        }

        try {
            await baseUpload(file)

            // Log to history
            const { error: historyError } = await supabase
                .from('opportunity_history')
                .insert({
                    opportunity_id: opportunityId,
                    action: 'file_uploaded',
                    field_name: 'attachment',
                    new_value: file.name,
                    user_id: (await supabase.auth.getUser()).data.user?.id
                })

            if (historyError) console.error('Failed to log file upload history:', historyError)

        } catch (error) {
            console.error('Error in uploadFile:', error)
            throw error
        }
    }, [opportunityId, baseUpload])

    const deleteFile = useCallback(async (document: Document) => {
        if (!opportunityId) return

        try {
            await baseDelete(document)

            // Log to history
            const { error: historyError } = await supabase
                .from('opportunity_history')
                .insert({
                    opportunity_id: opportunityId,
                    action: 'file_deleted',
                    field_name: 'attachment',
                    old_value: document.file_name,
                    user_id: (await supabase.auth.getUser()).data.user?.id
                })

            if (historyError) console.error('Failed to log file delete history:', historyError)

        } catch (error) {
            console.error('Error in deleteFile:', error)
            throw error
        }
    }, [opportunityId, baseDelete])

    return {
        files: documents,
        loading,
        uploading,
        refreshFiles: fetchDocuments,
        uploadFile,
        deleteFile,
        getDownloadUrl
    }
}
