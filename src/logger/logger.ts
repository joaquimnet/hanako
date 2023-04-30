import winston, { LoggerOptions } from 'winston';
import { MODE } from './mode';
import { createErrorLogger, createMiddleware } from './middleware';

interface HanakoLoggingOptions {
  logger?: Partial<LoggerOptions>;
  mode?: MODE;
  environment?: string;
  app: string;
  hanakoServer: string;
}

export function createLogger(options: HanakoLoggingOptions) {
  const serverUrl = options.hanakoServer;

  let serverUrlParsed;

  try {
    serverUrlParsed = new URL(serverUrl);
  } catch {
    throw new Error(`Invalid Hanako server url: ${serverUrl}`);
  }

  const host = serverUrlParsed.hostname;
  const port: number | undefined = serverUrlParsed.port ? parseInt(serverUrlParsed.port) : undefined;
  const path = serverUrlParsed.pathname;

  const mode = options?.mode || MODE.DEVELOPMENT;

  const transports = [];

  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  );

  if (mode === MODE.PRODUCTION) {
    transports.push(
      new winston.transports.Http({
        level: 'debug',
        host,
        port,
        path,
        batchInterval: 5000,
        batchCount: 10,
        batch: true,
      }),
    );
  }

  const loggerOptions = {
    ...(options?.logger || {}),
    format: winston.format.json(),
    transports,
  };

  const logger = winston.createLogger({
    ...loggerOptions,
    defaultMeta: { app: options.app, environment: options.environment, timestamp: Date.now() },
  });

  const meta = {
    app: options.app!,
    environment: options.environment!,
  };

  const requestLogger = createMiddleware(loggerOptions, mode, meta);
  const errorLogger = createErrorLogger(loggerOptions, mode, meta);

  return {
    logger,
    requestLogger,
    errorLogger,
  };
}
