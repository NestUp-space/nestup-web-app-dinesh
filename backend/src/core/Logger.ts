import { createLogger, format, transports, addColors } from "winston";
import { LOGGER_MSG_COLORS, LOGGER_MSG_ICONS } from "@constants";
import { environment } from "@config";

const { combine, colorize, label, timestamp, printf } = format;

const logLevel = ["development","local"].includes(environment) ? "debug" : "warn";

const customFormat = format.combine(
  colorize({ all: true }),
  label({ label: "[LOGGER]" }),
  timestamp({ format: "YY-MM-DD HH:MM:SS" }),
  printf((info) => {
    const cleanLevel = info.level.replace(/\u001b\[.*?m/g, "");
    const pre =
      LOGGER_MSG_ICONS[cleanLevel as keyof typeof LOGGER_MSG_ICONS] || "";

    return ` ${pre}${info.label} ${info.timestamp} ${info.level}: ${info.message} ${JSON.stringify(info)}`;
  })
);

addColors(LOGGER_MSG_COLORS);

const logger = createLogger({
  level: "info",
  transports: [
    new transports.Console({ level: logLevel, format: combine(customFormat) }),
  ],
});

export default logger;
