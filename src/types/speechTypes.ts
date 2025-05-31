declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

export interface SpeechRecognitionResult {
  text: string;
  isFinal: boolean;
} 