import winston from "winston";

const { combine, timestamp, json, printf } = winston.format;

const customFormat = printf(
  ({ timestamp, level, message, ...meta }: any) => {
    let metaStr = "";
    if (Object.keys(meta).length > 0) {
      metaStr = `\nMeta: ${JSON.stringify(meta, null, 2)}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}`;
  }
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(timestamp(), json(), customFormat),
  defaultMeta: {},
  transports: [new winston.transports.Console()],
});

export default logger;