import { fromGlobalId, Table, toGlobalId } from '@mono/utils-server';
import { makeError } from '@mono/utils-common';
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';
import {
  name,
  lifespan,
  weight,
  lifecycle,
  diet,
  eatenBy,
} from '@mono/validations-common';

export const id = pipe(
  D.string,
  D.parse(id => {
    const res = fromGlobalId(id);
    return res instanceof Error
      ? D.failure(
          res,
          makeError({
            code: 'invalid_id',
            client: true,
            debug: {
              type: res.name,
              data: res.data,
            },
          })
        )
      : D.success({ ...res, serialized: id });
  })
);

export type IDType = D.TypeOf<typeof id>;

const foreignKey = D.parse<D.TypeOf<typeof id>, string>(id =>
  D.success(toGlobalId(id))
);

const typedId = (...table: Array<Table>) =>
  pipe(
    id,
    D.parse(id =>
      table.includes(id.table)
        ? D.success(id)
        : D.failure(
            id,
            makeError({
              code: 'invalid_id',
              client: true,
            })
          )
    )
  );

const animalId = typedId(Table.Animal);
const livingThingId = typedId(Table.Animal, Table.Plant);

const LivingThingCommon = D.type({
  name,
  lifespan,
  weight,
});

const Diet = pipe(diet, D.compose(D.array(pipe(livingThingId, foreignKey))));
const EatenBy = pipe(eatenBy, D.compose(D.array(pipe(animalId, foreignKey))));

const AnimalInput = pipe(
  LivingThingCommon,
  D.intersect(
    D.type({
      diet: Diet,
      eatenBy: EatenBy,
    })
  )
);

export const BackendAnimal = LivingThingCommon;

const PlantInput = pipe(
  LivingThingCommon,
  D.intersect(D.type({ eatenBy: EatenBy, lifecycle }))
);

export const BackendPlant = pipe(
  LivingThingCommon,
  D.intersect(D.type({ lifecycle }))
);

export const LivingThingPatchCommon = D.partial({
  name,
  lifespan,
  weight,
});

export const AnimalPatchInput = pipe(
  LivingThingPatchCommon,
  D.intersect(D.partial({ diet: Diet, eatenBy: EatenBy }))
);

export const BackendAnimalPatchInput = LivingThingPatchCommon;

export const PlantPatchInput = pipe(
  LivingThingPatchCommon,
  D.intersect(D.partial({ lifecycle, eatenBy: EatenBy }))
);

export const BackendPlantPatchInput = pipe(
  LivingThingPatchCommon,
  D.intersect(D.type({ lifecycle, eatenBy: EatenBy }))
);

export const LivingThingPatchInput = pipe(
  D.partial({
    animal: AnimalPatchInput,
    plant: PlantPatchInput,
  }),
  D.parse(union => {
    const { plant, animal } = union;
    if (Object.keys(union).length !== 1)
      return D.failure(
        union,
        makeError({ code: 'multiple_values', client: true })
      );

    const val = plant
      ? { __typename: 'Plant' as const, ...plant }
      : animal
      ? { __typename: 'Animal' as const, ...animal }
      : null;

    if (!val)
      return D.failure(union, makeError({ code: 'no_value', client: true }));

    return D.success(val);
  })
);

export const UpdateLivingThingInput = D.type({
  id: livingThingId,
  patch: LivingThingPatchInput,
});

export const UpdateLivingThingArgs = D.type({
  input: UpdateLivingThingInput,
});

export const DeleteLivingThingInput = D.type({
  id: livingThingId,
});

export const DeleteLivingThingArgs = D.type({
  input: DeleteLivingThingInput,
});

export const NodeArgs = D.type({
  id,
});

export const AllLivingThingsInput = D.type({
  page: D.number,
});

export const AllLivingThingsArgs = D.type({
  input: AllLivingThingsInput,
});

export const LivingThingArgs = D.type({
  id: livingThingId,
});

export const LivingThingInput = pipe(
  D.partial({
    animal: AnimalInput,
    plant: PlantInput,
  }),
  D.parse(union => {
    const { plant, animal } = union;
    if (Object.keys(union).length !== 1)
      return D.failure(
        union,
        makeError({ code: 'multiple_values', client: true })
      );

    const val = plant
      ? { __typename: 'Plant' as const, ...plant }
      : animal
      ? { __typename: 'Animal' as const, ...animal }
      : null;

    if (!val)
      return D.failure(union, makeError({ code: 'no_value', client: true }));

    return D.success(val);
  })
);

export const AddLivingThingInput = D.type({
  livingThing: LivingThingInput,
});

export const AddLivingThingArgs = D.type({
  input: AddLivingThingInput,
});
