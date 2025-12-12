"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToaster } from '@/components/Toaster';

export default function ProfilePage() {
    const router = useRouter();
    const { data: session, update } = useSession();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        imageUrl: ''
    });
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [hasPassword, setHasPassword] = useState(false);

    useEffect(() => {
        fetch('/api/profile')
            .then(res => {
                if (!res.ok) throw new Error('Failed to load profile');
                return res.json();
            })
            .then(data => {
                setFormData({
                    firstName: data.first_name || '',
                    lastName: data.last_name || '',
                    imageUrl: data.image_url || ''
                });
                setHasPassword(data.has_password);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const { success, error: toastError } = useToaster();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to update profile');

            await update({
                firstName: formData.firstName,
                lastName: formData.lastName
            });

            success('Profile updated!');
            router.refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const data = new FormData();
        data.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: data
            });
            if (!res.ok) throw new Error('Upload failed');
            const result = await res.json();
            setFormData(prev => ({ ...prev, imageUrl: result.filepath }));
            window.dispatchEvent(new Event('profileUpdated'));
        } catch (err) {
            setError('Image upload failed');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        const current = e.target.current?.value;
        const newPass = e.target.newPass.value;

        try {
            const res = await fetch('/api/profile/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current, newPass }),
            });

            if (!res.ok) throw new Error(await res.text());

            e.target.reset();
            success("Password updated successfully!");
            setHasPassword(true); // User now has a password
        } catch (err) {
            toastError(err.message);
        }
    };

    if (loading) return <div className="p-10 text-center"><span className="loading loading-spinner loading-lg"></span></div>;

    return (
        <div className="max-w-2xl mx-auto mt-10 p-4">
            <h1 className="text-3xl font-bold mb-8 text-center text-primary">Your Profile</h1>

            <div className="card bg-base-100 shadow-xl mb-8">
                <div className="card-body">
                    <h2 className="card-title text-2xl mb-6">Profile Settings</h2>

                    {error && <div className="alert alert-error mb-4"><span>{error}</span></div>}

                    <form onSubmit={handleSubmit} className="form-control gap-4">
                        <div className="flex gap-4">
                            <div className="w-1/2">
                                <label className="label"><span className="label-text">First Name</span></label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.firstName}
                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                />
                            </div>
                            <div className="w-1/2">
                                <label className="label"><span className="label-text">Last Name</span></label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label"><span className="label-text">Profile Image</span></label>

                            <div className="flex items-center gap-4">
                                <div className="avatar">
                                    <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                                        {formData.imageUrl || session?.user?.image ? (
                                            <img src={formData.imageUrl || session?.user?.image} alt="Avatar Preview" />
                                        ) : (
                                            <div className="bg-neutral text-neutral-content grid place-items-center w-full h-full text-3xl">
                                                {formData.firstName ? formData.firstName[0].toUpperCase() : 'U'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <input
                                        type="file"
                                        className="file-input file-input-bordered w-full max-w-xs"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        disabled={uploading}
                                    />
                                    {uploading && <div className="text-xs mt-1">Uploading...</div>}
                                </div>
                            </div>
                        </div>

                        <div className="card-actions justify-end mt-6">
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? <span className="loading loading-spinner"></span> : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <div className="card-body">
                        <h2 className="card-title text-2xl mb-4">{hasPassword ? "Change Password" : "Set Password"}</h2>
                        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                            {hasPassword && (
                                <div className="form-control w-full">
                                    <label className="label"><span className="label-text">Current Password</span></label>
                                    <div className="relative">
                                        <input
                                            name="current"
                                            type={showPassword ? "text" : "password"}
                                            className="input input-bordered w-full pr-10"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="form-control w-full">
                                <label className="label"><span className="label-text">{hasPassword ? "New Password" : "Create Password"}</span></label>
                                <div className="relative">
                                    <input
                                        name="newPass"
                                        type={showPassword ? "text" : "password"}
                                        className="input input-bordered w-full pr-10"
                                        required
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                            <div className="card-actions justify-end mt-4">
                                <button type="submit" className="btn btn-secondary">{hasPassword ? "Update Password" : "Set Password"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

        </div>
    );
}
