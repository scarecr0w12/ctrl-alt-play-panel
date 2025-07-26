import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { NodeManagement } from '@/components/admin';

export default function NodeManagementPage() {
  return (
    <ProtectedRoute>
      <Layout title="Node Management">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <NodeManagement />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
