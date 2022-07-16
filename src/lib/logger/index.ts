import winston from "winston";

const format = winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple(),
    winston.format.errors({ stack: true}),
);

export function getLogger(name: string = import.meta.url) {
    return winston.createLogger({
        level: "info",
        format,
        defaultMeta: { service: "flashy-bot", name: name },
        transports: [
            new winston.transports.Console({ format }),
        ],
    });
}
