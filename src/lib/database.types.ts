export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            companies: {
                Row: {
                    address: string | null
                    created_at: string
                    deleted_at: string | null
                    email: string | null
                    id: string
                    manufacturer_catalog_url: string | null
                    manufacturer_contract_url: string | null
                    manufacturer_contract_validity: string | null
                    manufacturer_exclusivity: boolean | null
                    manufacturer_exclusivity_letter_url: string | null
                    manufacturer_primary_ncm: string | null
                    manufacturer_product_categories: string[] | null
                    metadata: Json | null
                    name: string
                    observation: string | null
                    phone: string | null
                    tax_id: string | null
                    type: string | null
                    updated_at: string
                    website: string | null
                }
                Insert: {
                    address?: string | null
                    created_at?: string
                    deleted_at?: string | null
                    email?: string | null
                    id?: string
                    manufacturer_catalog_url?: string | null
                    manufacturer_contract_url?: string | null
                    manufacturer_contract_validity?: string | null
                    manufacturer_exclusivity?: boolean | null
                    manufacturer_exclusivity_letter_url?: string | null
                    manufacturer_primary_ncm?: string | null
                    manufacturer_product_categories?: string[] | null
                    metadata?: Json | null
                    name: string
                    observation?: string | null
                    phone?: string | null
                    tax_id?: string | null
                    type?: string | null
                    updated_at?: string
                    website?: string | null
                }
                Update: {
                    address?: string | null
                    created_at?: string
                    deleted_at?: string | null
                    email?: string | null
                    id?: string
                    manufacturer_catalog_url?: string | null
                    manufacturer_contract_url?: string | null
                    manufacturer_contract_validity?: string | null
                    manufacturer_exclusivity?: boolean | null
                    manufacturer_exclusivity_letter_url?: string | null
                    manufacturer_primary_ncm?: string | null
                    manufacturer_product_categories?: string[] | null
                    metadata?: Json | null
                    name?: string
                    observation?: string | null
                    phone?: string | null
                    tax_id?: string | null
                    type?: string | null
                    updated_at?: string
                    website?: string | null
                }
                Relationships: []
            }
            contacts: {
                Row: {
                    company_id: string | null
                    created_at: string
                    deleted_at: string | null
                    email: string | null
                    id: string
                    job_title: string | null
                    metadata: Json | null
                    name: string
                    observation: string | null
                    phone: string | null
                    updated_at: string
                }
                Insert: {
                    company_id?: string | null
                    created_at?: string
                    deleted_at?: string | null
                    email?: string | null
                    id?: string
                    job_title?: string | null
                    metadata?: Json | null
                    name: string
                    observation?: string | null
                    phone?: string | null
                    updated_at?: string
                }
                Update: {
                    company_id?: string | null
                    created_at?: string
                    deleted_at?: string | null
                    email?: string | null
                    id?: string
                    job_title?: string | null
                    metadata?: Json | null
                    name?: string
                    observation?: string | null
                    phone?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "contacts_company_id_fkey"
                        columns: ["company_id"]
                        isOneToOne: false
                        referencedRelation: "companies"
                        referencedColumns: ["id"]
                    }
                ]
            }
            documents: {
                Row: {
                    created_at: string
                    deleted_at: string | null
                    description: string | null
                    document_type: string | null
                    entity_id: string
                    entity_type: string
                    file_name: string
                    file_size: number | null
                    file_url: string
                    id: string
                    metadata: Json | null
                    mime_type: string | null
                    uploaded_by: string | null
                }
                Insert: {
                    created_at?: string
                    deleted_at?: string | null
                    description?: string | null
                    document_type?: string | null
                    entity_id: string
                    entity_type: string
                    file_name: string
                    file_size?: number | null
                    file_url: string
                    id?: string
                    metadata?: Json | null
                    mime_type?: string | null
                    uploaded_by?: string | null
                }
                Update: {
                    created_at?: string
                    deleted_at?: string | null
                    description?: string | null
                    document_type?: string | null
                    entity_id?: string
                    entity_type?: string
                    file_name?: string
                    file_size?: number | null
                    file_url?: string
                    id?: string
                    metadata?: Json | null
                    mime_type?: string | null
                    uploaded_by?: string | null
                }
                Relationships: []
            }

            lost_reasons: {
                Row: {
                    id: string
                    reason: string
                    is_predefined: boolean
                    is_active: boolean
                    sort_order: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    reason: string
                    is_predefined?: boolean
                    is_active?: boolean
                    sort_order?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    reason?: string
                    is_predefined?: boolean
                    is_active?: boolean
                    sort_order?: number
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }

            opportunity_activities: {
                Row: {
                    id: string
                    opportunity_id: string
                    activity_type: 'follow_up' | 'call' | 'email' | 'meeting'
                    description: string | null
                    activity_date: string
                    created_by: string | null
                    created_at: string
                    updated_at: string
                    deleted_at: string | null
                }
                Insert: {
                    id?: string
                    opportunity_id: string
                    activity_type: 'follow_up' | 'call' | 'email' | 'meeting'
                    description?: string | null
                    activity_date?: string
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                    deleted_at?: string | null
                }
                Update: {
                    id?: string
                    opportunity_id?: string
                    activity_type?: 'follow_up' | 'call' | 'email' | 'meeting'
                    description?: string | null
                    activity_date?: string
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                    deleted_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "opportunity_activities_opportunity_id_fkey"
                        columns: ["opportunity_id"]
                        isOneToOne: false
                        referencedRelation: "opportunities"
                        referencedColumns: ["id"]
                    }
                ]
            }

            opportunities: {
                Row: {
                    assigned_to: string | null
                    company_id: string | null
                    contact_id: string | null
                    created_at: string
                    currency: string | null
                    deleted_at: string | null
                    expected_close_date: string | null
                    id: string
                    lead_origin: Database["public"]["Enums"]["lead_origin"] | null
                    lost_reason: string | null
                    metadata: Json | null
                    net_price: number | null
                    office: Database["public"]["Enums"]["office"] | null
                    product_id: string | null
                    purchase_order: string | null
                    quote_number: string | null
                    sales_price: number | null
                    stage_id: string | null
                    tags: string[] | null
                    title: string
                    updated_at: string
                    won_order_description: string | null
                    won_purchase_order_url: string | null
                }
                Insert: {
                    assigned_to?: string | null
                    company_id?: string | null
                    contact_id?: string | null
                    created_at?: string
                    currency?: string | null
                    deleted_at?: string | null
                    expected_close_date?: string | null
                    id?: string
                    lead_origin?: Database["public"]["Enums"]["lead_origin"] | null
                    lost_reason?: string | null
                    metadata?: Json | null
                    net_price?: number | null
                    office?: Database["public"]["Enums"]["office"] | null
                    product_id?: string | null
                    purchase_order?: string | null
                    quote_number?: string | null
                    sales_price?: number | null
                    stage_id?: string | null
                    tags?: string[] | null
                    title: string
                    updated_at?: string
                    won_order_description?: string | null
                    won_purchase_order_url?: string | null
                }
                Update: {
                    assigned_to?: string | null
                    company_id?: string | null
                    contact_id?: string | null
                    created_at?: string
                    currency?: string | null
                    deleted_at?: string | null
                    expected_close_date?: string | null
                    id?: string
                    lead_origin?: Database["public"]["Enums"]["lead_origin"] | null
                    lost_reason?: string | null
                    metadata?: Json | null
                    net_price?: number | null
                    office?: Database["public"]["Enums"]["office"] | null
                    product_id?: string | null
                    purchase_order?: string | null
                    quote_number?: string | null
                    sales_price?: number | null
                    stage_id?: string | null
                    tags?: string[] | null
                    title?: string
                    updated_at?: string
                    won_order_description?: string | null
                    won_purchase_order_url?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "opportunities_company_id_fkey"
                        columns: ["company_id"]
                        isOneToOne: false
                        referencedRelation: "companies"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "opportunities_contact_id_fkey"
                        columns: ["contact_id"]
                        isOneToOne: false
                        referencedRelation: "contacts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "opportunities_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "opportunities_stage_id_fkey"
                        columns: ["stage_id"]
                        isOneToOne: false
                        referencedRelation: "pipeline_stages"
                        referencedColumns: ["id"]
                    }
                ]
            }
            opportunity_history: {
                Row: {
                    action: string
                    created_at: string
                    field_name: string | null
                    id: string
                    metadata: Json | null
                    new_value: string | null
                    old_value: string | null
                    opportunity_id: string
                    user_id: string | null
                }
                Insert: {
                    action: string
                    created_at?: string
                    field_name?: string | null
                    id?: string
                    metadata?: Json | null
                    new_value?: string | null
                    old_value?: string | null
                    opportunity_id: string
                    user_id?: string | null
                }
                Update: {
                    action?: string
                    created_at?: string
                    field_name?: string | null
                    id?: string
                    metadata?: Json | null
                    new_value?: string | null
                    old_value?: string | null
                    opportunity_id?: string
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "opportunity_history_opportunity_id_fkey"
                        columns: ["opportunity_id"]
                        isOneToOne: false
                        referencedRelation: "opportunities"
                        referencedColumns: ["id"]
                    }
                ]
            }
            opportunity_products: {
                Row: {
                    id: string
                    opportunity_id: string
                    product_id: string
                    quantity: number | null
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    opportunity_id: string
                    product_id: string
                    quantity?: number | null
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    opportunity_id?: string
                    product_id?: string
                    quantity?: number | null
                    notes?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "opportunity_products_opportunity_id_fkey"
                        columns: ["opportunity_id"]
                        isOneToOne: false
                        referencedRelation: "opportunities"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "opportunity_products_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    }
                ]
            }
            pipeline_stages: {
                Row: {
                    color: string | null
                    created_at: string
                    id: string
                    is_loss_stage: boolean | null
                    is_win_stage: boolean | null
                    metadata: Json | null
                    name: string
                    order_index: number
                    updated_at: string
                }
                Insert: {
                    color?: string | null
                    created_at?: string
                    id?: string
                    is_loss_stage?: boolean | null
                    is_win_stage?: boolean | null
                    metadata?: Json | null
                    name: string
                    order_index?: number
                    updated_at?: string
                }
                Update: {
                    color?: string | null
                    created_at?: string
                    id?: string
                    is_loss_stage?: boolean | null
                    is_win_stage?: boolean | null
                    metadata?: Json | null
                    name?: string
                    order_index?: number
                    updated_at?: string
                }
                Relationships: []
            }
            products: {
                Row: {
                    catalog_url: string | null
                    created_at: string
                    deleted_at: string | null
                    description: string | null
                    id: string
                    manufacturer_id: string | null
                    metadata: Json | null
                    name: string
                    ncm: string | null
                    sku: string | null
                    updated_at: string
                }
                Insert: {
                    catalog_url?: string | null
                    created_at?: string
                    deleted_at?: string | null
                    description?: string | null
                    id?: string
                    manufacturer_id?: string | null
                    metadata?: Json | null
                    name: string
                    ncm?: string | null
                    sku?: string | null
                    updated_at?: string
                }
                Update: {
                    catalog_url?: string | null
                    created_at?: string
                    deleted_at?: string | null
                    description?: string | null
                    id?: string
                    manufacturer_id?: string | null
                    metadata?: Json | null
                    name?: string
                    ncm?: string | null
                    sku?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "products_manufacturer_id_fkey"
                        columns: ["manufacturer_id"]
                        isOneToOne: false
                        referencedRelation: "companies"
                        referencedColumns: ["id"]
                    }
                ]
            }
            stage_field_requirements: {
                Row: {
                    created_at: string
                    field_name: string
                    id: string
                    is_required: boolean | null
                    metadata: Json | null
                    stage_id: string
                }
                Insert: {
                    created_at?: string
                    field_name: string
                    id?: string
                    is_required?: boolean | null
                    metadata?: Json | null
                    stage_id: string
                }
                Update: {
                    created_at?: string
                    field_name?: string
                    id?: string
                    is_required?: boolean | null
                    metadata?: Json | null
                    stage_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "stage_field_requirements_stage_id_fkey"
                        columns: ["stage_id"]
                        isOneToOne: false
                        referencedRelation: "pipeline_stages"
                        referencedColumns: ["id"]
                    }
                ]
            }
            user_permissions: {
                Row: {
                    can_add: boolean | null
                    can_delete: boolean | null
                    can_download: boolean | null
                    can_edit: boolean | null
                    can_view: boolean | null
                    created_at: string
                    id: string
                    metadata: Json | null
                    resource: Database["public"]["Enums"]["resource_type"]
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    can_add?: boolean | null
                    can_delete?: boolean | null
                    can_download?: boolean | null
                    can_edit?: boolean | null
                    can_view?: boolean | null
                    created_at?: string
                    id?: string
                    metadata?: Json | null
                    resource: Database["public"]["Enums"]["resource_type"]
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    can_add?: boolean | null
                    can_delete?: boolean | null
                    can_download?: boolean | null
                    can_edit?: boolean | null
                    can_view?: boolean | null
                    created_at?: string
                    id?: string
                    metadata?: Json | null
                    resource?: Database["public"]["Enums"]["resource_type"]
                    updated_at?: string
                    user_id?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            user_has_permission: {
                Args: {
                    p_resource: Database["public"]["Enums"]["resource_type"]
                    p_permission: string
                }
                Returns: boolean
            }
        }
        Enums: {
            lead_origin:
            | "website"
            | "social_media"
            | "email"
            | "phone_call"
            | "events"
            | "manufacturer"
            | "referral"
            | "other"
            office: "TIA" | "TIC"
            resource_type:
            | "contacts"
            | "companies"
            | "manufacturers"
            | "products"
            | "opportunities"
            | "documents"
            | "settings"
            | "users"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// Helper types for easier usage
export type Tables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Row"]
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Insert"]
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Update"]
export type Enums<T extends keyof Database["public"]["Enums"]> =
    Database["public"]["Enums"][T]

// Convenience type aliases
export type Company = Tables<"companies">
export type Contact = Tables<"contacts">
export type Manufacturer = Company
export type Product = Tables<"products">
export type Opportunity = Tables<"opportunities">
export type OpportunityHistory = Tables<"opportunity_history">
export type PipelineStage = Tables<"pipeline_stages">
export type StageFieldRequirement = Tables<"stage_field_requirements">
export type UserPermission = Tables<"user_permissions">
export type Document = Tables<"documents">

export type LeadOrigin = Enums<"lead_origin">
export type Office = Enums<"office">
export type ResourceType = Enums<"resource_type">

// New types for Opportunity Visualization feature
export type LostReason = Tables<"lost_reasons">
export type OpportunityActivity = Tables<"opportunity_activities">
export type ActivityType = OpportunityActivity['activity_type']
export type OpportunityProduct = Tables<"opportunity_products">
