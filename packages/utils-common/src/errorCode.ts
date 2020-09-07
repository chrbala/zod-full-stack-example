import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';

const RICH_PREFIX = 'rich:';

const json = pipe(
  D.string,
  D.parse(s => {
    try {
      return D.success(JSON.parse(s));
    } catch {
      return D.failure(s, 'json');
    }
  })
);

const Params = D.record(D.string);

const Debug = D.UnknownRecord;

const RichMessage = D.type({
  code: D.string,
  client: D.boolean,
  params: Params,
  debug: Debug,
});

const ParsedRichMessage = pipe(
  D.string,
  D.parse(s =>
    s.match(new RegExp(`^${RICH_PREFIX}`))
      ? D.success(s.slice(RICH_PREFIX.length))
      : D.failure(s, 'invalid_rich_message')
  ),
  D.compose(json),
  D.compose(RichMessage)
);

const ErrorCode = pipe(
  D.string,
  D.parse(s =>
    !s.match(new RegExp(`^${RICH_PREFIX}`))
      ? D.success({ code: s, params: {}, debug: {} } as D.TypeOf<
          typeof RichMessage
        >)
      : D.failure(s, 'not_error_code')
  )
);

export const ParseError = D.union(ParsedRichMessage, ErrorCode);
const ParseErrorData = D.type({
  path: D.array(D.string),
  errors: D.array(ParseError),
});
export const ParseErrors = D.array(ParseErrorData);

type ErrorValue = {
  code: string;
  client: boolean;
  params: D.TypeOf<typeof Params>;
  debug: D.TypeOf<typeof Debug>;
};
const serializeErrorValue = (value: ErrorValue) => JSON.stringify(value);

export const makeError = ({
  code,
  client = false,
  params = {},
  debug = {},
}: Partial<ErrorValue> & {
  code: string;
}) => `${RICH_PREFIX}${serializeErrorValue({ code, params, debug, client })}`;

export const prepareErrorsForTransit = (errors: D.TypeOf<typeof ParseErrors>) =>
  errors
    .map(error => ({
      ...error,
      errors: error.errors
        .filter(({ client }) => client)
        .map(e => ({
          ...e,
          params: Object.entries(e.params).map(([key, value]) => ({
            key,
            value,
          })),
        })),
    }))
    .filter(({ errors }) => errors.length);
