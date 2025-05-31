'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/contexts/PermissionContext';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const { permissions, requestMicrophonePermission } = usePermission();

  const handlePermissionRequest = async () => {
    await requestMicrophonePermission();
  };

  const handleStartMath = () => {
    router.push('/math');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            하브루타 수학
          </h1>
          <p className="text-gray-600 mb-8">
            {permissions.microphone.granted 
              ? "AI 선생님과 함께 수학 문제를 풀어보세요!"
              : "대화형 수학 학습을 시작하기 전에\n마이크 사용 권한이 필요합니다."}
          </p>
        </div>

        <div className="space-y-4">
          {permissions.microphone.error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
              {permissions.microphone.error}
            </div>
          )}

          {permissions.microphone.granted ? (
            // 권한이 있는 경우 문제 풀기 버튼 표시
            <button
              onClick={handleStartMath}
              className="w-full py-3 px-4 rounded-lg text-white font-medium transition-colors bg-green-600 hover:bg-green-700 flex items-center justify-center space-x-2"
            >
              <span>문제 풀러가기</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            // 권한이 없는 경우 권한 요청 버튼 표시
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
          )}

          <p className="text-sm text-gray-500 text-center">
            {permissions.microphone.granted ? (
              <>
                마이크 권한이 허용되었습니다.<br />
                음성으로 답변하고 AI 선생님과 대화할 수 있어요!
              </>
            ) : (
              <>
                마이크를 통해 답변을 말하고<br />
                선생님과 대화하며 문제를 풀 수 있어요.
              </>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}
