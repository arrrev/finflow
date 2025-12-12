"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import ConfirmModal from '@/components/ConfirmModal';
import ColorPalette from '@/components/ColorPalette';
import { useToaster } from '@/components/Toaster';
import CustomSelect from '@/components/CustomSelect';

export default function CategoriesPage() {
    const { success, error } = useToaster();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatColor, setNewCatColor] = useState('#fbbf24');
    const [newCatDefaultAcc, setNewCatDefaultAcc] = useState(null);
    const [newCatIncludeChart, setNewCatIncludeChart] = useState(true);

    // Modal State
    const [deleteCatId, setDeleteCatId] = useState(null);
    const [deleteSubId, setDeleteSubId] = useState(null);

    const [accounts, setAccounts] = useState([]);

    const fetchCategories = useCallback(() => {
        Promise.all([
            fetch('/api/categories').then(res => res.json()),
            fetch('/api/accounts').then(res => res.json())
        ]).then(([catsData, accsData]) => {
            setCategories(catsData);
            setAccounts(accsData);
            setLoading(false);
        }).catch(err => {
            error('Failed to load data');
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
                body: JSON.stringify({
                    name: newCatName,
                    color: newCatColor,
                    default_account_id: newCatDefaultAcc,
                    include_in_chart: newCatIncludeChart
                })
            });
            if (!res.ok) throw new Error('Failed');
            success('Category created');
            setNewCatName('');
            setNewCatDefaultAcc(null);
            setNewCatIncludeChart(true);
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

    // Handle ESC key for Edit Modal
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && editingCat) {
                setEditingCat(null);
            }
        };
        if (editingCat) {
            window.addEventListener('keydown', handleEsc);
            return () => window.removeEventListener('keydown', handleEsc);
        }
    }, [editingCat]);

    // Handle ESC key for Add Modal
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isAddModalOpen) {
                setIsAddModalOpen(false);
            }
        };
        if (isAddModalOpen) {
            window.addEventListener('keydown', handleEsc);
            return () => window.removeEventListener('keydown', handleEsc);
        }
    }, [isAddModalOpen]);

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
                {editingCat && (typeof window !== 'undefined' ? createPortal(
                    <dialog className="modal modal-open">
                        <div className="modal-box w-11/12 max-w-lg">
                            <h3 className="font-bold text-lg">Edit Category</h3>
                            <form onSubmit={handleEditCategory} className="py-4 flex flex-col gap-4">
                                <div className="form-control w-full">
                                    <label className="label"><span className="label-text">Name</span></label>
                                    <input type="text" className="input input-bordered w-full" value={editingCat.name} onChange={e => setEditingCat({ ...editingCat, name: e.target.value })} />
                                </div>
                                <div className="form-control w-full">
                                    <label className="label"><span className="label-text">Color</span></label>
                                    <ColorPalette
                                        selectedColor={editingCat.color}
                                        onSelect={(color) => setEditingCat({ ...editingCat, color })}
                                    />
                                </div>
                                <div className="form-control w-full">
                                    <label className="label"><span className="label-text">Default Account (Optional)</span></label>
                                    <CustomSelect
                                        options={[{ value: null, label: 'None' }, ...accounts.map(acc => ({ value: acc.id, label: acc.name, color: acc.color }))]}
                                        value={editingCat.default_account_id}
                                        onChange={(val) => setEditingCat({ ...editingCat, default_account_id: val })}
                                        placeholder="None"
                                    />
                                </div>
                                <div className="form-control w-full">
                                    <label className="label cursor-pointer justify-start gap-4">
                                        <span className="label-text">Include In Chart</span>
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-primary"
                                            checked={editingCat.include_in_chart !== false} // Default true
                                            onChange={e => setEditingCat({ ...editingCat, include_in_chart: e.target.checked })}
                                        />
                                    </label>
                                </div>
                                <div className="modal-action">
                                    <button type="button" className="btn" onClick={() => setEditingCat(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save</button>
                                </div>
                            </form>
                        </div>
                    </dialog>,
                    document.body
                ) : null)}

                {/* Add Category Modal */}
                {isAddModalOpen && (typeof window !== 'undefined' ? createPortal(
                    <dialog className="modal modal-open">
                        <div className="modal-box w-11/12 max-w-lg">
                            <h3 className="font-bold text-lg">Add New Category</h3>
                            <form onSubmit={handleAddCategory} className="py-4 flex flex-col gap-4">
                                <div className="form-control w-full">
                                    <label className="label"><span className="label-text">Name</span></label>
                                    <input type="text" className="input input-bordered w-full" value={newCatName} onChange={e => setNewCatName(e.target.value)} required />
                                </div>
                                <div className="form-control w-full">
                                    <label className="label"><span className="label-text">Color</span></label>
                                    <ColorPalette
                                        selectedColor={newCatColor}
                                        onSelect={setNewCatColor}
                                    />
                                </div>
                                <div className="form-control w-full">
                                    <label className="label"><span className="label-text">Default Account (Optional)</span></label>
                                    <CustomSelect
                                        options={[{ value: null, label: 'None' }, ...accounts.map(acc => ({ value: acc.id, label: acc.name, color: acc.color }))]}
                                        value={newCatDefaultAcc}
                                        onChange={(val) => setNewCatDefaultAcc(val)}
                                        placeholder="None"
                                    />
                                </div>
                                <div className="form-control w-full">
                                    <label className="label cursor-pointer justify-start gap-4">
                                        <span className="label-text">Include In Chart</span>
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-primary"
                                            checked={newCatIncludeChart}
                                            onChange={e => setNewCatIncludeChart(e.target.checked)}
                                        />
                                    </label>
                                </div>
                                <div className="modal-action">
                                    <button type="button" className="btn" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Add</button>
                                </div>
                            </form>
                        </div>
                    </dialog>,
                    document.body
                ) : null)}

                <div className="divider">Your Categories</div>
                {/* Categories List */}
                <div className="grid gap-4">
                    {categories.map(cat => {
                        const isUsed = (Number(cat.tx_count || 0) + Number(cat.plan_count || 0)) > 0;
                        const defaultAccountName = cat.default_account_id ? accounts.find(a => a.id === cat.default_account_id)?.name : null;

                        return (
                            <div key={cat.id} className="collapse collapse-arrow bg-base-200">
                                <input type="checkbox" />
                                <div className="collapse-title text-xl font-medium flex items-center justify-between pr-12">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                        {cat.name}
                                        {defaultAccountName && (
                                            <span className="badge badge-sm badge-ghost text-xs font-normal gap-1 opacity-70">
                                                Acc: {defaultAccountName}
                                            </span>
                                        )}
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
