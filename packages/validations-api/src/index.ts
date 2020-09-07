import {
  fromGlobalId,
  Table,
  toGlobalId,
  DeserializedGlobalId,
} from '@mono/utils-server';

import * as C from 'io-ts/Codec';
import * as D from 'io-ts/Decoder';
import * as E from 'io-ts/Encoder';
import { pipe } from 'fp-ts/function';

import { PlantLifecycle } from '@mono/resolver-typedefs';

export const name = D.string;
export const lifespan = D.number;
export const weight = D.number;

export const lifecycle = D.union(
  D.literal(PlantLifecycle.Deciduous),
  D.literal(PlantLifecycle.Evergreen),
  D.literal(PlantLifecycle.SemiDeciduous)
);

const idD = pipe(
  D.string,
  D.parse(id => {
    const res = fromGlobalId(id);
    return res instanceof Error ? D.failure(res, res.message) : D.success(res);
  })
);

const idE: E.Encoder<string, DeserializedGlobalId> = {
  encode: toGlobalId,
};

export const id = C.make(idD, idE);

const foreignKeyD = D.parse<D.TypeOf<typeof idD>, string>(id =>
  D.success(toGlobalId(id))
);

const typedId = (...table: Array<Table>) =>
  pipe(
    id,
    D.parse(id =>
      table.includes(id.table) ? D.success(id) : D.failure(id, 'invalid_table')
    )
  );

const animalId = typedId(Table.Animal);
const livingThingId = typedId(Table.Animal, Table.Plant);

const LivingThingCommonD = D.type({
  name,
  lifespan,
  weight,
});

const AnimalInput = pipe(
  LivingThingCommonD,
  D.intersect(
    D.type({
      diet: D.array(pipe(livingThingId, foreignKeyD)),
      eatenBy: D.array(pipe(animalId, foreignKeyD)),
    })
  )
);

export const BackendAnimal = LivingThingCommonD;

const PlantInput = pipe(
  LivingThingCommonD,
  D.intersect(
    D.type({ eatenBy: D.array(pipe(animalId, foreignKeyD)), lifecycle })
  )
);

export const BackendPlant = pipe(
  LivingThingCommonD,
  D.intersect(D.type({ lifecycle }))
);

export const LivingThingPatchCommon = D.type({
  name,
  lifespan,
  eatenBy: D.array(pipe(animalId, foreignKeyD)),
  weight,
});

export const AnimalPatchInput = pipe(
  LivingThingPatchCommon,
  D.intersect(D.type({ diet: D.array(pipe(livingThingId, foreignKeyD)) }))
);

export const PlantPatchInput = pipe(
  LivingThingPatchCommon,
  D.intersect(D.type({ lifecycle }))
);

export const LivingThingPatchInput = D.type({
  animal: AnimalInput,
  plant: PlantInput,
});

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
      return D.failure(union, 'multiple_values');

    const val = plant
      ? { __typename: 'Plant' as const, ...plant }
      : animal
      ? { __typename: 'Animal' as const, ...animal }
      : null;

    if (!val) return D.failure(union, 'no_value');

    return D.success(val);
  })
);

export const AddLivingThingInput = D.type({
  livingThing: LivingThingInput,
});

export const AddLivingThingArgs = D.type({
  input: AddLivingThingInput,
});
