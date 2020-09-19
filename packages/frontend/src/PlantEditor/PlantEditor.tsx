import React from 'react';
import { gql, useApolloClient, ApolloClient } from '@apollo/client';
import { PlantEntry } from '../PlantEntry';
import { PlantInput } from '@mono/validations-frontend';
import { PlantInput as PlantInputType } from '../__generated__/types';
import { FormikErrors } from 'formik';

import {
  parse,
  parseSync,
  prepareErrorsForTransit,
  ParamsCodec,
} from '@mono/utils-common';
import set from 'set-value';

const PLANT_ENTRY_DRYRUN = gql`
  query PlantEntryDryrun($input: AddLivingThingInput!) {
    addLivingThingDryrun(input: $input) {
      errors {
        path
        errors {
          code
          params {
            key
            value
          }
        }
      }
    }
  }
`;

type CommonError = {
  path: Array<string>;
  errors: Array<{
    code: string;
    params: Array<{ key: string; value: string }>;
  }>;
};

const buildErrors = async (
  mapStrings: MapStrings,
  errors: Array<CommonError>
) => {
  const out = {};
  errors.forEach(error => {
    const e = error.errors[0];
    if (!e) return;

    const params = parseSync(ParamsCodec, e.params);
    if (!params.success) return;

    set(
      out,
      error.path.join('.'),
      mapStrings({
        path: error.path,
        code: e.code,
        params: params.data,
      })
    );
  });

  return out;
};

type MapStrings = (arg: {
  path: Array<string>;
  code: string;
  params: Record<string, string>;
}) => string;

const pathLens = <T extends { path: Array<string> }>(
  path: Array<string>,
  values: Array<T>
): Array<T> =>
  values.map(value => ({
    ...value,
    path: value.path.slice(path.length - 1), // TODO should actually do path checks
  }));

const validate = (
  client: ApolloClient<unknown>,
  mapStrings: MapStrings
) => async (value: PlantInputType): Promise<FormikErrors<PlantInputType>> => {
  const localResult = await parse(PlantInput, value);

  if (!localResult.success)
    return buildErrors(mapStrings, prepareErrorsForTransit(localResult.errors));

  const result = client.query<PlantEntryDryrunQuery>({
    query: PLANT_ENTRY_DRYRUN,
    variables: {
      input: {
        livingThing: {
          plant: value,
        },
      },
    },
  });

  const errors = (await result).data.addLivingThingDryrun?.errors;
  const path = ['input', 'livingThing', 'plant'];
  if (errors) return buildErrors(mapStrings, pathLens(path, errors));

  return {};
};

type PropsType = {
  initialValue: PlantInputType | null;
  onSubmit: (value: PlantInputType) => void;
};

export const PlantEditor = ({ initialValue, onSubmit }: PropsType) => {
  const client = useApolloClient();

  return (
    <PlantEntry
      initialValue={initialValue}
      onSubmit={onSubmit}
      validate={validate(client, ({ code }) => code)}
    />
  );
};
