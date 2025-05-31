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
      role: 'system',
      content: `당신은 친절한 수학 선생님입니다. 학생이 문제 풀이 과정을 스스로 이해할 수 있도록 소크라테스식 문답법으로 대화를 이끌어주세요.

1. 직접적인 답을 알려주지 말고, 학생이 스스로 생각할 수 있는 질문을 해주세요.
2. 학생의 답변이 틀렸더라도 부정하지 말고, 왜 그렇게 생각했는지 물어보세요.
3. 학생이 올바른 방향으로 생각할 수 있도록 힌트가 될 만한 질문을 해주세요.
4. 학생이 문제를 완전히 이해했다고 판단되면, 칭찬과 함께 대화를 마무리해주세요.

문제: ${problem}
학생의 답: ${userAnswer}`
    }
  ]);

  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const conversationHistoryRef = useRef<Message[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = useCallback(async (userMessage: string) => {
    if (!openaiRef.current || isThinking) return;

    // 이전 요청이 있다면 중단
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const userMessageObj: Message = {
      role: 'user',
      content: userMessage
    };

    // 대화 히스토리에 사용자 메시지 추가
    conversationHistoryRef.current = [...conversationHistoryRef.current, userMessageObj];
    
    const newMessages = [...messages, userMessageObj];
    setMessages(newMessages);
    setIsThinking(true);

    // 새로운 AbortController 생성
    abortControllerRef.current = new AbortController();

    try {
      const response = await openaiRef.current.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          // 시스템 메시지
          messages[0],
          // 이전 대화 히스토리
          ...conversationHistoryRef.current
        ],
        stream: true
      });

      let fullContent = '';
      const assistantMessage: Message = {
        role: 'assistant',
        content: ''
      };
      setMessages([...newMessages, assistantMessage]);

      for await (const chunk of response) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        const content = chunk.choices[0]?.delta?.content || '';
        fullContent += content;
        
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: fullContent
          };
          return updated;
        });
      }

      // 대화 히스토리에 어시스턴트 응답 추가
      conversationHistoryRef.current = [
        ...conversationHistoryRef.current,
        { role: 'assistant', content: fullContent }
      ];

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      console.error('Error in chat session:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: '죄송합니다. 대화 중에 오류가 발생했습니다. 다시 시도해주세요.'
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  }, [messages, openaiRef, isThinking]);

  // 컴포넌트 마운트 시 초기 메시지 전송
  useEffect(() => {
    handleSendMessage("안녕하세요! 문제를 풀어보았어요.");
  }, []);

  // 새 메시지가 추가될 때마다 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 컴포넌트 언마운트 시 진행 중인 요청 중단
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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