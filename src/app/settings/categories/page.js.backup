"use client";
import React, { useState, useEffect, useCallback } from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import { useToaster } from '@/components/Toaster';

export default function CategoriesPage() {
    const { success, error } = useToaster();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatColor, setNewCatColor] = useState('#fbbf24');

    // Modal State
    const [deleteCatId, setDeleteCatId] = useState(null);
    const [deleteSubId, setDeleteSubId] = useState(null);

    const fetchCategories = useCallback(() => {
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => {
                setCategories(data);
                setLoading(false);
            })
            .catch(err => {
                error('Failed to load categories');
                setLoading(false);
            });
    }, [error]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCatName, color: newCatColor })
            });
            if (!res.ok) throw new Error('Failed');
            success('Category created');
            setNewCatName('');
            setIsAddModalOpen(false);
            fetchCategories();
        } catch (e) {
            error('Error creating category');
        }
    };

    const confirmDeleteCat = (id) => setDeleteCatId(id);

    const handleDeleteCategory = async () => {
        if (!deleteCatId) return;
        try {
            const res = await fetch(`/api/categories?id=${deleteCatId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
            success('Category deleted');
            fetchCategories();
        } catch (e) {
            error('Error deleting category');
        } finally { setDeleteCatId(null); }
    };

    const handleAddSubcategory = async (catId, name) => {
        if (!name) return;
        try {
            const res = await fetch('/api/subcategories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category_id: catId, name })
            });
            if (!res.ok) throw new Error('Failed');
            success('Subcategory added');
            fetchCategories();
        } catch (e) {
            error('Error adding subcategory');
        }
    };

    const confirmDeleteSub = (id) => setDeleteSubId(id);

    const handleDeleteSubcategory = async () => {
        if (!deleteSubId) return;
        try {
            const res = await fetch(`/api/subcategories?id=${deleteSubId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
            success('Subcategory deleted');
            fetchCategories();
        } catch (e) {
            error('Error deleting subcategory');
        } finally { setDeleteSubId(null); }
    };

    const [editingCat, setEditingCat] = useState(null);

    const handleEditCategory = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/categories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingCat)
            });
            if (!res.ok) throw new Error('Failed');
            success('Category updated');
            setEditingCat(null);
            fetchCategories();
        } catch (e) { error('Update failed'); }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="card-title">Category Management</h2>
                    <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>+ Add Category</button>
                </div>

                {/* Edit Modal */}
                {editingCat && (
                    <dialog className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg">Edit Category</h3>
                            <form onSubmit={handleEditCategory} className="py-4 flex flex-col gap-4">
                                <div className="form-control w-full">
                                    <label className="label"><span className="label-text">Name</span></label>
                                    <input type="text" className="input input-bordered w-full" value={editingCat.name} onChange={e => setEditingCat({ ...editingCat, name: e.target.value })} />
                                </div>
                                <div className="form-control w-full">
                                    <label className="label"><span className="label-text">Color</span></label>
                                    <div className="flex gap-2 items-center">
                                        <input type="color" className="input input-bordered w-20 h-10 p-1" value={editingCat.color} onChange={e => setEditingCat({ ...editingCat, color: e.target.value })} />
                                        <div className="w-10 h-10 rounded-full border border-base-300" style={{ backgroundColor: editingCat.color }}></div>
                                    </div>
                                </div>
                                <div className="modal-action">
                                    <button type="button" className="btn" onClick={() => setEditingCat(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save</button>
                                </div>
                            </form>
                        </div>
                    </dialog>
                )}

                {/* Add Category Modal */}
                {isAddModalOpen && (
                    <dialog className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg">Add New Category</h3>
                            <form onSubmit={handleAddCategory} className="py-4 flex flex-col gap-4">
                                <div className="form-control w-full">
                                    <label className="label"><span className="label-text">Name</span></label>
                                    <input type="text" className="input input-bordered w-full" value={newCatName} onChange={e => setNewCatName(e.target.value)} required />
                                </div>
                                <div className="form-control w-full">
                                    <label className="label"><span className="label-text">Color</span></label>
                                    <div className="flex gap-2 items-center">
                                        <input type="color" className="input input-bordered w-20 h-10 p-1" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} />
                                        <div className="w-10 h-10 rounded-full border border-base-300" style={{ backgroundColor: newCatColor }}></div>
                                    </div>
                                </div>
                                <div className="modal-action">
                                    <button type="button" className="btn" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Add</button>
                                </div>
                            </form>
                        </div>
                    </dialog>
                )}

                <div className="divider">Your Categories</div>

                <div className="grid gap-4">
                    {categories.map(cat => {
                        const isUsed = (Number(cat.tx_count || 0) + Number(cat.plan_count || 0)) > 0;
                        return (
                            <div key={cat.id} className="collapse collapse-arrow bg-base-200">
                                <input type="checkbox" />
                                <div className="collapse-title text-xl font-medium flex items-center justify-between pr-12">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                        {cat.name}
                                    </div>
                                </div>
                                <div className="collapse-content bg-base-200">
                                    <div className="flex justify-between items-center mb-4 pt-2">
                                        <h4 className="font-bold text-sm uppercase text-base-content/50">Subcategories</h4>
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingCat(cat)} className="btn btn-xs btn-info btn-outline">Edit</button>
                                            {isUsed ? (
                                                <span className="text-xs text-gray-400" title="Cannot delete: Used in transactions/plans">In Use</span>
                                            ) : (
                                                <button onClick={() => confirmDeleteCat(cat.id)} className="btn btn-xs btn-error btn-outline">Delete Category</button>
                                            )}
                                        </div>
                                    </div>

                                    <ul className="menu bg-base-100 w-full rounded-box mb-4">
                                        {cat.subcategories?.map((sub) => {
                                            const isSubUsed = (Number(sub.tx_count || 0) + Number(sub.plan_count || 0)) > 0;
                                            return (
                                                <li key={sub.id} className="flex flex-row justify-between">
                                                    <span>{sub.name}</span>
                                                    {isSubUsed ? (
                                                        <span className="text-xs text-gray-400">In Use</span>
                                                    ) : (
                                                        <a onClick={() => confirmDeleteSub(sub.id)} className="text-error cursor-pointer">✕</a>
                                                    )}
                                                </li>
                                            );
                                        })}
                                        {(!cat.subcategories || cat.subcategories.length === 0) && <li className="disabled"><a>No subcategories</a></li>}
                                    </ul>

                                    <div className="join w-full">
                                        <input
                                            id={`sub-input-${cat.id}`}
                                            className="input input-bordered input-sm join-item w-full"
                                            placeholder="Add subcategory..."
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleAddSubcategory(cat.id, e.target.value);
                                                    e.target.value = '';
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={() => {
                                                const el = document.getElementById(`sub-input-${cat.id}`);
                                                handleAddSubcategory(cat.id, el.value);
                                                el.value = '';
                                            }}
                                            className="btn btn-sm btn-primary join-item"
                                        >Add</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <ConfirmModal
                    isOpen={!!deleteCatId}
                    title="Delete Category"
                    message="Are you sure? This will fail if there are transactions associated with this category."
                    onConfirm={handleDeleteCategory}
                    onCancel={() => setDeleteCatId(null)}
                />

                <ConfirmModal
                    isOpen={!!deleteSubId}
                    title="Delete Subcategory"
                    message="Are you sure you want to delete this subcategory?"
                    onConfirm={handleDeleteSubcategory}
                    onCancel={() => setDeleteSubId(null)}
                />
            </div>
        </div>
    );
}
