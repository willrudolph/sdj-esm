import {deepFreeze} from "../dist/index.js";

test('object', () => {
    {
        let obj = { foo: { bar: 'baz' } };
        expect(Object.isFrozen(obj)).toBe(false);
        expect(Object.isFrozen(obj.foo)).toBe(false);
        expect(Object.isFrozen(obj.foo.bar)).toBe(true); // WTF
        obj.foo.bar = 'corge';
        expect(obj).toEqual({ foo: { bar: 'corge' } });
        // @ts-expect-error
        obj.foo = { qux: 'quux' };
        expect(obj).toEqual({ foo: { qux: 'quux' } });
        // @ts-expect-error
        obj = { qux: 'quux' };
        expect(obj).toEqual({ qux: 'quux' });
    }

    {
        let obj = { foo: { bar: 'baz' } };
        Object.freeze(obj);
        expect(Object.isFrozen(obj)).toBe(true);
        expect(Object.isFrozen(obj.foo)).toBe(false);
        expect(Object.isFrozen(obj.foo.bar)).toBe(true); // WTF
        expect(
            () =>
                (obj.foo = {
                    // @ts-expect-error
                    qux: 'quux'
                })
        ).toThrow("Cannot assign to read only property 'foo' of object '#<Object>'");
        expect(obj).toEqual({ foo: { bar: 'baz' } });
        obj.foo.bar = 'corge';
        expect(obj).toEqual({ foo: { bar: 'corge' } });
        // @ts-expect-error
        obj = { qux: 'quux' };
        expect(obj).toEqual({ qux: 'quux' });
    }

    {
        let obj = { foo: { bar: 'baz' } };
        deepFreeze(obj);
        expect(obj).toEqual({ foo: { bar: 'baz' } });
        expect(Object.isFrozen(obj)).toBe(true);
        expect(Object.isFrozen(obj.foo)).toBe(true);
        expect(Object.isFrozen(obj.foo.bar)).toBe(true);
        expect(
            () =>
                (obj.foo = {
                    // @ts-expect-error
                    qux: 'quux'
                })
        ).toThrow("Cannot assign to read only property 'foo' of object '#<Object>'");
        expect(obj).toEqual({ foo: { bar: 'baz' } });
        expect(() => (obj.foo.bar = 'corge')).toThrow(
            "Cannot assign to read only property 'bar' of object '#<Object>'"
        );
        expect(obj).toEqual({ foo: { bar: 'baz' } });
        // @ts-expect-error
        obj = { qux: 'quux' };
        expect(obj).toEqual({ qux: 'quux' });
    }
});

test('array', () => {
    const arr = [1, 2, 3];
    expect(Object.isFrozen(arr)).toBe(false);
    deepFreeze(arr);
    expect(Object.isFrozen(arr)).toBe(true);
    expect(() => (arr[0] = 0)).toThrow(
        "Cannot assign to read only property '0' of object '[object Array]'"
    );
    expect(arr).toEqual([1, 2, 3]);
});

test("string - doesn't make sense", () => {
    const str = 'foo';
    expect(Object.isFrozen(str)).toBe(true);
    deepFreeze(str);
    expect(Object.isFrozen(str)).toBe(true);
    expect(str).toBe('foo');
});

test("number - doesn't make sense", () => {
    const num = 11;
    expect(Object.isFrozen(num)).toBe(true);
    deepFreeze(num);
    expect(Object.isFrozen(num)).toBe(true);
    expect(num).toBe(11);
});

test("function - doesn't make sense - Freeze does nothing to functions", () => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    let someFunction = () => {
        return 'foobar';
    }
    expect(Object.isFrozen(someFunction)).toBe(false);

    Object.freeze(someFunction);
    expect(Object.isFrozen(someFunction)).toBe(true);
    expect(someFunction()).toBe('foobar');
    someFunction = () => {
        return "fool";
    }
    expect(someFunction()).toBe("fool");
});

test("subArray test", () => {
    let testObj = {
        subArray: []
    };
    expect(Object.isFrozen(testObj)).toBe(false);

    Object.freeze(testObj.subArray);
    expect(Object.isFrozen(testObj.subArray)).toBe(true);

    testObj.subArray = undefined;
    expect(testObj.subArray).toBe(undefined);

    testObj.subArray = [];
    Object.freeze(testObj);

    expect(() => {
        testObj.subArray = undefined;
    }).toThrowError();
});

