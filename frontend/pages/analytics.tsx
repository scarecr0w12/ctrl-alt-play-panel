import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ResourceAnalyticsDashboard from '@/components/ResourceAnalyticsDashboard';

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <Layout title="Resource Analytics">
        <div className="space-y-6">
          <ResourceAnalyticsDashboard />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}