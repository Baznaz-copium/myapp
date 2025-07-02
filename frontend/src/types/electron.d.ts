interface ElectronAPI {
  on: (channel: string, listener: (...args: any[]) => void) => void;
  send: (channel: string, ...args: any[]) => void;
  removeListener: (channel: string, listener: (...args: any[]) => void) => void;
  invoke: (channel: string, ...args: any[]) => Promise<any>;
}

interface Window {
  electron: ElectronAPI;
}