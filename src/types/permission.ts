export interface PermissionState {
  microphone: {
    granted: boolean;
    loading: boolean;
    error: string | null;
  };
}

export interface PermissionContextType {
  permissions: PermissionState;
  requestMicrophonePermission: () => Promise<boolean>;
} 