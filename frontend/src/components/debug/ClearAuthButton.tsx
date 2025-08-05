import React from 'react';
import { useAuthActions } from '../../stores/authStore';

const ClearAuthButton: React.FC = () => {
  const { clearAuth } = useAuthActions();

  const handleClearAuth = () => {
    clearAuth();
    console.log('Authentication state cleared');
    // 刷新页面以确保状态完全重置
    window.location.reload();
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={handleClearAuth}
        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
      >
        清除认证状态 (Debug)
      </button>
    </div>
  );
};

export default ClearAuthButton;