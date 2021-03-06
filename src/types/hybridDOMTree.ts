import { MDWC } from './jsx';

/**
 * Enumerate the types of all kinds of nodes in the tree.
 */
export const enum HybridDOMTreeNodeType {
  FRAGMENT,
  HTML_ELEMENT,
  ROOT,
  TEXT,
}

/**
 * The type of node that can be a child of the hybrid DOM tree.
 */
export type HybridDOMTreeChildNodeType = Exclude<HybridDOMTreeNodeType, HybridDOMTreeNodeType.ROOT>;

/**
 * The common properties of child nodes.
 * Properties are *queried at access time*, and used when applying DOM updates,
 * except `parent`.
 */
export interface HybridDOMTreeChildNodeProps {
  readonly childInstances: Node[];
  readonly nextSiblingInstance: Node | null;
  readonly parent: HybridDOMTreeParentNode;
  readonly parentInstance: Node;
}

/**
 * The properties of the child node that need to be configured.
 */
export type HybridDOMTreeChildNodeDescribedPropKeys = Exclude<
  keyof HybridDOMTreeChildNodeProps,
  'parent'
>;

export interface HybridDOMTreeFragmentNode extends HybridDOMTreeChildNodeProps {
  readonly children: HybridDOMTreeChildNode[];
  readonly key: string;
  readonly type: HybridDOMTreeNodeType.FRAGMENT;
}

export interface HybridDOMTreeHTMLElementNode
  extends HybridDOMTreeChildNodeProps,
    Readonly<Pick<MDWC.MDWCElement, 'props' | 'ref'>> {
  readonly children: HybridDOMTreeChildNode[];
  readonly instance: HTMLElement;
  readonly key: string;
  readonly tagName: string;
  readonly type: HybridDOMTreeNodeType.HTML_ELEMENT;
}

export interface HybridDOMTreeTextNode extends HybridDOMTreeChildNodeProps {
  readonly instance: Text;
  readonly textContent: string;
  readonly type: HybridDOMTreeNodeType.TEXT;
}

export interface HybridDOMTreeRootNode {
  readonly children: HybridDOMTreeChildNode[];
  readonly instance: Node;
  readonly type: HybridDOMTreeNodeType.ROOT;
}

export interface HybridDOMTreeChildNodeTypeMap {
  [HybridDOMTreeNodeType.FRAGMENT]: HybridDOMTreeFragmentNode;
  [HybridDOMTreeNodeType.HTML_ELEMENT]: HybridDOMTreeHTMLElementNode;
  [HybridDOMTreeNodeType.TEXT]: HybridDOMTreeTextNode;
}

/**
 * Nodes that can be a child of the hybrid DOM tree.
 */
export type HybridDOMTreeChildNode =
  | HybridDOMTreeFragmentNode
  | HybridDOMTreeHTMLElementNode
  | HybridDOMTreeTextNode;

/**
 * Nodes that can be a parent of the hybrid DOM tree.
 */
export type HybridDOMTreeParentNode =
  | HybridDOMTreeFragmentNode
  | HybridDOMTreeHTMLElementNode
  | HybridDOMTreeRootNode;

/**
 * Nodes of the hybrid DOM tree.
 */
export type HybridDOMTreeNode =
  | HybridDOMTreeFragmentNode
  | HybridDOMTreeHTMLElementNode
  | HybridDOMTreeRootNode
  | HybridDOMTreeTextNode;

export const enum DiffType {
  INSERT,
  MOVE,
  REMOVE,
  UPDATE,
}

export type PropertyUpdateQueueItem = readonly [
  propertyKey: string,
  oldValue: unknown,
  newValue: unknown,
];

export type PropertyUpdateQueue = readonly PropertyUpdateQueueItem[];

export type DiffQueueInsertedItem = {
  readonly node: HybridDOMTreeChildNode;
  readonly type: DiffType.INSERT;
};

export type DiffQueueMovedItem = {
  readonly node: HybridDOMTreeChildNode;
  readonly type: DiffType.MOVE;
};

export type DiffQueueRemovedItem = {
  readonly node: HybridDOMTreeChildNode;
  readonly type: DiffType.REMOVE;
};

export type DiffQueueUpdatedItem = {
  readonly node: HybridDOMTreeHTMLElementNode;
  readonly type: DiffType.UPDATE;
  readonly updates: PropertyUpdateQueue;
};

export type DiffQueueItem =
  | DiffQueueInsertedItem
  | DiffQueueMovedItem
  | DiffQueueRemovedItem
  | DiffQueueUpdatedItem;
