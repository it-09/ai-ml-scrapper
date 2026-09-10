import { log } from "apify";

export const logger = {
  info: (msg: string, data?: Record<string, unknown>): void => {
    log.info(msg, data);
  },
  warn: (msg: string, data?: Record<string, unknown>): void => {
    log.warning(msg, data);
  },
  error: (msg: string, data?: Record<string, unknown>): void => {
    log.error(msg, data);
  },
  debug: (msg: string, data?: Record<string, unknown>): void => {
    log.debug(msg, data);
  },
};
