import { useMutation, useQuery } from "@vue/apollo-composable";
import { DocumentNode } from "graphql";
import gql from "graphql-tag";

export function graphqlQueryBuilder(params: {
  name: DocumentNode;
  fragment: string;
  mutationName: string;
}): DocumentNode {
  const { name, fragment, mutationName } = params;

  const query = gql`
        query ${mutationName}{
          ${mutationName}{
           ...${fragment}
          }
        }
        ${name}
      `;

  return query;
}

export function graphqlMutationBuilder(params: {
  name: DocumentNode;
  fragment: string;
  mutationName: string;
  inputName?: string;
}): DocumentNode {
  const { name, fragment, mutationName, inputName } = params;
  let query = "" as any;

  if (inputName)
    query = gql`
        mutation ${mutationName}($input:${inputName}){
          ${mutationName}(input: $input){
           ...${fragment}
          }
        }
        ${name}
      `;

  if (!inputName)
    query = gql`
        mutation ${mutationName}{
          ${mutationName}{
           ...${fragment}
          }
        }
        ${name}
      `;

  return query;
}
export function executeGrapQuery(params: {
  query: any;
  options: { refetch: boolean };
}): Promise<any> {
  const { query, options } = params;
  const { refetch, onResult, onError } = useQuery(query, null, {
    fetchPolicy: "cache-first",
  });

  return new Promise(async (resolve, reject) => {
    try {
      if (options.refetch) await refetch();
    } catch (error) {
      reject(error);
    }

    onResult((response) => resolve(response));

    onError((error) => {
      reject(error);
    });
  });
}

export function executeGrapMutation(params: {
  query: any;
  input?: any;
}): Promise<any> {
  const { query, input } = params;
  const { mutate: mutate, onDone, onError } = useMutation(query);

  if (!input) mutate();
  if (input) mutate({ input });

  return new Promise((resolve, reject) => {
    onDone((response) => {
      resolve(response.data);
    });

    onError((error) => reject(error));
  });
}
