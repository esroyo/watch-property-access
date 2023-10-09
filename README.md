# watch-property-access

[![codecov](https://codecov.io/gh/esroyo/watch-property-access/graph/badge.svg?token=3E8LSQ50FS)](https://codecov.io/gh/esroyo/watch-property-access)

A simple utility to register deep access to properties of an object.

## Example usage

```js
import { watchPropertyAccess } from './mod.ts';

const testObj = {
    foo: 'foo',
    bar: {
        baz: [1, 2, 3],
    },
};

/* Wrap your object and use it as usual */

const proxy = watchPropertyAccess(testObj);

/* Make some accesses (get) */

proxy.foo;
proxy.bar.baz[0];

/* Make some accesses (set) */

proxy.bar.baz[0] = 4;

/* "@@registry" property gets the registry Map */

console.log(
    [...proxy['@@registry'].keys()]
);

// [ "foo", "bar", "bar.baz", "bar.baz.[]" ]

/**
 * Each item in the map has a key with dot-notation and a counter object
 * that keeps track of the amount and the type of accesses.
 * "bar.baz.[]" array has had a total of 2 accesses,
 * 1 get operation and 1 set operation.
 */

console.log(
    proxy['@@registry'].get('bar.baz.[]')
);

// { counters: { get: 1, set: 1, total: 2 }, property: "bar.baz.[]" }
```
