'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/contexts/PermissionContext';
import MathProblem from '@/components/MathProblem';

export default function MathPage() {
  const router = useRouter();
  const { permissions } = usePermission();

  // 권한이 없으면 메인 페이지로 리다이렉트
  useEffect(() => {
    if (!permissions.microphone.granted) {
      router.push('/');
    }
  }, [permissions.microphone.granted, router]);

  // 권한이 없으면 로딩 상태 표시
  if (!permissions.microphone.granted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">하브루타 수학 문제</h1>
          <p className="text-gray-600 mt-2">
            마이크로 답변을 말해보세요. AI 선생님이 도와드릴 거예요!
          </p>
        </div>
        
        <MathProblem />
      </div>
    </main>
  );
} 