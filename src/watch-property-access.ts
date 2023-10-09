const registryTag = '@@registry';

type WatchPropertyAccessOptions = {
    /**
     * Register only own property accesses.
     * Defaults to true.
     */
    onlyOwnProperty?: boolean;
    /**
     * Summarize array index accesses.
     * Defaults to true.
     */
    compact?: boolean;
};

type RegistryItem = {
    property: string;
    counters: {
        get: number;
        set: number;
        total: number;
    };
};

type Registry = Map<string, RegistryItem>;

type ProxyObject<T = any> =
    & T
    & { [registryTag]: Registry };

function createRegistryItem(property: string) {
    return {
        counters: {
            get: 0,
            set: 0,
            total: 0,
        },
        property,
    };
}

function isNumeric(possiblyNumeric: string | symbol): boolean {
    return typeof possiblyNumeric === 'string' &&
        !Number.isNaN(parseFloat(possiblyNumeric)) &&
        Number.isFinite(Number(possiblyNumeric));
}

function buildPath(path: string, property: string | symbol, compact: boolean) {
    const isArrayAccess = isNumeric(property);
    const effectiveAccumulatedPath = isArrayAccess && path.slice(-1) === '.'
        ? path.slice(0, -1)
        : path;
    const defaultString = String(property);
    const effectiveString = isArrayAccess
        ? (compact ? '[]' : `[${defaultString}]`)
        : defaultString;
    const finalPath = `${effectiveAccumulatedPath}${effectiveString}`;
    return finalPath;
}

function _watchPropertyAccess<T extends object>(
    target: T,
    options: Required<WatchPropertyAccessOptions>,
    registry: Registry,
    path: string,
): ProxyObject<T> {
    const {
        compact,
        onlyOwnProperty,
    } = options;
    return new Proxy(target, {
        get(...args) {
            const [target, property, receiver] = args;
            if (property === registryTag) {
                return registry;
            }
            const isOwnProperty = Object.hasOwn(target, property);
            const shouldRegister = onlyOwnProperty === false || isOwnProperty;
            const value = Reflect.get(...args);
            const valueType = typeof value;
            if (shouldRegister) {
                const fullPath = buildPath(path, property, compact);
                let registryItem = registry.get(fullPath);
                if (!registryItem) {
                    registryItem = createRegistryItem(fullPath);
                    registry.set(fullPath, registryItem);
                }
                registryItem.counters.get += 1;
                registryItem.counters.total += 1;
                const desc = Object.getOwnPropertyDescriptor(target, property);
                if (
                    value &&
                    (valueType === 'object' || valueType === 'function')
                ) {
                    if (desc && !desc.writable && !desc.configurable) {
                        return value;
                    }
                    return _watchPropertyAccess(
                        value,
                        options,
                        registry,
                        `${fullPath}.`,
                    );
                }
            }
            return value;
        },
        set(...args) {
            const [target, property, value, receiver] = args;
            const fullPath = buildPath(path, property, compact);
            if (property === registryTag) {
                return false;
            }
            let registryItem = registry.get(fullPath);
            if (!registryItem) {
                registryItem = createRegistryItem(fullPath);
                registry.set(fullPath, registryItem);
            }
            registryItem.counters.set += 1;
            registryItem.counters.total += 1;
            return Reflect.set(...args);
        },
    }) as ProxyObject<T>;
}

const defaultOptions: WatchPropertyAccessOptions = {
    onlyOwnProperty: true,
    compact: true,
};

export function watchPropertyAccess<T extends object>(
    target: T,
    options?: WatchPropertyAccessOptions,
): ProxyObject<T> {
    const effectiveOptions = { ...defaultOptions, ...options } as Required<
        WatchPropertyAccessOptions
    >;
    return _watchPropertyAccess(target, effectiveOptions, new Map(), '');
}
