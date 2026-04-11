import { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, FileText, Pencil, Trash2, Plus } from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { supplierService } from '../services/supplierService';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
};

const Suppliers = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = async () => {
    try {
      const { data } = await supplierService.getAll();
      setSuppliers(data);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const openCreate = () => {
    setEditSupplier(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (supplier) => {
    setEditSupplier(supplier);
    setForm({
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      if (editSupplier) {
        await supplierService.update(editSupplier._id, form);
      } else {
        await supplierService.create(form);
      }
      setModalOpen(false);
      await fetchSuppliers();
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Failed to save supplier.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;
    try {
      await supplierService.delete(id);
      setSuppliers(suppliers.filter((s) => s._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Suppliers</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage product suppliers
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      {/* Suppliers Grid */}
      {loading ? (
        <p className="text-gray-400">Loading suppliers...</p>
      ) : suppliers.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-sm">No suppliers yet.</p>
          <button onClick={openCreate} className="btn-primary mt-4">
            Add First Supplier
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <div key={s._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-blue-50 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold">
                  {s.name[0].toUpperCase()}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(s)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(s._id)}
                      className="flex items-center gap-1 text-red-500 hover:text-red-700 text-xs font-medium"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  )}
                </div>
              </div>
              <h3 className="font-semibold text-gray-800 text-base">{s.name}</h3>
              <div className="mt-2 space-y-1.5 text-sm text-gray-500">
                {s.email && (
                  <p className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400 shrink-0" /> {s.email}
                  </p>
                )}
                {s.phone && (
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400 shrink-0" /> {s.phone}
                  </p>
                )}
                {s.address && (
                  <p className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400 shrink-0" /> {s.address}
                  </p>
                )}
                {s.notes && (
                  <p className="flex items-start gap-2 mt-2 text-gray-400 italic text-xs">
                    <FileText size={13} className="shrink-0 mt-0.5" /> {s.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Supplier Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editSupplier ? 'Edit Supplier' : 'Add New Supplier'}
      >
        {formError && (
          <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg mb-4">
            {formError}
          </div>
        )}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier Name *
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="input-field"
              placeholder="supplier@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="input-field"
              placeholder="+1 555 000 0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="input-field resize-none"
              rows={2}
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editSupplier ? 'Update Supplier' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Suppliers;
