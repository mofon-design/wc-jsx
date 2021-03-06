import { Children } from '../children';
import { isMDWCFragmentType } from '../shared/MDWCFragment';
import {
  DiffQueueItem,
  DiffType,
  HybridDOMTreeChildNode,
  HybridDOMTreeNodeType,
  HybridDOMTreeParentNode,
  HybridDOMTreeRootNode,
  MDWC,
  PropertyUpdateQueue,
} from '../types';
import { attachHybridDOMTreeFromMDWCNode } from './attachHybridDOMTreeFromMDWCNode';
import { createHybridDOMTreeChildNode } from './createHybridDOMTreeChildNode';
import { diffProperties } from './diffProperties';
import { formatMDWCKey } from './formatMDWCKey';
import {
  HybridDOMTreeKeyNodeMap,
  ShiftHybridDOMTreeNodeFromKeyNodeMapMixedReturnType,
  createHybridDOMTreeKeyNodeMap,
  shiftHybridDOMTreeNodeFromKeyNodeMap,
  shiftRestNodesOfHybridDOMTreeKeyNodeMap,
} from './keyNodeMap';

/**
 * Take an MDWC node and build it into a hybrid DOM tree,
 * and compare it with the old one to get the update task queue.
 */
export function diffHybridDOMTree(
  input: MDWC.MDWCNode,
  container: Node,
  prevTree?: HybridDOMTreeRootNode,
): [DiffQueueItem[], HybridDOMTreeRootNode] {
  const diffQueue: DiffQueueItem[] = [];
  const nextTree: HybridDOMTreeRootNode = {
    children: [],
    instance: container,
    type: HybridDOMTreeNodeType.ROOT,
  };
  const queue: TraversalQueueItem[] = [
    {
      prevTree: prevTree || { ...nextTree },
      nextTree,
      nonEmptyMDWCNodes: Children.toArray(input),
    },
  ];

  let top: TraversalQueueItem | undefined;
  let keyNodeMap: HybridDOMTreeKeyNodeMap;

  let node: HybridDOMTreeChildNode;
  let updates: PropertyUpdateQueue;
  let parent: HybridDOMTreeParentNode;
  let existsNode: HybridDOMTreeChildNode | undefined;
  let nonEmptyMDWCNode: MDWC.MDWCElement | MDWC.MDWCText;
  let removedNodes: (HybridDOMTreeChildNode | undefined)[];

  let index: number;
  let lastIndex: number | undefined;
  let nextIndex: number | undefined;
  let mapPrevIndexOfMatchedNodesToNextIndex: number[];
  let matchedNodes: (HybridDOMTreeChildNode | undefined)[];
  let shiftedHybridDOMTreeNode: ShiftHybridDOMTreeNodeFromKeyNodeMapMixedReturnType | [];

  let key: string;
  let tagName: string;
  let textContent: string;

  let traversalIndex: number;

  // eslint-disable-next-line no-cond-assign
  while ((top = queue.shift())) {
    matchedNodes = [];
    mapPrevIndexOfMatchedNodesToNextIndex = [];

    parent = top.nextTree;
    keyNodeMap = createHybridDOMTreeKeyNodeMap(top.prevTree.children);

    for (index = 0; index < top.nonEmptyMDWCNodes.length; index += 1) {
      nonEmptyMDWCNode = top.nonEmptyMDWCNodes[index];

      if (typeof nonEmptyMDWCNode !== 'object') {
        textContent = String(nonEmptyMDWCNode);

        shiftedHybridDOMTreeNode =
          shiftHybridDOMTreeNodeFromKeyNodeMap(
            keyNodeMap,
            HybridDOMTreeNodeType.TEXT,
            textContent,
          ) || [];

        existsNode = shiftedHybridDOMTreeNode[0];
        lastIndex = shiftedHybridDOMTreeNode[1];

        node = createHybridDOMTreeChildNode(HybridDOMTreeNodeType.TEXT, {
          instance:
            existsNode === undefined ? document.createTextNode(textContent) : existsNode.instance,
          parent,
          textContent,
        });

        if (existsNode === undefined || lastIndex === undefined) {
          diffQueue.push({ node, type: DiffType.INSERT });
        } else {
          mapPrevIndexOfMatchedNodesToNextIndex[lastIndex] = matchedNodes.push(node) - 1;
        }

        parent.children.push(node);
        continue;
      }

      key = formatMDWCKey(nonEmptyMDWCNode.key);

      if (isMDWCFragmentType(nonEmptyMDWCNode.type)) {
        shiftedHybridDOMTreeNode =
          shiftHybridDOMTreeNodeFromKeyNodeMap(keyNodeMap, HybridDOMTreeNodeType.FRAGMENT, key) ||
          [];

        existsNode = shiftedHybridDOMTreeNode[0];
        lastIndex = shiftedHybridDOMTreeNode[1];

        node = createHybridDOMTreeChildNode(HybridDOMTreeNodeType.FRAGMENT, {
          children: [],
          key,
          parent,
        });

        if (existsNode === undefined || lastIndex === undefined) {
          attachHybridDOMTreeFromMDWCNode(nonEmptyMDWCNode.children, node);
          diffQueue.push({ node, type: DiffType.INSERT });
        } else {
          mapPrevIndexOfMatchedNodesToNextIndex[lastIndex] = matchedNodes.push(node) - 1;
          queue.push({
            prevTree: existsNode,
            nextTree: node,
            nonEmptyMDWCNodes: Children.toArray(nonEmptyMDWCNode.children),
          });
        }
      } else {
        // * ASSERT `element.type.tagName`
        tagName =
          typeof nonEmptyMDWCNode.type === 'string'
            ? nonEmptyMDWCNode.type
            : nonEmptyMDWCNode.type.tagName!;

        shiftedHybridDOMTreeNode =
          shiftHybridDOMTreeNodeFromKeyNodeMap(
            keyNodeMap,
            HybridDOMTreeNodeType.HTML_ELEMENT,
            tagName,
            key,
          ) || [];

        existsNode = shiftedHybridDOMTreeNode[0];
        lastIndex = shiftedHybridDOMTreeNode[1];

        node = createHybridDOMTreeChildNode(HybridDOMTreeNodeType.HTML_ELEMENT, {
          children: [],
          instance:
            existsNode === undefined ? document.createElement(tagName) : existsNode.instance,
          key,
          parent,
          props: nonEmptyMDWCNode.props,
          ref: nonEmptyMDWCNode.ref,
          tagName,
        });

        if (existsNode === undefined || lastIndex === undefined) {
          attachHybridDOMTreeFromMDWCNode(nonEmptyMDWCNode.children, node);
          diffQueue.push({ node, type: DiffType.INSERT });
        } else {
          updates = diffProperties(existsNode.props, node.props);
          mapPrevIndexOfMatchedNodesToNextIndex[lastIndex] = matchedNodes.push(node) - 1;

          if (updates.length) {
            diffQueue.push({ node, type: DiffType.UPDATE, updates });
          }

          queue.push({
            prevTree: existsNode,
            nextTree: node,
            nonEmptyMDWCNodes: Children.toArray(nonEmptyMDWCNode.children),
          });
        }
      }

      parent.children.push(node);
    }

    for (
      lastIndex = 0, traversalIndex = 0;
      traversalIndex < mapPrevIndexOfMatchedNodesToNextIndex.length;
      traversalIndex += 1
    ) {
      nextIndex = mapPrevIndexOfMatchedNodesToNextIndex[traversalIndex];

      if (nextIndex !== undefined) {
        if (nextIndex === lastIndex) {
          // * ASSERT `nextIndex < matchedNodes.length`
          matchedNodes[nextIndex] = undefined;
        }

        lastIndex += 1;
      }
    }

    for (traversalIndex = 0; traversalIndex < matchedNodes.length; traversalIndex += 1) {
      existsNode = matchedNodes[traversalIndex];

      if (existsNode) {
        diffQueue.push({ node: existsNode, type: DiffType.MOVE });
      }
    }

    removedNodes = shiftRestNodesOfHybridDOMTreeKeyNodeMap(keyNodeMap);

    for (traversalIndex = 0; traversalIndex < removedNodes.length; traversalIndex += 1) {
      existsNode = removedNodes[traversalIndex];

      if (existsNode) {
        diffQueue.push({ node: existsNode, type: DiffType.REMOVE });
      }
    }
  }

  return [diffQueue, nextTree];
}

interface TraversalQueueItem {
  readonly prevTree: HybridDOMTreeParentNode;
  readonly nextTree: HybridDOMTreeParentNode;
  readonly nonEmptyMDWCNodes: readonly (MDWC.MDWCElement | MDWC.MDWCText)[];
}
