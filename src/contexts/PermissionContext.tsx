import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { PermissionState, PermissionContextType } from '@/types/permission';

const PermissionContext = createContext<PermissionContextType | null>(null);

export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
};

interface PermissionProviderProps {
  children: ReactNode;
}

export const PermissionProvider = ({ children }: PermissionProviderProps) => {
  const [permissions, setPermissions] = useState<PermissionState>({
    microphone: {
      granted: false,
      loading: false,
      error: null,
    },
  });

  const requestMicrophonePermission = useCallback(async () => {
    try {
      setPermissions(prev => ({
        ...prev,
        microphone: { ...prev.microphone, loading: true, error: null },
      }));

      // 브라우저 지원 확인
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('이 브라우저는 마이크 사용을 지원하지 않습니다.');
      }

      // 권한 상태 확인 (Chrome 79+ 지원)
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        if (permissionStatus.state === 'granted') {
          setPermissions(prev => ({
            ...prev,
            microphone: { granted: true, loading: false, error: null },
          }));
          return true;
        }
      }

      // 실제 마이크 접근 요청
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setPermissions(prev => ({
        ...prev,
        microphone: { granted: true, loading: false, error: null },
      }));
      
      return true;
    } catch (error: any) {
      let errorMessage = '마이크 권한을 확인하는 중 오류가 발생했습니다.';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = '마이크 사용 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = '마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = '마이크에 접근할 수 없습니다. 다른 앱이 사용 중인지 확인해주세요.';
      }

      setPermissions(prev => ({
        ...prev,
        microphone: { granted: false, loading: false, error: errorMessage },
      }));
      
      return false;
    }
  }, []);

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        requestMicrophonePermission,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}; 