import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Package, ShoppingCart, AlertTriangle, DollarSign } from 'lucide-react';
import Layout from '../components/Layout';
import StatsCard from '../components/StatsCard';
import { dashboardService } from '../services/dashboardService';

const STATUS_COLORS = {
  Pending: '#f59e0b',
  Completed: '#10b981',
  Cancelled: '#ef4444',
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await dashboardService.getStats();
        setStats(data);
      } catch {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-red-500">{error}</div>
      </Layout>
    );
  }

  const orderStatusData = stats.ordersByStatus.map((s) => ({
    name: s._id,
    count: s.count,
  }));

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Overview of your inventory and orders
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          color="blue"
        />
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingCart}
          color="purple"
        />
        <StatsCard
          title="Low Stock Items"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          color="orange"
          subtitle="Needs restocking"
        />
        <StatsCard
          title="Revenue"
          value={`KShs ${Math.round(stats.totalRevenue).toLocaleString()}`}
          icon={DollarSign}
          color="green"
          subtitle="From completed orders"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Orders by Status - Bar Chart */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-700 mb-4">
            Orders by Status
          </h2>
          {orderStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={orderStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {orderStatusData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name] || '#6b7280'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm">No order data yet.</p>
          )}
        </div>

        {/* Orders by Status - Pie Chart */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-700 mb-4">
            Order Distribution
          </h2>
          {orderStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {orderStatusData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name] || '#6b7280'}
                    />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm">No order data yet.</p>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <AlertTriangle size={17} className="text-orange-500" /> Low Stock Alerts
          </h2>
          {stats.lowStockProducts.length === 0 ? (
            <p className="text-green-600 text-sm">All stock levels are healthy!</p>
          ) : (
            <div className="space-y-2">
              {stats.lowStockProducts.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.category}</p>
                  </div>
                  <span className="badge-low-stock">
                    {p.quantity} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <ShoppingCart size={17} className="text-blue-500" /> Recent Orders
          </h2>
          {stats.recentOrders.length === 0 ? (
            <p className="text-gray-400 text-sm">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order.createdBy?.name || 'Unknown'} ·{' '}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`badge-${order.status.toLowerCase()}`}
                    >
                      {order.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      KShs {Math.round(order.totalAmount).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
