import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { DataTable, Column } from '@/components/shared/DataTable'
import { Modal } from '@/components/shared/Modal'
import { FAB } from '@/components/shared/FAB'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ProductForm } from '@/components/database/ProductForm'
import { useProducts } from '@/hooks/useProducts'
import type { Product } from '@/lib/database.types'

export function ProductsView() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [modalOpen, setModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<Product | null>(null)
    const [deleteItem, setDeleteItem] = useState<{ id: string } | null>(null)

    const {
        products,
        loading,
        createProduct,
        updateProduct,
        deleteProduct
    } = useProducts()

    const handleRowClick = (item: Product) => {
        navigate(`/database/product/${item.id}`)
    }

    const handleAdd = () => {
        setEditingItem(null)
        setModalOpen(true)
    }

    const handleDeleteClick = (item: Product, e: React.MouseEvent) => {
        e.stopPropagation()
        setDeleteItem({ id: item.id })
    }

    const handleConfirmDelete = async () => {
        if (deleteItem) {
            await deleteProduct(deleteItem.id)
            setDeleteItem(null)
        }
    }

    const handleCloseModal = () => {
        setModalOpen(false)
        setEditingItem(null)
    }

    const handleSubmit = async (data: Parameters<typeof createProduct>[0]) => {
        if (editingItem) {
            await updateProduct(editingItem.id, data)
        } else {
            await createProduct(data)
        }
        handleCloseModal()
    }

    const columns: Column<Product & { manufacturer?: { name: string } | null }>[] = [
        { key: 'name', header: 'Name', sortable: true },
        {
            key: 'manufacturer',
            header: 'Manufacturer',
            render: (item) => item.manufacturer?.name || '-'
        },
        { key: 'ncm', header: 'NCM' },
        {
            key: 'actions',
            header: '',
            className: 'w-12',
            render: (item) => (
                <button
                    onClick={(e) => handleDeleteClick(item, e)}
                    className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                    title={t('common.delete')}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )
        },
    ]

    return (
        <>
            <DataTable
                data={products as (Product & { manufacturer?: { name: string } | null })[]}
                columns={columns}
                keyField="id"
                onRowClick={handleRowClick}
                loading={loading}
                searchPlaceholder={t('database.searchProducts')}
                emptyMessage={t('database.noProducts')}
            />

            <FAB
                onClick={handleAdd}
                label={t('database.addProduct')}
            />

            <Modal
                isOpen={modalOpen}
                onClose={handleCloseModal}
                title={editingItem ? 'Edit Product' : 'New Product'}
                size="lg"
            >
                <ProductForm
                    product={editingItem}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseModal}
                />
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Product"
                message="Are you sure you want to delete this product? This action cannot be undone."
                confirmLabel="Delete"
                variant="danger"
            />
        </>
    )
}
