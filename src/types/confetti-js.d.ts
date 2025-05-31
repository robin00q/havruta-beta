declare module 'confetti-js' {
  interface ConfettiSettings {
    target?: string;
    max?: number;
    size?: number;
    animate?: boolean;
    respawn?: boolean;
    clock?: number;
    props?: string[];
    colors?: string[];
    start_from_edge?: boolean;
    width?: number;
    height?: number;
    rotate?: boolean;
  }

  interface Confetti {
    render: () => void;
    clear: () => void;
  }

  function create(canvasId: string, settings?: ConfettiSettings): Confetti;

  export = {
    create
  };
} 