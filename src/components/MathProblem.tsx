'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [isChecking, setIsChecking] = useState(false);

  // OpenAI 인스턴스를 ref로 관리
  const openaiRef = useRef(new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
    dangerouslyAllowBrowser: true
  }));

  // 초기 마운트 추적을 위한 ref
  const initialMountRef = useRef(true);
  const generatingRef = useRef(false);

  const getCategoryPrompt = useCallback((category: MathCategory) => {
    switch (category) {
      case 'addition_subtraction':
        return "유치원이나 초등학교 1학년 수준의 덧셈, 뺄셈 문제를 생성해주세요. 두 자리 수까지만 사용하고, 받아올림이나 받아내림은 최소화해주세요.";
      case 'multiplication_division':
        return "초등학교 2~3학년 수준의 곱셈, 나눗셈 문제를 생성해주세요. 곱셈은 두 자리 수까지, 나눗셈은 한 자리 수로 나누는 문제로 제한해주세요.";
      default:
        return "초등학교 수준의 수학 문제를 생성해주세요.";
    }
  }, []);

  const generateProblem = useCallback(async () => {
    // 이미 생성 중이면 중복 생성 방지
    if (generatingRef.current) return;
    
    generatingRef.current = true;
    setLoading(true);
    setMessage('');
    setFeedback('');
    setShowReasoning(false);
    setUserAnswer('');
    setUserReasoning('');
    
    console.log('=== 새로운 문제 생성 시작 ===');
    try {
      const response = await openaiRef.current.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "system",
          content: `${getCategoryPrompt(category)} 문제와 정답을 JSON 형식으로 반환해주세요. 예: {"problem": "문제", "answer": "정답"}`
        }],
      });

      const result = JSON.parse(response.choices[0].message.content || '');
      console.log('GPT가 생성한 문제:', result);
      
      setProblem(result.problem);
      setAnswer(result.answer);
      
      console.log('문제 상태 업데이트 완료:', {
        problem: result.problem,
        answer: result.answer,
        category
      });
      console.log('=== 새로운 문제 생성 완료 ===');
    } catch (error) {
      console.error('Error generating problem:', error);
      setMessage('문제 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      generatingRef.current = false;
    }
  }, [category, getCategoryPrompt]);

  // 카테고리가 변경될 때만 새로운 문제 생성
  useEffect(() => {
    // 초기 마운트 시에만 실행
    if (initialMountRef.current) {
      initialMountRef.current = false;
      generateProblem();
    } else if (!generatingRef.current) {
      // 카테고리 변경 시에만 실행 (초기 마운트가 아닐 때)
      generateProblem();
    }
  }, [category, generateProblem]);

  const checkAnswer = useCallback(async (currentAnswer: string) => {
    if (isChecking || !currentAnswer) return;

    setIsChecking(true);
    try {
      console.log('=== 답변 체크 시작 ===');
      const currentState = {
        problem,
        userAnswer: currentAnswer,
        category
      };
      console.log('현재 문제 상태:', currentState);

      const response = await openaiRef.current.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `당신은 초등학교 수학 선생님입니다. 
1. 주어진 문제를 풀어보세요.
2. 학생의 답변이 맞는지 판단해주세요.
3. 답변 형식:
   - 정답인 경우: "CORRECT: (칭찬과 함께 풀이 과정 설명)"
   - 오답인 경우: "INCORRECT: (격려와 함께 올바른 풀이 방법 설명)"`
          },
          {
            role: "user",
            content: `문제: ${currentState.problem}
학생의 답변: ${currentState.userAnswer}

이 답변이 정답인가요? 
학생이 "삼십육입니다"와 같이 한글로 답했거나, "36입니다"처럼 문장 형식으로 답했더라도 숫자만 추출해서 정답 여부를 판단해주세요.`
          }
        ],
      });

      const result = response.choices[0].message.content || '';
      console.log('GPT 응답:', result);
      console.log('=== 답변 체크 완료 ===');
      
      if (result.startsWith('CORRECT')) {
        setMessage('정답입니다! 🎉');
        onCorrectAnswer();
        setTimeout(generateProblem, 2000);
      } else {
        setMessage('틀렸습니다. 어떻게 풀었는지 설명해주세요!');
        setShowReasoning(true);
      }
    } catch (error) {
      console.error('Error checking answer:', error);
      setMessage('답변 확인 중 오류가 발생했습니다.');
    } finally {
      setIsChecking(false);
    }
  }, [category, generateProblem, isChecking, onCorrectAnswer, problem]);

  const handleVoiceResult = useCallback((result: string) => {
    setUserAnswer(result);
    console.log('음성 인식 결과 처리:', {
      recognizedAnswer: result,
      currentProblem: problem,
      currentCategory: category
    });
    checkAnswer(result);
  }, [category, checkAnswer, problem]);

  const provideFeedback = async () => {
    setFeedbackLoading(true);
    try {
      console.log('=== 피드백 생성 시작 ===');
      console.log('문제:', problem);
      console.log('학생 답변:', userAnswer);
      console.log('학생 풀이 과정:', userReasoning);

      const response = await openaiRef.current.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `당신은 친절한 초등학교 수학 선생님입니다. 
1. 주어진 문제를 풀어보세요.
2. 학생의 답과 풀이 과정을 분석해주세요.
3. 다음과 같은 내용을 포함하여 친절하게 설명해주세요:
   - 학생이 어떤 부분을 잘 이해했는지
   - 어떤 부분에서 실수했는지
   - 어떻게 생각하면 좋을지
   - 다음에 비슷한 문제를 만났을 때 도움이 될 조언`
          },
          {
            role: "user",
            content: `문제: ${problem}
학생의 답: ${userAnswer}
학생의 풀이 과정: ${userReasoning}

학생의 풀이 과정을 분석하고 도움이 되는 피드백을 제공해주세요.`
          }
        ],
      });

      const result = response.choices[0].message.content || '';
      console.log('GPT 피드백:', result);
      console.log('=== 피드백 생성 완료 ===');

      setFeedback(result);
    } catch (error) {
      console.error('Error generating feedback:', error);
      setFeedback('피드백을 생성하는 중 오류가 발생했습니다.');
    }
    setFeedbackLoading(false);
  };

  const handleReasoningSubmit = async () => {
    if (!userReasoning.trim()) {
      setMessage('풀이 과정을 입력해주세요!');
      return;
    }
    await provideFeedback();
  };

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
              {isChecking && (
                <p className="text-sm text-blue-600 mt-2">
                  답변을 확인하고 있습니다...
                </p>
              )}
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