# zod-full-stack-example

This is a work in progress. Do not make any assumptions about this example. Some things are incomplete. Other things don't work right. 

This is also not a good example of a monorepo package design. It is arranged here for convenience, but it would not properly transpile and publish the subpackages.

Once a proof-of-concept is completed, I will squash all the commits on this branch, so don't rely on these commits either.

If you're daring:
```sh
yarn
cd packages/graphql-api
yarn start
```

With the server running, you can navigate to ``http://localhost:4000`` and query the GraphQL server.

Example query:
```graphql
mutation($input:AddLivingThingInput!) {
  addLivingThing(input:$input) {
    ...on AddLivingThingPayload {
      node {
        id
        name
        lifespan
        eatenBy {
          name 
          lifespan
          weight
        }
        weight
        ...on Animal {
          diet {
            name
            lifespan
            weight
          }
        }
      }
    }
    ...on InputError {
      errors {
        code
        path
      }
    }
  }
}
```

Valid variables for the above query:
```json
{
  "input": {
    "livingThing": {
      "animal": {
        "name": "dog",
        "lifespan": 10,
        "weight": 5,
        "eatenBy": [],
        "diet": []
      }
    }
  }
}
```
