import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserProfile from '@/components/UserProfile';

export default function UserProfilePage() {
  return (
    <ProtectedRoute>
      <Layout title="My Profile">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <UserProfile />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
