'use client';

import { useState, useEffect } from 'react';
import { OpenAI } from 'openai';
import confetti from 'confetti-js';

interface MathProblemProps {
  onCorrectAnswer: () => void;
}

export default function MathProblem({ onCorrectAnswer }: MathProblemProps) {
  const [problem, setProblem] = useState('');
  const [answer, setAnswer] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  console.log('API Key:', process.env.NEXT_PUBLIC_OPENAI_API_KEY);
  console.log('API Key length:', process.env.NEXT_PUBLIC_OPENAI_API_KEY?.length);

  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
    dangerouslyAllowBrowser: true
  });

  const generateProblem = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "system",
          content: "초등학교 수준의 수학 문제를 생성해주세요. 문제와 정답을 JSON 형식으로 반환해주세요. 예: {\"problem\": \"문제\", \"answer\": \"정답\"}"
        }],
      });

      const result = JSON.parse(response.choices[0].message.content || '');
      setProblem(result.problem);
      setAnswer(result.answer);
    } catch (error) {
      console.error('Error generating problem:', error);
      setMessage('문제 생성 중 오류가 발생했습니다.');
    }
    setLoading(false);
  };

  const checkAnswer = () => {
    if (userAnswer === answer) {
      setMessage('정답입니다! 🎉');
      onCorrectAnswer();
      const confettiSettings = { target: 'confetti-canvas' };
      const confettiInstance = new confetti.create('confetti-canvas', confettiSettings);
      confettiInstance.render();
      setTimeout(() => {
        confettiInstance.clear();
        generateProblem();
      }, 3000);
    } else {
      setMessage('틀렸습니다. 다시 시도해보세요.');
    }
  };

  useEffect(() => {
    generateProblem();
  }, []);

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
      <canvas id="confetti-canvas" className="fixed top-0 left-0 w-full h-full pointer-events-none"></canvas>
      {loading ? (
        <div className="text-center">문제를 생성중입니다...</div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">문제:</h2>
            <p className="text-lg">{problem}</p>
          </div>
          <div className="mb-6">
            <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
              답:
            </label>
            <input
              type="text"
              id="answer"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="답을 입력하세요"
            />
          </div>
          <div className="flex flex-col gap-4">
            <button
              onClick={checkAnswer}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              정답 확인
            </button>
            <button
              onClick={generateProblem}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              새로운 문제
            </button>
          </div>
          {message && (
            <div className={`mt-4 text-center ${message.includes('정답') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </div>
          )}
        </>
      )}
    </div>
  );
} 