import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import { report } from './reporter';

test('No errors', () => {
  const type = D.string;
  const actual = report(type.decode('hello'));
  const expected = [] as const;
  expect(actual).toEqual(expected);
});

test('Primitive missing', () => {
  const type = D.string;
  const actual = report(type.decode(null));
  const expected = [
    {
      input: null,
      path: [],
      errors: [
        {
          code: 'string',
        },
      ],
    },
  ];
  expect(actual).toEqual(expected);
});

interface RequiredBrand {
  readonly Required: unique symbol;
}

type RequiredString = string & RequiredBrand;

test('Primitive refined', () => {
  const type = pipe(
    D.string,
    D.refine((s): s is RequiredString => !!s.length, 'required')
  );
  const actual = report(type.decode(''));
  const expected = [
    {
      input: '',
      path: [],
      errors: [{ code: 'required' }],
    },
  ];
  expect(actual).toEqual(expected);
});

test('Object missing key', () => {
  const type = D.type({
    num: D.number,
  });
  const actual = report(type.decode({}));
  const expected = [
    {
      input: undefined,
      path: ['num'],
      errors: [{ code: 'number' }],
    },
  ];
  expect(actual).toEqual(expected);
});

test('Refined object', () => {
  const type = pipe(
    D.partial({
      num: D.number,
      str: D.string,
    }),
    D.parse(v =>
      'num' in v || 'str' in v ? D.success(v) : D.failure(v, 'need_value')
    )
  );
  const actual = report(type.decode({}));
  const expected = [
    {
      input: {},
      path: [],
      errors: [{ code: 'need_value' }],
    },
  ];
  expect(actual).toEqual(expected);
});

test('Deep path', () => {
  const type = D.type({
    obj: D.type({
      num: D.number,
    }),
  });
  const actual = report(type.decode({ obj: {} }));
  const expected = [
    {
      input: undefined,
      path: ['obj', 'num'],
      errors: [{ code: 'number' }],
    },
  ];
  expect(actual).toEqual(expected);
});

test('Record', () => {
  const type = D.record(D.number);
  const actual = report(type.decode({ key: 'hello' }));
  const expected = [
    {
      input: 'hello',
      path: ['key'],
      errors: [{ code: 'number' }],
    },
  ];
  expect(actual).toEqual(expected);
});

test('Array', () => {
  const type = D.array(D.number);
  const actual = report(type.decode(['hello']));
  const expected = [
    {
      input: 'hello',
      path: ['0'],
      errors: [{ code: 'number' }],
    },
  ];
  expect(actual).toEqual(expected);
});

test('Lazy', () => {
  interface Category {
    title: string;
    subcategory: null | Category;
  }

  const Category: D.Decoder<unknown, Category> = D.lazy('Category', () =>
    D.type({
      title: D.string,
      subcategory: D.nullable(Category),
    })
  );

  const actual = report(
    Category.decode({
      title: 'mystery',
      subcategory: { title: 5, subcategory: null },
    })
  );
  const expected = [
    {
      input: 5,
      path: ['subcategory', 'title'],
      errors: [{ code: 'string' }],
    },
  ];
  expect(actual).toEqual(expected);
});

test('Union', () => {
  const type = D.union(D.number, D.string);
  const actual = report(type.decode(null));
  const expected = [
    {
      input: null,
      path: [],
      errors: [
        {
          code: 'number',
        },
        {
          code: 'string',
        },
      ],
    },
  ];
  expect(actual).toEqual(expected);
});

test('Sum', () => {
  const type = D.sum('type')({
    number: D.type({ type: D.literal('number'), num: D.number }),
    string: D.type({ type: D.literal('string'), str: D.string }),
  });
  const actual = report(type.decode({ type: 'number' }));
  const expected = [
    {
      input: undefined,
      path: ['num'],
      errors: [
        {
          code: 'number',
        },
      ],
    },
  ];
  expect(actual).toEqual(expected);
});
