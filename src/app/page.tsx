'use client';

import { useState } from 'react';
import MathProblem from '@/components/MathProblem';

export default function Home() {
  const [showConfetti, setShowConfetti] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">Havruta - AI 수학 문제 풀이</h1>
        <MathProblem onCorrectAnswer={() => setShowConfetti(true)} />
      </div>
    </main>
  );
}
