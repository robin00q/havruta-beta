'use client';

import { useState, useEffect, useCallback } from 'react';
import { SpeechRecognitionResult } from '@/types/speechTypes';

interface VoiceInputProps {
  onResult: (result: string) => void;
  placeholder: string;
  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
}

export default function VoiceInput({ onResult, placeholder, isListening, setIsListening }: VoiceInputProps) {
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ko-KR';

        recognition.onresult = (event: any) => {
          const result = event.results[event.results.length - 1];
          const text = result[0].transcript;
          if (result.isFinal) {
            onResult(text);
            setIsListening(false);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognition);
      }
    }
  }, [onResult, setIsListening]);

  useEffect(() => {
    if (recognition) {
      if (isListening) {
        recognition.start();
      } else {
        recognition.stop();
      }
    }
  }, [isListening, recognition]);

  return (
    <button
      onClick={() => setIsListening(!isListening)}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-white transition-colors ${
        isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
        />
      </svg>
      {isListening ? '녹음 중...' : placeholder}
    </button>
  );
} 