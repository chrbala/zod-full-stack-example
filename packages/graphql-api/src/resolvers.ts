import {
  LivingThingPayload,
  InputError,
  Animal,
  Plant,
} from '@mono/resolver-typedefs';
import { LivingThingArgs, AddLivingThingArgs } from '@mono/validations-api';
import { parse } from '@mono/utils-common';
import { Context } from './types';
import { Table, toGlobalId, DeserializedGlobalId } from '@mono/utils-server';
import { animalParent, plantParent } from './validations';

const resolveByTypename = {
  __resolveType: ({ __typename }: { __typename: string }) => __typename,
};

const resolveNode = async (
  { table, id }: DeserializedGlobalId,
  context: Context
): Promise<Animal | Plant> =>
  table === Table.Animal
    ? {
        __typename: 'Animal',
        id: toGlobalId({ table: Table.Animal, id: id }),
        ...(await context.animal.get(id)),
      }
    : {
        __typename: 'Plant',
        id: toGlobalId({ table: Table.Plant, id: id }),
        ...(await context.plant.get(id)),
      };

export const resolvers = {
  Query: {
    livingThing: async (
      _: any,
      args: unknown,
      context: Context
    ): Promise<
      InputError | (LivingThingPayload & { node: Animal | Plant })
    > => {
      const parsed = await parse(LivingThingArgs, args);

      if (!parsed.success) {
        return {
          __typename: 'InputError',
          errors: parsed.errors,
        };
      }

      return {
        __typename: 'LivingThingPayload',
        node: await resolveNode(parsed.data.id, context),
      };
    },
  },
  Mutation: {
    addLivingThing: async (_: any, args: any, context: Context) => {
      const parsed = await parse(AddLivingThingArgs, args);

      if (!parsed.success) {
        return {
          __typename: 'InputError',
          errors: parsed.errors,
        };
      }

      const {
        livingThing: { __typename, ...livingThing },
      } = parsed.data.input;
      const { livingThing: input } = parsed.data.input;
      const id =
        input.__typename === 'Animal'
          ? {
              id: await context.animal.create({
                name: input.name,
                lifespan: input.lifespan,
                weight: input.weight,
              }),
              table: Table.Animal,
            }
          : {
              id: await context.plant.create({
                name: input.name,
                lifespan: input.lifespan,
                weight: input.weight,
                lifecycle: input.lifecycle,
              }),
              table: Table.Plant,
            };

      return {
        __typename: 'AddLivingThingPayload',
        node: {
          ...livingThing,
          __typename,
          id: toGlobalId(id),
        },
      };
    },
  },
  Node: resolveByTypename,
  AddLivingThingResult: resolveByTypename,
  UpdateLivingThingResult: resolveByTypename,
  DeleteLivingThingResult: resolveByTypename,
  LivingThing: resolveByTypename,
  LivingThingResult: resolveByTypename,
  AllLivingThingsResult: resolveByTypename,
  Plant: {
    eatenBy: async (parent: unknown, _: unknown, context: Context) => {
      const res = await parse(plantParent, parent);

      if (!res.success) throw res.errors;

      return [];
    },
  },
  Animal: {
    eatenBy: async (parent: unknown, _: unknown, context: Context) => {
      const res = await parse(animalParent, parent);

      if (!res.success) throw res.errors;

      return [];
    },
    diet: async (parent: unknown, _: unknown, context: Context) => {
      const res = await parse(animalParent, parent);

      if (!res.success) throw res.errors;

      return [];
    },
  },
};
