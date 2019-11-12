/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

var resolvedPromise = Promise.resolve();

/**
 * An alternative to setImmediate based on Promise.
 */
function resolveImmediate(callback: () => void) {
  resolvedPromise.then(callback).catch(throwNext);
}

function throwNext(error) {
  setTimeout(() => {
    throw error;
  }, 0);
}

module.exports = resolveImmediate;