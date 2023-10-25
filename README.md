# watch-property-access

[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/watch_property_access/mod.ts) [![codecov](https://codecov.io/gh/esroyo/watch-property-access/graph/badge.svg?token=3E8LSQ50FS)](https://codecov.io/gh/esroyo/watch-property-access)

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

const testObjProxy = watchPropertyAccess(testObj);

/* Make some accesses (get) */

testObjProxy.foo;
testObjProxy.bar.baz[0];

/* Make some accesses (set) */

testObjProxy.bar.baz[0] = 4;

/**
 * "@@registry" property stores the registry Map.
 *
 * Let's show all the properties accessed so far..
 */

console.log(
    [...testObjProxy['@@registry'].keys()]
);

// [ "foo", "bar", "bar.baz", "bar.baz.[]" ]

/**
 * Each entry of the map has a key (string) representing the accessed
 * property with dot-notation and a value (object) with metadata
 * about the amount and the type of accesses.
 *
 * For example "bar.baz.[]" property (array) has had a total of 2 accesses:
 * 1 get operation + 1 set operation.
 */

console.log(
    testObjProxy['@@registry'].get('bar.baz.[]')
);

// { counters: { get: 1, set: 1, total: 2 }, property: "bar.baz.[]" }
```
