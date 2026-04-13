import { useEffect, useState } from 'react';
import { Plus, Eye, CheckCircle, XCircle, Trash2, CreditCard } from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import PaymentModal from '../components/PaymentModal';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import { useAuth } from '../context/AuthContext';

const statusBadge = (status) => {
  const map = {
    Pending:   'badge-pending',
    Completed: 'badge-completed',
    Cancelled: 'badge-cancelled',
    Paid:      'badge-paid',
  };
  return map[status] || 'badge-pending';
};

const Orders = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Create order modal
  const [createOpen, setCreateOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [orderItems, setOrderItems] = useState([{ product: '', quantity: 1 }]);
  const [notes, setNotes] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // View order modal
  const [viewOrder, setViewOrder] = useState(null);

  // Payment modal
  const [payOrder, setPayOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await orderService.getAll(params);
      setOrders(data);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  useEffect(() => {
    productService.getAll().then(({ data }) => setProducts(data));
  }, []);

  const addOrderItem = () =>
    setOrderItems([...orderItems, { product: '', quantity: 1 }]);

  const removeOrderItem = (idx) =>
    setOrderItems(orderItems.filter((_, i) => i !== idx));

  const updateOrderItem = (idx, field, value) => {
    const updated = [...orderItems];
    updated[idx][field] = value;
    setOrderItems(updated);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setCreateError('');

    const validItems = orderItems.filter((i) => i.product && i.quantity > 0);
    if (validItems.length === 0) {
      setCreateError('Add at least one product to the order.');
      return;
    }

    setCreating(true);
    try {
      await orderService.create({ items: validItems, notes });
      setCreateOpen(false);
      setOrderItems([{ product: '', quantity: 1 }]);
      setNotes('');
      await fetchOrders();
      // Refresh products to reflect stock deduction
      productService.getAll().then(({ data }) => setProducts(data));
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create order.');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const { data } = await orderService.updateStatus(orderId, newStatus);
      setOrders(orders.map((o) => (o._id === orderId ? data : o)));
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order?')) return;
    try {
      await orderService.delete(id);
      setOrders(orders.filter((o) => o._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  // Compute preview total
  const previewTotal = orderItems.reduce((sum, item) => {
    const p = products.find((pr) => pr._id === item.product);
    return sum + (p ? p.price * Number(item.quantity) : 0);
  }, 0);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Manage customer orders</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Order
        </button>
      </div>

      {/* Filter */}
      <div className="card mb-6">
        <div className="flex gap-3 flex-wrap">
          {['', 'Pending', 'Completed', 'Cancelled', 'Paid'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">
                  Order #
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">
                  Items
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">
                  Total
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">
                  Status
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">
                  Created By
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">
                  Date
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {order.items.length} item(s)
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      Ksh {Math.round(order.totalAmount).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span className={statusBadge(order.status)}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {order.createdBy?.name || '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-3 items-center">
                        <button
                          onClick={() => setViewOrder(order)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          <Eye size={13} /> View
                        </button>
                        {order.status === 'Pending' && (
                          <>
                            {/* Pay Now — triggers M-Pesa STK Push */}
                            <button
                              onClick={() => setPayOrder(order)}
                              className="flex items-center gap-1 text-emerald-600 hover:text-emerald-800 text-xs font-medium"
                            >
                              <CreditCard size={13} /> Pay
                            </button>
                            <button
                              onClick={() =>
                                handleStatusChange(order._id, 'Completed')
                              }
                              className="flex items-center gap-1 text-green-600 hover:text-green-800 text-xs font-medium"
                            >
                              <CheckCircle size={13} /> Complete
                            </button>
                            <button
                              onClick={() =>
                                handleStatusChange(order._id, 'Cancelled')
                              }
                              className="flex items-center gap-1 text-red-500 hover:text-red-700 text-xs font-medium"
                            >
                              <XCircle size={13} /> Cancel
                            </button>
                          </>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(order._id)}
                            className="flex items-center gap-1 text-gray-400 hover:text-red-500 text-xs font-medium"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New Order"
      >
        {createError && (
          <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg mb-4">
            {createError}
          </div>
        )}
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Order Items
            </label>
            <div className="space-y-2">
              {orderItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select
                    value={item.product}
                    onChange={(e) =>
                      updateOrderItem(idx, 'product', e.target.value)
                    }
                    className="input-field flex-1"
                    required
                  >
                    <option value="">Select product...</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} (Ksh {Math.round(p.price).toLocaleString()} · {p.quantity} in stock)
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateOrderItem(idx, 'quantity', e.target.value)
                    }
                    className="input-field w-20"
                    required
                  />
                  {orderItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOrderItem(idx)}
                      className="text-red-400 hover:text-red-600 text-lg leading-none"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOrderItem}
              className="text-blue-600 text-sm mt-2 hover:underline"
            >
              + Add another item
            </button>
          </div>

          {previewTotal > 0 && (
            <div className="bg-blue-50 px-4 py-2 rounded-lg text-sm text-blue-700 font-medium">
              Estimated Total: Ksh {Math.round(previewTotal).toLocaleString()}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field resize-none"
              rows={2}
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={creating} className="btn-primary">
              {creating ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* M-Pesa Payment Modal */}
      <PaymentModal
        isOpen={!!payOrder}
        onClose={() => setPayOrder(null)}
        order={payOrder}
        onPaymentSuccess={() => {
          setPayOrder(null);
          fetchOrders();
        }}
      />

      {/* View Order Modal */}
      <Modal
        isOpen={!!viewOrder}
        onClose={() => setViewOrder(null)}
        title={`Order Details — ${viewOrder?.orderNumber}`}
      >
        {viewOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Status</p>
                <span className={statusBadge(viewOrder.status)}>
                  {viewOrder.status}
                </span>
              </div>
              <div>
                <p className="text-gray-500">Total Amount</p>
                <p className="font-semibold">Ksh {Math.round(viewOrder.totalAmount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Created By</p>
                <p>{viewOrder.createdBy?.name || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Date</p>
                <p>{new Date(viewOrder.createdAt).toLocaleString()}</p>
              </div>
              {viewOrder.notes && (
                <div className="col-span-2">
                  <p className="text-gray-500">Notes</p>
                  <p>{viewOrder.notes}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Items
              </p>
              <table className="w-full text-sm border rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-gray-600">Product</th>
                    <th className="text-left px-3 py-2 text-gray-600">Qty</th>
                    <th className="text-left px-3 py-2 text-gray-600">Unit Price</th>
                    <th className="text-left px-3 py-2 text-gray-600">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {viewOrder.items.map((item, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{item.productName}</td>
                      <td className="px-3 py-2">{item.quantity}</td>
                      <td className="px-3 py-2">Ksh {Math.round(item.price).toLocaleString()}</td>
                      <td className="px-3 py-2 font-medium">
                        Ksh {Math.round(item.price * item.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default Orders;
