'use client';

import { useState, useEffect } from 'react';
import { OpenAI } from 'openai';
import { MathCategory } from '@/types/mathTypes';
import CategorySelector from './CategorySelector';
import VoiceInput from './VoiceInput';

interface MathProblemProps {
  onCorrectAnswer: () => void;
}

export default function MathProblem({ onCorrectAnswer }: MathProblemProps) {
  const [problem, setProblem] = useState('');
  const [answer, setAnswer] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [userReasoning, setUserReasoning] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showReasoning, setShowReasoning] = useState(false);
  const [category, setCategory] = useState<MathCategory>('addition_subtraction');
  const [isAnswerListening, setIsAnswerListening] = useState(false);
  const [isReasoningListening, setIsReasoningListening] = useState(false);

  console.log('API Key:', process.env.NEXT_PUBLIC_OPENAI_API_KEY);
  console.log('API Key length:', process.env.NEXT_PUBLIC_OPENAI_API_KEY?.length);

  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
    dangerouslyAllowBrowser: true
  });

  const getCategoryPrompt = (category: MathCategory) => {
    switch (category) {
      case 'addition_subtraction':
        return "유치원이나 초등학교 1학년 수준의 덧셈, 뺄셈 문제를 생성해주세요. 두 자리 수까지만 사용하고, 받아올림이나 받아내림은 최소화해주세요.";
      case 'multiplication_division':
        return "초등학교 2~3학년 수준의 곱셈, 나눗셈 문제를 생성해주세요. 곱셈은 두 자리 수까지, 나눗셈은 한 자리 수로 나누는 문제로 제한해주세요.";
      default:
        return "초등학교 수준의 수학 문제를 생성해주세요.";
    }
  };

  const generateProblem = async () => {
    setLoading(true);
    setMessage('');
    setFeedback('');
    setShowReasoning(false);
    setUserAnswer('');
    setUserReasoning('');
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "system",
          content: `${getCategoryPrompt(category)} 문제와 정답을 JSON 형식으로 반환해주세요. 예: {"problem": "문제", "answer": "정답"}`
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

  const provideFeedback = async () => {
    setFeedbackLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "당신은 친절한 초등학교 수학 선생님입니다. 학생의 답과 풀이 과정을 분석하고, 격려하면서도 이해하기 쉽게 설명해주세요."
          },
          {
            role: "user",
            content: `
문제: ${problem}
정답: ${answer}
학생의 답: ${userAnswer}
학생의 풀이 과정: ${userReasoning}

학생의 답이 틀렸습니다. 어떤 부분에서 실수를 했는지, 어떻게 생각하면 좋을지 친절하게 설명해주세요.`
          }
        ],
      });

      setFeedback(response.choices[0].message.content || '');
    } catch (error) {
      console.error('Error generating feedback:', error);
      setFeedback('피드백을 생성하는 중 오류가 발생했습니다.');
    }
    setFeedbackLoading(false);
  };

  const checkAnswer = async () => {
    if (userAnswer === answer) {
      setMessage('정답입니다! 🎉');
      onCorrectAnswer();
      setTimeout(() => {
        generateProblem();
      }, 2000);
    } else {
      setMessage('틀렸습니다. 어떻게 풀었는지 설명해주세요!');
      setShowReasoning(true);
    }
  };

  const handleReasoningSubmit = async () => {
    if (!userReasoning.trim()) {
      setMessage('풀이 과정을 입력해주세요!');
      return;
    }
    await provideFeedback();
  };

  // 음성 입력이 완료되면 자동으로 정답을 체크합니다
  const handleVoiceResult = (result: string) => {
    setUserAnswer(result);
    // 음성 입력이 완료되면 바로 정답 체크
    setTimeout(() => {
      checkAnswer();
    }, 500); // 음성 결과가 state에 반영될 시간을 조금 주기 위해 약간의 딜레이를 줍니다
  };

  useEffect(() => {
    generateProblem();
  }, [category]);

  return (
    <div className="max-w-2xl mx-auto">
      <CategorySelector selectedCategory={category} onCategoryChange={setCategory} />
      <div className="bg-white p-8 rounded-lg shadow-lg">
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
              <div className="flex gap-2 items-start">
                <div className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  {userAnswer || '답을 말씀해주세요'}
                </div>
                <VoiceInput
                  onResult={handleVoiceResult}
                  placeholder="답 말하기"
                  isListening={isAnswerListening}
                  setIsListening={setIsAnswerListening}
                />
              </div>
            </div>
            {showReasoning && (
              <div className="mb-6">
                <label htmlFor="reasoning" className="block text-sm font-medium text-gray-700 mb-2">
                  어떻게 풀었는지 설명해주세요:
                </label>
                <div className="flex gap-2 items-start">
                  <textarea
                    id="reasoning"
                    value={userReasoning}
                    onChange={(e) => setUserReasoning(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    placeholder="풀이 과정을 설명해주세요"
                  />
                  <VoiceInput
                    onResult={setUserReasoning}
                    placeholder="설명 말하기"
                    isListening={isReasoningListening}
                    setIsListening={setIsReasoningListening}
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleReasoningSubmit}
                    disabled={feedbackLoading}
                    className={`flex-1 ${
                      feedbackLoading 
                        ? 'bg-green-300 cursor-not-allowed' 
                        : 'bg-green-500 hover:bg-green-600'
                    } text-white px-4 py-2 rounded-md transition-colors`}
                  >
                    {feedbackLoading ? '피드백 생성 중...' : '설명 제출하기'}
                  </button>
                  <button
                    onClick={() => {
                      setShowReasoning(false);
                      setMessage('');
                    }}
                    disabled={feedbackLoading}
                    className={`flex-1 ${
                      feedbackLoading 
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : 'bg-gray-500 hover:bg-gray-600'
                    } text-white px-4 py-2 rounded-md transition-colors`}
                  >
                    다시 풀기
                  </button>
                </div>
              </div>
            )}
            {!showReasoning && !feedback && (
              <div className="flex flex-col gap-4">
                <button
                  onClick={generateProblem}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                >
                  새로운 문제
                </button>
              </div>
            )}
            {message && (
              <div className={`mt-4 text-center ${message.includes('정답') ? 'text-green-600' : 'text-blue-600'}`}>
                {message}
              </div>
            )}
            {feedback && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2">선생님의 피드백:</h3>
                <p className="text-gray-700 whitespace-pre-line">{feedback}</p>
                <button
                  onClick={generateProblem}
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors w-full"
                >
                  새로운 문제 풀어보기
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 