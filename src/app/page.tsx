'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/contexts/PermissionContext';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const { permissions, requestMicrophonePermission } = usePermission();

  // 이미 권한이 있으면 자동으로 문제 페이지로 이동
  useEffect(() => {
    if (permissions.microphone.granted) {
      router.push('/math');
    }
  }, [permissions.microphone.granted, router]);

  const handlePermissionRequest = async () => {
    const granted = await requestMicrophonePermission();
    if (granted) {
      router.push('/math');
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            하브루타 수학
          </h1>
          <p className="text-gray-600 mb-8">
            대화형 수학 학습을 시작하기 전에<br />
            마이크 사용 권한이 필요합니다.
          </p>
        </div>

        <div className="space-y-4">
          {permissions.microphone.error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
              {permissions.microphone.error}
            </div>
          )}

          <button
            onClick={handlePermissionRequest}
            disabled={permissions.microphone.loading}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors
              ${permissions.microphone.loading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            {permissions.microphone.loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                권한 요청 중...
              </span>
            ) : (
              '마이크 권한 허용하기'
            )}
          </button>

          <p className="text-sm text-gray-500 text-center">
            마이크를 통해 답변을 말하고<br />
            선생님과 대화하며 문제를 풀 수 있어요.
          </p>
        </div>
      </div>
    </main>
  );
}
