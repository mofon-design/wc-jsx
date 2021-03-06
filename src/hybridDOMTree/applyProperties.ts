import { setValueForProperty, setValueForStyles } from '../DOMOperations';
import { ReservedProperty } from '../shared/reservedProperties';
import { HybridDOMTreeHTMLElementNode, MDWC, PropertyUpdateQueue } from '../types';
import { applyMDWCRef } from './applyMDWCRef';

function hasOwnProperty<T>(target: T, property: keyof any): property is keyof T {
  return Object.prototype.hasOwnProperty.call(target, property);
}

/**
 * Apply the changes of the properties to the instance.
 */
export function applyPropertyUpdateQueue(
  queue: PropertyUpdateQueue,
  node: HybridDOMTreeHTMLElementNode,
): void {
  let propKey: string;
  let oldValue: unknown;
  let newValue: unknown;

  let queueTraversalIndex: number;

  for (queueTraversalIndex = 0; queueTraversalIndex < queue.length; queueTraversalIndex += 1) {
    propKey = queue[queueTraversalIndex][0];
    oldValue = queue[queueTraversalIndex][1];
    newValue = queue[queueTraversalIndex][2];

    if (propKey === ReservedProperty.REF) {
      applyMDWCRef(oldValue as MDWC.Ref<Node>, null);
      applyMDWCRef(newValue as MDWC.Ref<Node>, node.instance);
    } else if (propKey === ReservedProperty.STYLE) {
      if (newValue === undefined) {
        setValueForProperty(node.instance, propKey, undefined);
      } else {
        setValueForStyles(node.instance, newValue as Record<string, unknown>);
      }
    } else {
      // TODO event listener
      setValueForProperty(node.instance, propKey, newValue);
    }
  }
}

/**
 * Apply the the properties to a new instance.
 */
export function applyProperties(node: HybridDOMTreeHTMLElementNode): void {
  const props = node.props;

  let propKey: string;
  let propValue: unknown;

  for (propKey in props) {
    if (!hasOwnProperty(props, propKey)) {
      continue;
    }

    propValue = props[propKey];
    if (propKey === ReservedProperty.REF) {
      applyMDWCRef(propValue as MDWC.Ref<Node>, node.instance);
    } else if (propKey === ReservedProperty.STYLE) {
      if (propValue !== undefined) {
        setValueForStyles(node.instance, propValue as Record<string, unknown>);
      }
    } else {
      // TODO event listener
      setValueForProperty(node.instance, propKey, propValue);
    }
  }
}
