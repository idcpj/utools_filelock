interface UToolsApi {
  onPluginEnter(callback: (action: { code: string; type: string; payload: any }) => void): void;
  getPayload(): any;
  showNotification(message: string): void;
}

declare const utools: UToolsApi;
