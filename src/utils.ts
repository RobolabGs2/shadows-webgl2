export namespace Rand {
    export function range(min = 0, max = 1) {
        return Math.random() * (max - min) + min
    }
    export function signed(max = 1, min = 0) {
        return sign() * range(min, max);
    }
    export function sign() {
        return Math.random() > 0.5 ? 1 : -1
    }
}

export function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise(function (resolve, reject) {
        let img = new Image();
        img.crossOrigin = 'anonymous'
        img.onload = function () {
            return resolve(img);
        };
        img.onerror = function () {
            return reject(new Error(`Can't load image ${url}`));
        };
        img.src = url;
    });
}

export function mapRecord<K extends string, T1, T2>(record: Record<K, T1>, map: (value: T1, key: K) => T2): Record<K, T2> {
    return Object.fromEntries(Object.entries<T1>(record).map(([key, value]) => {
        return [key, map(value, key as K)];
    })) as Record<K, T2>;
}

export type RecursivePartial<T> = {
    [P in keyof T]?:
    T[P] extends (infer U)[] ? RecursivePartial<U>[] :
    T[P] extends object ? RecursivePartial<T[P]> :
    T[P];
};

export function Merge<T>(defaults: T, value: RecursivePartial<T>): T {
    for (let x in defaults) {
        const actual = value[x];
        if (actual === undefined) {
            value[x] = Copy(defaults[x]) as any;
        } else if (typeof actual === "object") {
            Merge(defaults[x], actual as T[typeof x]);
        }
    }
    return value as T;
}

export function downloadImages<T extends string>(urlsMap: Record<T, string>): Promise<Record<T, HTMLImageElement>> {
    const urls = Object.entries<string>(urlsMap);
    return Promise.all(urls.map(([_, url]) => url).map(loadImage)).then(images =>
        Object.fromEntries(images.map((img, i) => ([urls[i][0], img]))) as Record<T, HTMLImageElement>
    );
}


function Copy<T>(c: T): T {
	return JSON.parse(JSON.stringify(c)) as T;
}

export function loadSettingsFromURL<T extends Record<string, any>>(defaults: T): T {
    const url = new URL(location.href);
    return Object.fromEntries(Object.entries(defaults).map(([key, defaultValue]) =>
        [key, getOrDefault(key, defaultValue, url.searchParams)]
    )) as T
}

function getOrDefault<T>(key: string, origin: T, params: URLSearchParams): T {
    const hasKey = params.has(key);
    const value = params.get(key);
    switch (typeof origin) {
        case "string":
            return (hasKey ? value : origin) as unknown as T;
        case "number":
            return (hasKey ? Number(value) : origin) as unknown as T;
        case "boolean":
            return (hasKey ? (value !== "false") : origin) as unknown as T;
        default:
            throw new Error(`type ${typeof origin} does not supported`);
    }
}