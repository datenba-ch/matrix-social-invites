const parseBoolean = (value) => {
    if (!value)
        return false;
    return ["true", "1", "yes"].includes(value.toLowerCase());
};
export const getRedisClientOptions = () => {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
        const tlsInsecure = parseBoolean(process.env.REDIS_TLS_INSECURE);
        if (tlsInsecure) {
            try {
                const url = new URL(redisUrl);
                if (url.protocol === "rediss:") {
                    return {
                        url: redisUrl,
                        socket: {
                            tls: true,
                            rejectUnauthorized: false,
                        },
                    };
                }
            }
            catch {
                // Fall through to default URL usage.
            }
        }
        return { url: redisUrl };
    }
    const host = process.env.REDIS_HOST;
    if (!host) {
        return null;
    }
    const port = Number(process.env.REDIS_PORT ?? 6379);
    const tls = parseBoolean(process.env.REDIS_TLS);
    const tlsInsecure = parseBoolean(process.env.REDIS_TLS_INSECURE);
    return {
        socket: {
            host,
            port,
            ...(tls
                ? {
                    tls: true,
                    ...(tlsInsecure ? { rejectUnauthorized: false } : {}),
                }
                : {}),
        },
        username: process.env.REDIS_USER || undefined,
        password: process.env.REDIS_PASS || undefined,
    };
};
export const getRedisConnectionInfo = () => {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
        try {
            const url = new URL(redisUrl);
            const tls = url.protocol === "rediss:";
            return {
                host: url.hostname,
                port: Number(url.port || 6379),
                username: url.username ? decodeURIComponent(url.username) : undefined,
                password: url.password ? decodeURIComponent(url.password) : undefined,
                tls,
                tlsInsecure: parseBoolean(process.env.REDIS_TLS_INSECURE),
            };
        }
        catch {
            return null;
        }
    }
    const host = process.env.REDIS_HOST;
    if (!host) {
        return null;
    }
    return {
        host,
        port: Number(process.env.REDIS_PORT ?? 6379),
        username: process.env.REDIS_USER || undefined,
        password: process.env.REDIS_PASS || undefined,
        tls: parseBoolean(process.env.REDIS_TLS),
        tlsInsecure: parseBoolean(process.env.REDIS_TLS_INSECURE),
    };
};
