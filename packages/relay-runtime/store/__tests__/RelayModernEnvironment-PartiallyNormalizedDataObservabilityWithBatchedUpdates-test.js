/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 * @emails oncall+relay
 */

// flowlint ambiguous-object-type:error

'use strict';

const RelayFeatureFlags = require('../../util/RelayFeatureFlags');
const RelayModernEnvironment = require('../RelayModernEnvironment');
const RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestDeferred_module_user$normalization = require('./__generated__/RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestDeferred_module_user$normalization.graphql');
const RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModule_module_user$normalization = require('./__generated__/RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModule_module_user$normalization.graphql');
const RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModule_nestedModule_user$normalization = require('./__generated__/RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModule_nestedModule_user$normalization.graphql');
const RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNonDeferred_module_user$normalization = require('./__generated__/RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNonDeferred_module_user$normalization.graphql');
const RelayModernStore = require('../RelayModernStore');
const RelayNetwork = require('../../network/RelayNetwork');
const RelayObservable = require('../../network/RelayObservable');
const RelayRecordSource = require('../RelayRecordSource');

const {graphql, getFragment, getRequest} = require('../../query/GraphQLTag');
const {
  createOperationDescriptor,
} = require('../RelayModernOperationDescriptor');
const {createReaderSelector} = require('../RelayModernSelector');

import type {NormalizationRootNode} from '../../util/NormalizationNode';

const observationFragment = getFragment(graphql`
  fragment RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTest_observation_query on Query {
    me {
      name
      lastName
    }
  }
`);

describe('execute() a query with @module if the module fragment is available synchronously', () => {
  let environment;
  let dataSource;
  let operationLoader: {|
    get: (reference: mixed) => ?NormalizationRootNode,
    load: JestMockFn<$ReadOnlyArray<mixed>, Promise<?NormalizationRootNode>>,
  |};
  let store;
  let source;
  let variables;
  let query;
  let operation;
  let observationSelector;
  let complete;
  let error;
  let next;
  let callbacks;
  let callback;
  let observationSnapshot;

  beforeEach(() => {
    jest.resetModules();
    const fetch = (_query, _variables, _cacheConfig) => {
      return RelayObservable.create(sink => {
        dataSource = sink;
      });
    };
    operationLoader = {
      load: jest.fn(),
      get: jest.fn(),
    };
    source = RelayRecordSource.create();
    store = new RelayModernStore(source);
    environment = new RelayModernEnvironment({
      network: RelayNetwork.create(fetch),
      store,
      operationLoader,
    });

    variables = {};
    query = getRequest(graphql`
      query RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNonDeferredQuery {
        me {
          name
          ...RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNonDeferred_module_user
            @module(name: "User.react")
        }
      }
    `);

    operation = createOperationDescriptor(query, variables);

    observationSelector = createReaderSelector(
      observationFragment,
      'client:root',
      variables,
      operation.request,
    );

    graphql`
      fragment RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNonDeferred_module_user on User {
        lastName
      }
    `;

    complete = jest.fn();
    error = jest.fn();
    next = jest.fn();
    callbacks = {complete, error, next};

    // set up a subscription for the observation fragment.
    // In batched mode, we will not be able to observe (through
    // this subscription) the fragment in a partially-complete
    // state.
    observationSnapshot = environment.lookup(observationSelector);
    callback = jest.fn();
    environment.subscribe(observationSnapshot, callback);

    // ensure that the normalization fragment is available synchronously
    jest
      .spyOn(operationLoader, 'get')
      .mockImplementationOnce(
        () =>
          RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNonDeferred_module_user$normalization,
      );
  });

  describe('with ENABLE_BATCH_STORE_UPDATES set to true', () => {
    beforeEach(() => {
      RelayFeatureFlags.ENABLE_BATCHED_STORE_UPDATES = true;
    });
    it('commits only after data from the query and from the @module fragment have been normalized', () => {
      environment.execute({operation}).subscribe(callbacks);
      dataSource.next({
        data: {
          me: {
            id: '1',
            name: 'Joseph',

            // Data associated with @module fragment:
            lastName: 'Henry',
            __module_component_RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNonDeferredQuery:
              'User.react',
            __module_operation_RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNonDeferredQuery:
              'RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNonDeferred_module_user$normalization.graphql',
          },
        },
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0].data).toEqual({
        me: {
          name: 'Joseph',
          lastName: 'Henry',
        },
      });
    });
  });

  describe('with ENABLE_BATCH_STORE_UPDATES set to false', () => {
    beforeEach(() => {
      RelayFeatureFlags.ENABLE_BATCHED_STORE_UPDATES = false;
    });
    it('commits twice, first including only the query data, and second including the @module fragment data', () => {
      environment.execute({operation}).subscribe(callbacks);
      dataSource.next({
        data: {
          me: {
            id: '1',
            name: 'Joseph',

            // Data associated with @module fragment:
            lastName: 'Henry',
            __module_component_RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNonDeferredQuery:
              'User.react',
            __module_operation_RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNonDeferredQuery:
              'RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNonDeferred_module_user$normalization.graphql',
          },
        },
      });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback.mock.calls[0][0].data).toEqual({
        me: {
          name: 'Joseph',
        },
      });
      expect(callback.mock.calls[1][0].data).toEqual({
        me: {
          name: 'Joseph',
          lastName: 'Henry',
        },
      });
    });
  });
});

describe('execute() a query with @module in @defer if the deferred fragment and module fragment are available synchronously', () => {
  let environment;
  let dataSource;
  let operationLoader: {|
    get: (reference: mixed) => ?NormalizationRootNode,
    load: JestMockFn<$ReadOnlyArray<mixed>, Promise<?NormalizationRootNode>>,
  |};
  let store;
  let source;
  let variables;
  let query;
  let operation;
  let observationSelector;
  let complete;
  let error;
  let next;
  let callbacks;
  let callback;
  let observationSnapshot;

  beforeEach(() => {
    jest.resetModules();
    const fetch = (_query, _variables, _cacheConfig) => {
      return RelayObservable.create(sink => {
        dataSource = sink;
      });
    };
    operationLoader = {
      load: jest.fn(),
      get: jest.fn(),
    };
    source = RelayRecordSource.create();
    store = new RelayModernStore(source);
    environment = new RelayModernEnvironment({
      network: RelayNetwork.create(fetch),
      store,
      operationLoader,
    });

    variables = {};
    query = getRequest(graphql`
      query RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestDeferredQuery {
        me {
          name

          ...RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestDeferred_deferred_user
            @defer
        }
      }
    `);

    graphql`
      fragment RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestDeferred_deferred_user on User {
        ...RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestDeferred_module_user
          @module(name: "User.react")
      }
    `;
    operation = createOperationDescriptor(query, variables);

    observationSelector = createReaderSelector(
      observationFragment,
      'client:root',
      variables,
      operation.request,
    );

    graphql`
      fragment RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestDeferred_module_user on User {
        lastName
      }
    `;

    complete = jest.fn();
    error = jest.fn();
    next = jest.fn();
    callbacks = {complete, error, next};

    // set up a subscription for the observation fragment.
    // In batched mode, we will not be able to observe (through
    // this subscription) the fragment in a partially-complete
    // state.
    observationSnapshot = environment.lookup(observationSelector);
    callback = jest.fn();
    environment.subscribe(observationSnapshot, callback);

    // ensure that the normalization fragment is available synchronously
    jest
      .spyOn(operationLoader, 'get')
      .mockImplementationOnce(
        () =>
          RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestDeferred_module_user$normalization,
      );
  });

  describe('with ENABLE_BATCH_STORE_UPDATES set to true', () => {
    beforeEach(() => {
      RelayFeatureFlags.ENABLE_BATCHED_STORE_UPDATES = true;
    });

    it('commits only after data from the query and from the @module fragment have been normalized', () => {
      environment.execute({operation}).subscribe(callbacks);
      dataSource.next([
        {
          data: {
            me: {
              id: '1',
              name: 'Joseph',
            },
          },
        },
        {
          data: {
            id: '1',
            __typename: 'User',

            // Data associated with @module fragment:
            lastName: 'Henry',
            __module_component_RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestDeferred_deferred_user:
              'User.react',
            __module_operation_RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestDeferred_deferred_user:
              'RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestDeferred_module_user$normalization.graphql',
          },
          label:
            'RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestDeferredQuery$defer$RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestDeferred_deferred_user',
          path: ['me'],
        },
      ]);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0].data).toEqual({
        me: {
          name: 'Joseph',
          lastName: 'Henry',
        },
      });
    });
  });

  describe('with ENABLE_BATCH_STORE_UPDATES set to false', () => {
    beforeEach(() => {
      RelayFeatureFlags.ENABLE_BATCHED_STORE_UPDATES = false;
    });

    it('commits twice - once including only the query data, and again with the @module fragment data', () => {
      environment.execute({operation}).subscribe(callbacks);
      dataSource.next([
        {
          data: {
            me: {
              id: '1',
              name: 'Joseph',
            },
          },
        },
        {
          data: {
            id: '1',
            __typename: 'User',

            // Data associated with @module fragment:
            lastName: 'Henry',
            __module_component_RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestDeferred_deferred_user:
              'User.react',
            __module_operation_RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestDeferred_deferred_user:
              'RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestDeferred_module_user$normalization.graphql',
          },
          label:
            'RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestDeferredQuery$defer$RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestDeferred_deferred_user',
          path: ['me'],
        },
      ]);

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback.mock.calls[0][0].data).toEqual({
        me: {
          name: 'Joseph',
        },
      });
      expect(callback.mock.calls[1][0].data).toEqual({
        me: {
          name: 'Joseph',
          lastName: 'Henry',
        },
      });
    });
  });
});

describe('execute() a query with nested @module fragments, where the inner @module normalization fragment is available synchronously', () => {
  let environment;
  let dataSource;
  let operationLoader: {|
    get: (reference: mixed) => ?NormalizationRootNode,
    load: JestMockFn<$ReadOnlyArray<mixed>, Promise<?NormalizationRootNode>>,
  |};
  let store;
  let source;
  let variables;
  let query;
  let operation;
  let observationSelector;
  let complete;
  let error;
  let next;
  let callbacks;
  let callback;
  let observationSnapshot;
  let promise;
  let resolve;

  beforeEach(() => {
    jest.resetModules();
    const fetch = (_query, _variables, _cacheConfig) => {
      return RelayObservable.create(sink => {
        dataSource = sink;
      });
    };

    promise = new Promise(_resolve => (resolve = _resolve));
    operationLoader = {
      load: () => promise,
      get: jest.fn(),
    };
    source = RelayRecordSource.create();
    store = new RelayModernStore(source);
    environment = new RelayModernEnvironment({
      network: RelayNetwork.create(fetch),
      store,
      operationLoader,
    });

    variables = {};
    query = getRequest(graphql`
      query RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModuleQuery {
        me {
          ...RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModule_module_user
            @module(name: "User.react")
        }
      }
    `);

    graphql`
      fragment RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModule_module_user on User {
        ...RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModule_nestedModule_user
          @module(name: "User.react")
        name
      }
    `;
    graphql`
      fragment RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModule_nestedModule_user on User {
        lastName
      }
    `;
    operation = createOperationDescriptor(query, variables);

    observationSelector = createReaderSelector(
      observationFragment,
      'client:root',
      variables,
      operation.request,
    );

    complete = jest.fn();
    error = jest.fn();
    next = jest.fn();
    callbacks = {complete, error, next};

    // set up a subscription for the observation fragment.
    // In batched mode, we will not be able to observe (through
    // this subscription) the fragment in a partially-complete
    // state.
    observationSnapshot = environment.lookup(observationSelector);
    callback = jest.fn();
    environment.subscribe(observationSnapshot, callback);

    // ensure that the nested normalization fragment is available synchronously
    jest
      .spyOn(operationLoader, 'get')
      .mockImplementation(name =>
        name ===
        'RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModule_nestedModule_user$normalization'
          ? RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModule_nestedModule_user$normalization
          : null,
      );
  });

  describe('with ENABLE_BATCH_STORE_UPDATES set to true', () => {
    beforeEach(() => {
      RelayFeatureFlags.ENABLE_BATCHED_STORE_UPDATES = true;
    });

    it('should commit once, including data from both the outer and inner module fragments, after the outer module fragment normalization file is available', () => {
      environment.execute({operation}).subscribe(callbacks);
      dataSource.next({
        data: {
          me: {
            id: '1',

            name: 'Joseph',
            __module_component_RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModuleQuery:
              'User.react',
            __module_operation_RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModuleQuery:
              'RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModule_module_user$normalization',

            __module_component_RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModule_module_user:
              'User2.react',
            __module_operation_RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModule_module_user:
              'RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModule_nestedModule_user$normalization',
            lastName: 'Henry',
          },
        },
      });

      // Observe the creation of this object in the store
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0].data).toEqual({
        me: {
          lastName: undefined,
          name: undefined,
        },
      });
      callback.mockClear();

      // Resolve the promise for the outer normalization fragment
      resolve(
        RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModule_module_user$normalization,
      );
      jest.runAllTimers();

      // Observe only a single commit
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0].data).toEqual({
        me: {
          name: 'Joseph',
          lastName: 'Henry',
        },
      });
    });
  });

  describe('with ENABLE_BATCH_STORE_UPDATES set to false', () => {
    beforeEach(() => {
      RelayFeatureFlags.ENABLE_BATCHED_STORE_UPDATES = false;
    });

    it('should commit twice, once including data from only the outer module fragment, then also including data from the inner module fragment, after the outer module fragment normalization file is available', () => {
      environment.execute({operation}).subscribe(callbacks);
      dataSource.next({
        data: {
          me: {
            id: '1',

            name: 'Joseph',
            __module_component_RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModuleQuery:
              'User.react',
            __module_operation_RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModuleQuery:
              'RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModule_module_user$normalization',

            __module_component_RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModule_module_user:
              'User2.react',
            __module_operation_RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModule_module_user:
              'RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModule_nestedModule_user$normalization',
            lastName: 'Henry',
          },
        },
      });

      // Observe the creation of this object in the store
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0].data).toEqual({
        me: {
          lastName: undefined,
          name: undefined,
        },
      });
      callback.mockClear();

      // Resolve the promise for the outer normalization fragment
      resolve(
        RelayModernEnvironmentPartiallyNormalizedDataObservabilityWithBatchedUpdatesTestNestedModule_module_user$normalization,
      );
      jest.runAllTimers();

      // Observe two commits, the first with partial data
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback.mock.calls[0][0].data).toEqual({
        me: {
          name: 'Joseph',
        },
      });
      expect(callback.mock.calls[1][0].data).toEqual({
        me: {
          name: 'Joseph',
          lastName: 'Henry',
        },
      });
    });
  });
});
