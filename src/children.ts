import type { ArgsType } from '@mofon-design/wc-core';
import { MDWC } from './types';

type ChildrenSpliceArgsType = ArgsType<MDWC.MDWCNode[]['splice']>;

export const Children = {
  toArray(node: MDWC.MDWCNode): (MDWC.MDWCElement | MDWC.MDWCText)[] {
    const children: MDWC.MDWCNode[] = [node];
    const flattened: (MDWC.MDWCElement | MDWC.MDWCText)[] = [];

    for (
      let index = 0, child = children[0];
      index < children.length;
      child = children[(index += 1)]
    ) {
      if (child === null) continue;

      switch (typeof child) {
        case 'object':
          if (Array.isArray(child)) {
            let spliceArgs: ChildrenSpliceArgsType = [index + 1, 0];
            spliceArgs = spliceArgs.concat(child) as ChildrenSpliceArgsType;

            Array.prototype.splice.apply(children, spliceArgs);
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
