'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { OpenAI } from 'openai';
import VoiceInput from './VoiceInput';

type MessageRole = 'system' | 'user' | 'assistant';

interface Message {
  role: MessageRole;
  content: string;
}

interface ChatInterfaceProps {
  problem: string;
  userAnswer: string;
  openaiRef: React.RefObject<OpenAI>;
  onClose: () => void;
}

export default function ChatInterface({ problem, userAnswer, openaiRef, onClose }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system' as MessageRole,
      content: `당신은 친절한 수학 선생님입니다. 학생이 문제 풀이 과정을 스스로 이해할 수 있도록 소크라테스식 문답법으로 대화를 이끌어주세요.
1. 직접적인 답을 알려주지 말고, 학생이 스스로 생각할 수 있는 질문을 해주세요.
2. 학생의 답변이 틀렸더라도 부정하지 말고, 왜 그렇게 생각했는지 물어보세요.
3. 학생이 올바른 방향으로 생각할 수 있도록 힌트가 될 만한 질문을 해주세요.
4. 학생이 문제를 완전히 이해했다고 판단되면, 칭찬과 함께 대화를 마무리해주세요.`
    },
    {
      role: 'assistant' as MessageRole,
      content: `안녕하세요! 방금 푼 문제를 같이 살펴볼까요?
문제: ${problem}
학생의 답: ${userAnswer}

어떤 방법으로 이 답을 구했는지 설명해주시겠어요?`
    }
  ]);

  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = useCallback(async (userMessage: string) => {
    if (!openaiRef.current || isThinking) return;

    const userMessageObj: Message = {
      role: 'user' as MessageRole,
      content: userMessage
    };

    const newMessages = [...messages, userMessageObj];
    setMessages(newMessages);
    setIsThinking(true);

    try {
      const response = await openaiRef.current.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: newMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
      });

      const assistantMessage: Message = {
        role: 'assistant' as MessageRole,
        content: response.choices[0].message.content || ''
      };
      
      setMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error('Error getting response:', error);
      const errorMessage: Message = {
        role: 'assistant' as MessageRole,
        content: '죄송합니다. 응답을 받는 중에 오류가 발생했습니다. 다시 시도해주세요.'
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  }, [messages, openaiRef, isThinking]);

  // 새 메시지가 추가될 때마다 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-lg shadow-lg">
      {/* 헤더 */}
      <div className="flex justify-between items-center px-4 py-3 border-b">
        <h3 className="text-lg font-semibold">선생님과 대화하기</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          message.role !== 'system' && (
            <div
              key={index}
              className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'assistant'
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-green-100 text-green-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          )
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <VoiceInput
            onResult={handleSendMessage}
            placeholder="선생님과 대화하기"
            isListening={isListening}
            setIsListening={setIsListening}
          />
        </div>
      </div>
    </div>
  );
} 