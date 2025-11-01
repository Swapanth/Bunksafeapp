import { Config } from '../../config/AppConfig';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (Config.isProduction()) {
      // In production, only log warnings and errors
      return level >= LogLevel.WARN;
    }
    
    if (Config.shouldLogDebug()) {
      // In development with debug enabled, log everything
      return true;
    }
    
    // In development without debug, log info and above
    return level >= LogLevel.INFO;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] ${level}: ${message}`;
    
    if (data && typeof data === 'object') {
      return `${baseMessage} ${JSON.stringify(data)}`;
    }
    
    return data ? `${baseMessage} ${data}` : baseMessage;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  error(message: string, error?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorData = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
      } : error;
      
      console.error(this.formatMessage('ERROR', message, errorData));
    }
  }

  // Special method for sensitive data - never logs in production
  sensitive(message: string, data?: any): void {
    if (Config.isDevelopment() && Config.shouldLogDebug()) {
      console.log(this.formatMessage('SENSITIVE', message, data));
    }
  }
}

export const AppLogger = new Logger();
