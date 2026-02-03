/**
 * AdminBlogCategories Page
 * Manage blog categories
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  GripVertical,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../services/blog';
import type { BlogCategory } from '../../types/blog';
import { useToast } from '../../contexts/ToastContext';

export function AdminBlogCategories() {
  const { success, error } = useToast();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const loadCategories = async () => {
    setLoading(true);
    const result = await getCategories();
    if (result.data) {
      setCategories(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) {
      error('Please enter a category name');
      return;
    }

    setSaving(true);
    const result = await createCategory(newName.trim(), newDescription.trim() || undefined);

    if (result.error) {
      error(result.error);
    } else {
      success('Category created!');
      setNewName('');
      setNewDescription('');
      setShowAddForm(false);
      await loadCategories();
    }
    setSaving(false);
  };

  const handleEdit = (category: BlogCategory) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDescription(category.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;

    setSaving(true);
    const result = await updateCategory(editingId, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
    });

    if (result.error) {
      error(result.error);
    } else {
      success('Category updated!');
      setEditingId(null);
      await loadCategories();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    setSaving(true);
    const result = await deleteCategory(id);

    if (result.error) {
      error(result.error);
    } else {
      success('Category deleted!');
      await loadCategories();
    }
    setSaving(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/blog"
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Blog Categories</h1>
            <p className="text-slate-400 text-sm">Manage blog post categories</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-slate-800/50 rounded-xl border border-orange-500/30 p-4">
          <h3 className="text-lg font-semibold text-white mb-4">New Category</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category name"
                className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Description (optional)</label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brief description"
                className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewName('');
                  setNewDescription('');
                }}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-slate-800/50 rounded-xl border border-white/10">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-orange-500 animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500">No categories yet</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 text-orange-400 hover:text-orange-300"
            >
              Create your first category
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
              >
                <div className="text-slate-600 cursor-grab">
                  <GripVertical className="w-5 h-5" />
                </div>

                {editingId === category.id ? (
                  // Edit mode
                  <div className="flex-1 flex items-center gap-4">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description"
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                    />
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="p-2 text-green-400 hover:text-green-300"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  // View mode
                  <>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white">{category.name}</h3>
                        <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded">
                          /{category.slug}
                        </span>
                      </div>
                      {category.description && (
                        <p className="text-sm text-slate-400 mt-1">{category.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminBlogCategories;
