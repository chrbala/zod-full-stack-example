import React from 'react';
import { Formik, Form, Field, ErrorMessage, FormikErrors } from 'formik';
import { PlantInput, PlantLifecycle } from '../__generated__/types';

const ErrorDisplay = ({ name }: { name: string }) => (
  <div style={{ height: 30, color: 'red' }}>
    <ErrorMessage name={name} />
  </div>
);

const defaultInitialValue: PlantInput = {
  name: '',
  lifespan: 1,
  weight: 0,
  eatenBy: [],
  lifecycle: PlantLifecycle.Deciduous,
};

type PropsType = {
  initialValue: null | PlantInput;
  validate: (value: PlantInput) => Promise<FormikErrors<PlantInput>>;
  onSubmit: (value: PlantInput) => void;
};
export const PlantEntry = ({ initialValue, onSubmit, validate }: PropsType) => (
  <Formik
    initialValues={initialValue || defaultInitialValue}
    onSubmit={onSubmit}
    validate={validate}
  >
    <Form>
      <div>
        <label>
          <div>name</div>
          <Field name="name" placeholder="Aspen" />
          <ErrorDisplay name="name" />
        </label>
      </div>
      <div>
        <label>
          <div>weight (pounds)</div>
          <Field type="number" name="weight" min={0} step={0.1} />
          <ErrorDisplay name="weight" />
        </label>
      </div>
      <div>
        <label>
          <div>lifespan (days)</div>
          <Field type="number" name="lifespan" min={1} step={1} />
          <ErrorDisplay name="lifespan" />
        </label>
      </div>
      <div>
        <label>
          <div>Lifecycle</div>
          <Field name="lifecycle" as="select">
            <option value={PlantLifecycle.Deciduous}>Deciduous</option>
            <option value={PlantLifecycle.Evergreen}>Evergreen</option>
            <option value={PlantLifecycle.SemiDeciduous}>Semi-deciduous</option>
          </Field>
          <ErrorDisplay name="lifecycle" />
        </label>
      </div>
      <div>
        <button>submit</button>
      </div>
    </Form>
  </Formik>
);
