# watch-property-access

## Example usage

```js
import { watchPropertyAccess } from './src/main.ts';

const testObj = {
  foo: 'foo',
  bar: {
    baz: [1, 2, 3],
  },
};

/* Wrap your object and use it as normal */

const proxy = watchPropertyAccess(testObj);

/* Make some accesses */

proxy.foo;
proxy.bar.baz[0];
proxy.bar.baz[0] = 4;

/* "@@registry" prop gives access to the registry Map */

console.log([...proxy['@@registry'].keys()]);
// [ "foo", "bar", "bar.baz", "bar.baz.[]" ]

/**
 * Each item in the map has a key with dot-notation and a counter object
 * that keeps track of amount and type of accesses.
 * "bar.baz.[]" array has had a total of 2 accesses (1 get operation and 1 set operation)
 */

console.log(proxy['@@registry'].get('bar.baz.[]'));

// { counters: { get: 1, set: 1, total: 2 }, property: "bar.baz.[]" }
```
