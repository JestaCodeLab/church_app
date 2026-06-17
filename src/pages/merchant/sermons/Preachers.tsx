import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Mic2, X } from 'lucide-react';
import { preacherAPI } from '../../../services/api';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import { showToast } from '../../../utils/toasts';
import Loader from '../../../components/ui/Loader';

interface Preacher {
  _id: string;
  name: string;
  title?: string;
  bio?: string;
  photo?: { url: string };
  sermonCount?: number;
}

const emptyForm = { name: '', title: '', bio: '' };

const Preachers: React.FC = () => {
  const [preachers, setPreachers] = useState<Preacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Preacher | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [preacherToDelete, setPreacherToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPreachers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await preacherAPI.getPreachers();
      setPreachers(res.data.data || []);
    } catch {
      showToast.error('Failed to load preachers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPreachers(); }, [fetchPreachers]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowModal(true);
  };

  const openEdit = (p: Preacher) => {
    setEditing(p);
    setForm({ name: p.name, title: p.title || '', bio: p.bio || '' });
    setPhotoFile(null);
    setPhotoPreview(p.photo?.url || null);
    setShowModal(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return showToast.error('Name is required');

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('name', form.name.trim());
      if (form.title) fd.append('title', form.title.trim());
      if (form.bio) fd.append('bio', form.bio.trim());
      if (photoFile) fd.append('photo', photoFile);

      if (editing) {
        await preacherAPI.updatePreacher(editing._id, fd);
        showToast.success('Preacher updated');
      } else {
        await preacherAPI.createPreacher(fd);
        showToast.success('Preacher added');
      }

      setShowModal(false);
      fetchPreachers();
    } catch {
      showToast.error(editing ? 'Failed to update preacher' : 'Failed to add preacher');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!preacherToDelete) return;
    try {
      setDeleting(true);
      await preacherAPI.deletePreacher(preacherToDelete);
      setShowDeleteModal(false);
      setPreacherToDelete(null);
      fetchPreachers();
      showToast.success('Preacher removed');
    } catch {
      showToast.error('Failed to remove preacher');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-600 rounded-xl">
            <Mic2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Preachers</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage preacher profiles for your sermons</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
          <Plus className="w-5 h-5" />
          Add Preacher
        </button>
      </div>

      {/* List */}
      {loading ? (
        <Loader variant="skeleton-cards" count={3} />
      ) : preachers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Mic2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">No preachers yet. Add your first one.</p>
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
            <Plus className="w-5 h-5" />
            Add Preacher
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {preachers.map(p => (
            <div key={p._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex gap-4">
              <div className="flex-shrink-0">
                {p.photo?.url ? (
                  <img src={p.photo.url} alt={p.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                    <Mic2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                {p.title && <p className="text-xs text-primary-600 dark:text-primary-400">{p.title}</p>}
                {p.bio && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{p.bio}</p>}
              </div>
              <div className="flex-shrink-0 flex flex-col gap-1">
                <button onClick={() => openEdit(p)} className="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => { setPreacherToDelete(p._id); setShowDeleteModal(true); }} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editing ? 'Edit Preacher' : 'Add Preacher'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Photo */}
              <div className="flex flex-col items-center gap-3">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Mic2 className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <label className="cursor-pointer text-sm text-primary-600 dark:text-primary-400 hover:underline">
                  {photoPreview ? 'Change photo' : 'Upload photo'}
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Full name"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="e.g. Pastor, Evangelist, Bishop"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})}
                  placeholder="Short biography (optional)"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader variant="inline" size="sm" />}
                  <span>{saving ? 'Saving…' : editing ? 'Update' : 'Add Preacher'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete} title="Remove Preacher"
        message="This preacher will be removed. Existing sermons will retain their association."
        type="danger" isLoading={deleting} />
    </div>
  );
};

export default Preachers;
