import type { ArgsType } from '@mofon-design/wc-core';
import { MDWC } from './types';

type ChildrenSpliceArgsType = ArgsType<MDWC.MDWCNode[]['splice']>;

const MAX_CALL_STACK_SIZE = 0x10000;

export const Children = {
  toArray(node: MDWC.MDWCNode): (MDWC.MDWCElement | MDWC.MDWCText)[] {
    const children: MDWC.MDWCNode[] = [node];
    const flattened: (MDWC.MDWCElement | MDWC.MDWCText)[] = [];

    let index = 0;
    let child = children[0];
    let insertedCount: number;
    let spliceArgs: ChildrenSpliceArgsType;

    for (; index < children.length; child = children[(index += 1)]) {
      if (child === null) continue;

      switch (typeof child) {
        case 'object':
          if (Array.isArray(child)) {
            if (!child.length) {
              break;
            }

            if (child.length < MAX_CALL_STACK_SIZE) {
              spliceArgs = [index + 1, 0];
              spliceArgs = spliceArgs.concat(child) as ChildrenSpliceArgsType;

              Array.prototype.splice.apply(children, spliceArgs);
            } else {
              // provides support for elements in array form whose length exceeds stack size
              for (
                insertedCount = 0;
                insertedCount < child.length;
                insertedCount += spliceArgs.length - 2
              ) {
                spliceArgs = [index + 1 + insertedCount, 0];
                spliceArgs = spliceArgs.concat(
                  child.slice(insertedCount, insertedCount + MAX_CALL_STACK_SIZE),
                ) as ChildrenSpliceArgsType;

                Array.prototype.splice.apply(children, spliceArgs);
              }
            }
          } else {
            flattened.push(child);
          }
          break;
        case 'boolean':
        case 'undefined':
          break;
        case 'string':
        case 'number':
          flattened.push(child);
          break;
        default:
          flattened.push(String(child));
          break;
      }
    }

    return flattened;
  },
};
