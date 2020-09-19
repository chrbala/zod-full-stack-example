import {
  printSchema,
  GraphQLSchema,
  getIntrospectionQuery,
  graphqlSync,
} from 'graphql';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import schema from '../src';
import path from 'path';

if (!(schema instanceof GraphQLSchema))
  throw new Error(
    [
      'Schema is not an instance of GraphQLSchema.',
      'Make sure that GraphQL only appears once in the dependency closure.',
      `Path to GraphQL: ${require.resolve('graphql')}`,
    ].join(' ')
  );

const dir = 'dist';
if (!existsSync(dir)) mkdirSync(dir);

const graphqlFilename = 'index.graphql';
const graphqlFilepath = path.join(dir, graphqlFilename);
writeFileSync(graphqlFilepath, printSchema(schema));

const jsonFilename = 'index.json';
const jsonFilepath = path.join(dir, jsonFilename);
const { data: schemaJson } = graphqlSync({
  schema,
  source: getIntrospectionQuery(),
});
writeFileSync(jsonFilepath, JSON.stringify(schemaJson, null, 2));
