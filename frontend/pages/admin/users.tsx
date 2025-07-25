import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserManagement } from '@/components/admin';

export default function UserManagementPage() {
  return (
    <ProtectedRoute>
      <Layout title="User Management">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <UserManagement />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
