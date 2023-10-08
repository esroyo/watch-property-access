import { assert, assertEquals, assertExists } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { watchPropertyAccess } from './main.ts';

Deno.test("should register plain prop get access", () => {
  const target = {
    foo: {
      bar: 1,
    },
  };
  const proxied = watchPropertyAccess(target);
  assertExists(proxied.foo);
  assertEquals(proxied["@@registry"].get('foo')?.counters?.total, 1);
  assertEquals(proxied["@@registry"].get('foo')?.counters?.get, 1);
  assertEquals(proxied["@@registry"].get('foo')?.counters?.set, 0);
});

Deno.test("should register nested prop get access", () => {
  const target = {
    foo: {
      bar: {
        baz: 1
      },
    },
  };
  const proxied = watchPropertyAccess(target);
  assertEquals(proxied.foo.bar.baz, 1);
  assertEquals(proxied["@@registry"].get('foo.bar.baz')?.counters?.total, 1);
  assertEquals(proxied["@@registry"].get('foo.bar.baz')?.counters?.get, 1);
  assertEquals(proxied["@@registry"].get('foo.bar.baz')?.counters?.set, 0);
});

Deno.test("should register only own properties access by default", () => {
  const target = {
    foo: {
      bar: {
        baz: ['1'],
      },
    },
  };
  const proxied = watchPropertyAccess(target);
  assertEquals(proxied.foo.bar.baz.map((value) => parseInt(value)), [1]);
  assertEquals(proxied["@@registry"].get('foo.bar.baz')?.counters?.total, 1);
  assertEquals(proxied["@@registry"].get('foo.bar.baz')?.counters?.get, 1);
  assertEquals(proxied["@@registry"].get('foo.bar.baz')?.counters?.set, 0);
  assertEquals(proxied["@@registry"].get('foo.bar.baz.map'), undefined);
});

Deno.test("should register non-own properties accesses when using ownProperty=false option", () => {
  const target = {
    foo: {
      bar: {
        baz: ['1'],
      },
    },
  };
  const proxied = watchPropertyAccess(target, false);
  assertEquals(proxied.foo.bar.baz.map((value) => parseInt(value)), [1]);
  assertEquals(proxied["@@registry"].get('foo.bar.baz')?.counters?.total, 1);
  assertEquals(proxied["@@registry"].get('foo.bar.baz')?.counters?.get, 1);
  assertEquals(proxied["@@registry"].get('foo.bar.baz')?.counters?.set, 0);
  assertEquals(proxied["@@registry"].get('foo.bar.baz.map')?.counters?.get, 1);
});

Deno.test("should not allow overwritting of the @@registry prop", () => {
  const target = {
    foo: {
      bar: 1,
    },
  };
  const proxied = watchPropertyAccess(target);
  try {
    proxied['@@registry'] = new Map();
  } catch (error) {
    assert(error instanceof TypeError);
  }
});

Deno.test("should register Symbol prop access", () => {
  const target = {
    foo: {
      get [Symbol.toStringTag]() {
        return 'CustomObjectType';
      },
      bar: 1,
    },
  };
  const proxied = watchPropertyAccess(target);
  assertEquals(proxied.foo.toString(), '[object CustomObjectType]');
  assertEquals(proxied["@@registry"].get('foo.Symbol(Symbol.toStringTag)')?.counters?.total, 1);
});

Deno.test("should register plain prop set access", () => {
  const target = {
    foo: {
      bar: 1,
    },
  };
  const proxied = watchPropertyAccess(target);
  proxied.foo = { bar: 2 };
  assertEquals(proxied["@@registry"].get('foo')?.counters?.total, 1);
  assertEquals(proxied["@@registry"].get('foo')?.counters?.get, 0);
  assertEquals(proxied["@@registry"].get('foo')?.counters?.set, 1);
  assertEquals(proxied.foo.bar, 2);
});

Deno.test("should register nested prop set access", () => {
  const target = {
    foo: {
      bar: {
        baz: 1,
        list: ['1', '2', '3'],
      }
    },
  };
  const proxied = watchPropertyAccess(target);
  proxied.foo.bar.baz = 2;
  proxied.foo.bar.list[0] = '0';
  assertEquals(proxied["@@registry"].get('foo.bar.baz')?.counters?.total, 1);
  assertEquals(proxied["@@registry"].get('foo.bar.baz')?.counters?.get, 0);
  assertEquals(proxied["@@registry"].get('foo.bar.baz')?.counters?.set, 1);
  assertEquals(proxied["@@registry"].get('foo.bar.list')?.counters?.total, 1);
  assertEquals(proxied.foo.bar.baz, 2);
});
