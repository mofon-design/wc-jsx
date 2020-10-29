import type { ArgsType } from '@mofon-design/wc-core';
import { DiffQueueItem, DiffType, HybridDOMTreeChildNode, HybridDOMTreeNodeType } from '../types';
import { applyMDWCRef } from './applyMDWCRef';
import { applyProperties, applyPropertyUpdateQueue } from './applyProperties';

/**
 * Apply the comparison results of next hybrid DOM tree and the old one
 * to the browser DOM tree, and update the reference to the browser DOM tree node.
 */
export function applyHybridDOMTreeDiff(queue: DiffQueueItem[]): void {
  const fragment = document.createDocumentFragment();

  let instance: Node;
  let parentInstance: Node;
  let childInstances: readonly Node[];
  let nextSiblingInstance: Node | null;

  let payload: DiffQueueItem;
  let node: HybridDOMTreeChildNode;
  let childrenQueue: HybridDOMTreeChildNode[];
  let child: HybridDOMTreeChildNode | undefined;
  let children: readonly HybridDOMTreeChildNode[];

  let refUpdate: ArgsType<typeof applyMDWCRef>;
  let refUpdatesQueue: ArgsType<typeof applyMDWCRef>[] = [];
  let refUpdatesQueueFragment: ArgsType<typeof applyMDWCRef>[];

  let childrenAndParentInstanceQueue: [readonly HybridDOMTreeChildNode[], Node][];
  let childrenAndParentInstanceQueueItem: [readonly HybridDOMTreeChildNode[], Node] | undefined;

  let queueTraversalIndex: number;
  let childTraversalIndex: number;
  let instanceTraversalIndex: number;
  let refUpdateTraversalIndex: number;

  for (queueTraversalIndex = 0; queueTraversalIndex < queue.length; queueTraversalIndex += 1) {
    payload = queue[queueTraversalIndex];

    switch (payload.type) {
      case DiffType.UPDATE:
        applyPropertyUpdateQueue(payload.updates, payload.node);
        break;
      case DiffType.INSERT:
        node = payload.node;

        if (node.type === HybridDOMTreeNodeType.TEXT) {
          // * ASSERT `node.nextSiblingInstance.parentNode.isSameNode(node.parentInstance)`
          node.parentInstance.insertBefore(node.instance, node.nextSiblingInstance);
          break;
        }

        if (node.type === HybridDOMTreeNodeType.FRAGMENT) {
          instance = fragment;
        } else {
          instance = node.instance;
          // includes ref
          applyProperties(node);
        }

        childrenAndParentInstanceQueue = [[node.children, instance]];

        // eslint-disable-next-line no-cond-assign
        while ((childrenAndParentInstanceQueueItem = childrenAndParentInstanceQueue.shift())) {
          children = childrenAndParentInstanceQueueItem[0];
          parentInstance = childrenAndParentInstanceQueueItem[1];

          for (
            childTraversalIndex = 0;
            childTraversalIndex < children.length;
            childTraversalIndex += 1
          ) {
            child = children[childTraversalIndex];

            switch (child.type) {
              case HybridDOMTreeNodeType.HTML_ELEMENT:
                // includes ref
                applyProperties(child);
                parentInstance.appendChild(child.instance);
                childrenAndParentInstanceQueue.push([child.children, child.instance]);
                break;
              case HybridDOMTreeNodeType.TEXT:
                parentInstance.appendChild(child.instance);
                break;
              case HybridDOMTreeNodeType.FRAGMENT:
                childrenAndParentInstanceQueue.push([child.children, parentInstance]);
                break;
              default:
                break;
            }
          }
        }

        // * ASSERT `node.nextSiblingInstance.parentNode.isSameNode(node.parentInstance)`
        node.parentInstance.insertBefore(instance, node.nextSiblingInstance);

        break;
      case DiffType.REMOVE:
        node = payload.node;

        if (node.type === HybridDOMTreeNodeType.TEXT) {
          // * ASSERT `node.instance.parentNode.isSameNode(node.parentInstance)`
          node.parentInstance.removeChild(node.instance);
          break;
        }

        refUpdatesQueueFragment = [];
        childrenQueue = node.children.slice(0);

        if (node.type === HybridDOMTreeNodeType.FRAGMENT) {
          childInstances = node.childInstances;

          if (childInstances.length) {
            parentInstance = node.parentInstance;

            for (
              instanceTraversalIndex = 0;
              instanceTraversalIndex < childInstances.length;
              instanceTraversalIndex += 1
            ) {
              instance = childInstances[instanceTraversalIndex];
              // * ASSERT `instance.parentNode.isSameNode(parentInstance)`
              parentInstance.removeChild(instance);
            }
          }
        } else {
          // * ASSERT `node.instance.parentNode.isSameNode(node.parentInstance)`
          node.parentInstance.removeChild(node.instance);

          if (node.ref) {
            refUpdatesQueueFragment.unshift([node.ref, null]);
          }
        }

        // eslint-disable-next-line no-cond-assign
        while ((child = childrenQueue.shift())) {
          switch (child.type) {
            case HybridDOMTreeNodeType.HTML_ELEMENT:
              if (child.ref) {
                refUpdatesQueueFragment.unshift([child.ref, null]);
              }
              childrenQueue = child.children.concat(childrenQueue);
              break;
            case HybridDOMTreeNodeType.FRAGMENT:
              childrenQueue = child.children.concat(childrenQueue);
              break;
            default:
              break;
          }
        }

        refUpdatesQueue = refUpdatesQueue.concat(refUpdatesQueueFragment);

        break;
      case DiffType.MOVE:
        node = payload.node;

        if (node.type === HybridDOMTreeNodeType.FRAGMENT) {
          childInstances = node.childInstances;

          if (childInstances.length) {
            // for (instanceIndex = 0; instanceIndex < childInstances.length; instanceIndex += 1) {
            //   instance = childInstances[instanceIndex];
            //   fragment.appendChild(instance);
            // }

            // node.parentInstance.insertBefore(fragment, node.nextSiblingInstance);

            // * ASSERT `nextSiblingInstance.parentNode.isSameNode(parentInstance)`
            parentInstance = node.parentInstance;
            nextSiblingInstance = node.nextSiblingInstance;

            for (
              instanceTraversalIndex = childInstances.length - 1;
              instanceTraversalIndex >= 0;
              instanceTraversalIndex -= 1
            ) {
              instance = childInstances[instanceTraversalIndex];
              parentInstance.insertBefore(instance, nextSiblingInstance);
              nextSiblingInstance = instance;
            }
          }
        } else {
          // * ASSERT `node.nextSiblingInstance.parentNode.isSameNode(node.parentInstance)`
          node.parentInstance.insertBefore(node.instance, node.nextSiblingInstance);
        }

        break;
      default:
        break;
    }
  }

  for (
    refUpdateTraversalIndex = 0;
    refUpdateTraversalIndex < refUpdatesQueue.length;
    refUpdateTraversalIndex += 1
  ) {
    refUpdate = refUpdatesQueue[refUpdateTraversalIndex];
    applyMDWCRef(refUpdate[0], refUpdate[1]);
  }
}
