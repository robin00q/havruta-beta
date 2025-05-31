'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface VoiceInputProps {
  onResult: (result: string) => void;
  placeholder: string;
  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
}

export default function VoiceInput({ onResult, placeholder, isListening, setIsListening }: VoiceInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const recognitionRef = useRef<any>(null);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
      setIsListening(false);
      setIsActive(false);
    }
  }, [setIsListening]);

  const startRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setIsActive(true);
        setError(null);
      } catch (error) {
        console.error('Error starting recognition:', error);
        setError('마이크 시작 중 오류가 발생했습니다.');
        setIsListening(false);
        setIsActive(false);
      }
    }
  }, [setIsListening]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !recognitionRef.current) {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'ko-KR';

        recognition.onstart = () => {
          console.log('Voice recognition started');
          setIsActive(true);
          setIsListening(true);
          setError(null);
        };

        recognition.onresult = (event: any) => {
          const result = event.results[0][0].transcript;
          console.log('Voice recognition result:', result);
          onResult(result);
          stopRecognition();
        };

        recognition.onend = () => {
          console.log('Voice recognition ended');
          setIsActive(false);
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error('Recognition error:', event.error);
          let errorMessage = '음성 인식 중 오류가 발생했습니다.';
          
          switch (event.error) {
            case 'no-speech':
              errorMessage = '음성이 감지되지 않았습니다. 다시 시도해주세요.';
              break;
            case 'aborted':
              errorMessage = '음성 인식이 중단되었습니다. 다시 시도해주세요.';
              break;
            case 'network':
              errorMessage = '네트워크 오류가 발생했습니다.';
              break;
            case 'not-allowed':
            case 'permission-denied':
              errorMessage = '마이크 사용 권한이 없습니다.';
              break;
          }
          
          setError(errorMessage);
          setIsActive(false);
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setError('이 브라우저는 음성 인식을 지원하지 않습니다.');
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Error stopping recognition on cleanup:', error);
        }
      }
    };
  }, [onResult, setIsListening, stopRecognition]);

  const handleToggle = useCallback(() => {
    if (isActive) {
      stopRecognition();
    } else {
      startRecognition();
    }
  }, [isActive, startRecognition, stopRecognition]);

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-white transition-all duration-200 ${
          isActive 
            ? 'bg-red-500 hover:bg-red-600 shadow-lg scale-105' 
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
            />
          </svg>
          {isActive && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </div>
        <span className="whitespace-nowrap font-medium">
          {isActive ? '말하는 중... (클릭하여 종료)' : '여기를 눌러서 답 말하기'}
        </span>
      </button>
      {error && (
        <p className="text-sm text-red-600 mt-1 bg-red-50 px-3 py-1 rounded-md">
          {error}
        </p>
      )}
    </div>
  );
} 