import expressWinston, { LoggerOptions } from 'express-winston';
import winston from 'winston';
import { Request } from 'express';
import { MODE } from './mode';

export function createMiddleware(options: LoggerOptions, mode: MODE, meta: Record<string, string>) {
  const msg = `{{req.ip}} {{req.method}} {{req.url}} HTTP/{{req.httpVersion}} {{res.statusCode}} {{res.contentLength}} - {{res.responseTime}}ms`;

  return expressWinston.logger({
    level: 'http',
    format: winston.format.combine(winston.format.colorize(), winston.format.json()),
    meta: mode === MODE.PRODUCTION,
    msg,
    expressFormat: false,
    colorize: mode === MODE.DEVELOPMENT,
    dynamicMeta: createDynamicMeta(meta),
    ...options,
  });
}

export function createErrorLogger(options: LoggerOptions, mode: MODE, meta: Record<string, string>) {
  return expressWinston.errorLogger({
    level: 'error',
    format: winston.format.combine(winston.format.colorize(), winston.format.json()),
    meta: mode === MODE.PRODUCTION,
    expressFormat: false,
    colorize: mode === MODE.DEVELOPMENT,
    dynamicMeta: createDynamicMeta(meta),
    ...options,
  });
}

function createDynamicMeta(meta: Record<string, string>) {
  return function dynamicMeta(req: Request) {
    return {
      ...meta,
      user: (req as any).user,
      timestamp: Date.now(),
    };
  };
}
