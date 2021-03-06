import { Children } from '../children';
import { isMDWCFragmentType } from '../shared/MDWCFragment';
import {
  HybridDOMTreeChildNode,
  HybridDOMTreeNodeType,
  HybridDOMTreeParentNode,
  MDWC,
} from '../types';
import { createHybridDOMTreeChildNode } from './createHybridDOMTreeChildNode';
import { formatMDWCKey } from './formatMDWCKey';

/**
 * Convert the MDWC nodes and its children (if any) into a hybrid DOM tree,
 * and attach the result to the parent node.
 */
export function attachHybridDOMTreeFromMDWCNode(
  children: MDWC.MDWCNode,
  parent: HybridDOMTreeParentNode,
): void {
  const queue: TraversalQueueItem[] = [[Children.toArray(children), parent]];

  let tagName: string;
  let textContent: string;

  let node: HybridDOMTreeChildNode;
  let top: TraversalQueueItem | undefined;

  let element: MDWC.MDWCElement | MDWC.MDWCText;
  let elements: readonly (MDWC.MDWCElement | MDWC.MDWCText)[];

  let elementTraversalIndex: number;

  // eslint-disable-next-line no-cond-assign
  while ((top = queue.shift())) {
    elements = top[0];
    // eslint-disable-next-line no-param-reassign
    parent = top[1];

    for (
      elementTraversalIndex = 0;
      elementTraversalIndex < elements.length;
      elementTraversalIndex += 1
    ) {
      element = elements[elementTraversalIndex];

      if (typeof element !== 'object') {
        textContent = String(element);
        node = createHybridDOMTreeChildNode(HybridDOMTreeNodeType.TEXT, {
          instance: document.createTextNode(textContent),
          parent,
          textContent,
        });
        parent.children.push(node);
        continue;
      }

      if (isMDWCFragmentType(element.type)) {
        node = createHybridDOMTreeChildNode(HybridDOMTreeNodeType.FRAGMENT, {
          children: [],
          key: formatMDWCKey(element.key),
          parent,
        });
      } else {
        // * ASSERT `element.type.tagName`
        tagName = typeof element.type === 'string' ? element.type : element.type.tagName!;

        node = createHybridDOMTreeChildNode(HybridDOMTreeNodeType.HTML_ELEMENT, {
          children: [],
          instance: document.createElement(tagName),
          key: formatMDWCKey(element.key),
          parent,
          props: element.props,
          ref: element.ref,
          tagName,
        });
      }

      queue.push([Children.toArray(element.children), node]);
      parent.children.push(node);
    }
  }
}

type TraversalQueueItem = readonly [
  readonly (MDWC.MDWCElement | MDWC.MDWCText)[],
  HybridDOMTreeParentNode,
];
