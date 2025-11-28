/**
 * Frontend Logging Utility
 * Logs vào console với format đẹp và có thể lưu vào localStorage
 * Tự động ghi thông tin về file, line number, function name
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  file?: string;
  line?: number;
  function?: string;
  stack?: string;
  meta?: Record<string, any>;
}

class FrontendLogger {
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100; // Giới hạn số lượng log trong history
  private enableLocalStorage = false; // Có lưu vào localStorage không
  private enableConsole = true; // Có log vào console không

  /**
   * Lấy thông tin về file, line, function từ stack trace
   */
  private getCallerInfo(): { file?: string; line?: number; function?: string } {
    try {
      const stack = new Error().stack;
      if (!stack) return {};

      const stackLines = stack.split('\n');
      // Bỏ qua 3 dòng đầu (Error, getCallerInfo, log method)
      for (let i = 3; i < stackLines.length; i++) {
        const line = stackLines[i];
        // Bỏ qua các file node_modules, vite, và các file system
        if (line.includes('node_modules') || 
            line.includes('vite') || 
            line.includes('@vite') ||
            line.includes('logger.ts')) {
          continue;
        }

        // Parse stack trace line: "at functionName (file:///path/to/file.ts:123:45)"
        const match = line.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/);
        if (match) {
          const functionName = match[1]?.trim() || 'anonymous';
          const file = match[2]?.split('/').pop() || match[2]; // Lấy tên file
          const lineNumber = parseInt(match[3], 10);
          return { file, line: lineNumber, function: functionName };
        }
      }
    } catch (err) {
      // Ignore errors in stack parsing
    }
    return {};
  }

  /**
   * Format log message với colors và style
   */
  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp;
    const level = entry.level.toUpperCase().padEnd(5);
    const location = entry.file && entry.line
      ? ` | ${entry.file}:${entry.line}${entry.function ? ` (${entry.function})` : ''}`
      : '';
    
    const metaStr = entry.meta && Object.keys(entry.meta).length 
      ? ` | ${JSON.stringify(entry.meta)}` 
      : '';
    
    return `${timestamp} | ${level} | ${entry.message}${location}${metaStr}`;
  }

  /**
   * Lưu log vào history và localStorage (nếu bật)
   */
  private saveLog(entry: LogEntry): void {
    // Thêm vào history
    this.logHistory.push(entry);
    
    // Giới hạn kích thước history
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // Lưu vào localStorage nếu bật
    if (this.enableLocalStorage && typeof window !== 'undefined' && window.localStorage) {
      try {
        const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
        logs.push(entry);
        
        // Giới hạn số lượng log trong localStorage (giữ 500 log gần nhất)
        if (logs.length > 500) {
          logs.splice(0, logs.length - 500);
        }
        
        localStorage.setItem('app_logs', JSON.stringify(logs));
      } catch (err) {
        // Ignore localStorage errors
      }
    }
  }

  /**
   * Log vào console với format và color
   */
  private logToConsole(entry: LogEntry): void {
    if (!this.enableConsole) return;

    const formatted = this.formatMessage(entry);
    const style = this.getConsoleStyle(entry.level);

    switch (entry.level) {
      case 'error':
        console.error(`%c${formatted}`, style, entry.stack || '');
        break;
      case 'warn':
        console.warn(`%c${formatted}`, style);
        break;
      case 'debug':
        console.debug(`%c${formatted}`, style);
        break;
      default:
        console.log(`%c${formatted}`, style);
    }
  }

  /**
   * Lấy style cho console log theo level
   */
  private getConsoleStyle(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      error: 'color: #ff0000; font-weight: bold;',
      warn: 'color: #ffa500; font-weight: bold;',
      info: 'color: #0066cc; font-weight: normal;',
      debug: 'color: #666666; font-weight: normal;',
    };
    return styles[level] || styles.info;
  }

  /**
   * Tạo log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    meta?: Record<string, any>,
    error?: Error
  ): LogEntry {
    const callerInfo = this.getCallerInfo();
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 23);

    return {
      timestamp,
      level,
      message,
      file: callerInfo.file,
      line: callerInfo.line,
      function: callerInfo.function,
      stack: error?.stack,
      meta,
    };
  }

  /**
   * Public logging methods
   */
  info(message: string, meta?: Record<string, any>): void {
    const entry = this.createLogEntry('info', message, meta);
    this.logToConsole(entry);
    this.saveLog(entry);
  }

  warn(message: string, meta?: Record<string, any>): void {
    const entry = this.createLogEntry('warn', message, meta);
    this.logToConsole(entry);
    this.saveLog(entry);
  }

  error(message: string, error?: Error | Record<string, any>, meta?: Record<string, any>): void {
    const err = error instanceof Error ? error : undefined;
    const metaData = error instanceof Error ? meta : (error || meta);
    const entry = this.createLogEntry('error', message, metaData, err);
    this.logToConsole(entry);
    this.saveLog(entry);
  }

  debug(message: string, meta?: Record<string, any>): void {
    const entry = this.createLogEntry('debug', message, meta);
    this.logToConsole(entry);
    this.saveLog(entry);
  }

  /**
   * Cấu hình logger
   */
  configure(options: {
    enableConsole?: boolean;
    enableLocalStorage?: boolean;
    maxHistorySize?: number;
  }): void {
    if (options.enableConsole !== undefined) {
      this.enableConsole = options.enableConsole;
    }
    if (options.enableLocalStorage !== undefined) {
      this.enableLocalStorage = options.enableLocalStorage;
    }
    if (options.maxHistorySize !== undefined) {
      this.maxHistorySize = options.maxHistorySize;
    }
  }

  /**
   * Lấy log history
   */
  getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  /**
   * Xóa log history
   */
  clearHistory(): void {
    this.logHistory = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('app_logs');
    }
  }

  /**
   * Lấy logs từ localStorage
   */
  getLogsFromStorage(): LogEntry[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    try {
      return JSON.parse(localStorage.getItem('app_logs') || '[]');
    } catch {
      return [];
    }
  }
}

// Export singleton instance
export const logger = new FrontendLogger();

// Export class for custom instances
export { FrontendLogger };

// Export types
export type { LogEntry, LogLevel };

