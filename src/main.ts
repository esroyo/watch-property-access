const registryTag = '@@registry';

type RegistryItem = {
    property: string;
    counters: {
        get: number;
        set: number;
        total: number;
    };
};

type Registry = Map<string, RegistryItem>;

type TraceAccess<T = any> =
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

function _watchAccess<T extends object>(
    target: T,
    onlyOwnProperty: boolean,
    registry: Registry,
    path: string,
): TraceAccess<T> {
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
                const fullPath = `${path}${
                    isNumeric(property) ? '[]' : String(property)
                }`;
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
                    return _watchAccess(
                        value,
                        onlyOwnProperty,
                        registry,
                        `${fullPath}.`,
                    );
                }
            }
            return value;
        },
        set(...args) {
            const [target, property, value, receiver] = args;
            const fullPath = `${path}${
                isNumeric(property) ? '[]' : String(property)
            }`;
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
    }) as TraceAccess<T>;
}

export function watchPropertyAccess<T extends object>(
    target: T,
    onlyOwnProperty = true,
): TraceAccess<T> {
    return _watchAccess(target, onlyOwnProperty, new Map(), '');
}
