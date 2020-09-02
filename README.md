# WC JSX

Create web components with JSX.

[![NPM version](https://img.shields.io/npm/v/@mofon-design/wc-jsx.svg?style=flat)](https://www.npmjs.com/package/@mofon-design/wc-jsx) [![Install size](https://packagephobia.com/badge?p=@mofon-design/wc-jsx)](https://packagephobia.com/result?p=@mofon-design/wc-jsx)

## Examples

See [example](https://github.com/mofon-design/wc-jsx/tree/master/example) directory.

Or [visit preview site](https://wc-jsx.netlify.com/).

### Basic

```tsx
import { CoreElement, property, tag } from '@mofon-design/wc-core';
import MDWC, { applyHybridDOMTreeDiff, createRef, diffHybridDOMTree } from '@mofon-design/wc-jsx';
import { HybridDOMTreeRootNode } from '@mofon-design/wc-jsx/es/types';

@tag('search-input')
export class SearchInput extends HTMLElement implements CoreElement {
  @property('string')
  value!: string;

  hybridDOMTree?: HybridDOMTreeRootNode;

  button = createRef<HTMLButtonElement>();

  input = createRef<HTMLInputElement>();

  attributeChangedCallback() {
    console.log('attribute changed, this.value =', this.value);
    this.forceUpdate();
  }

  initialize() {
    this.forceUpdate();
    this.input.current?.addEventListener('input', this.onInput);
    this.button.current?.addEventListener('click', this.onClickButton);

    console.log('initialized, refs:', this.input, this.button);
  }

  forceUpdate() {
    const [diffQueue, hybridDOMTree] = diffHybridDOMTree(this.render(), this, this.hybridDOMTree);
    this.hybridDOMTree = hybridDOMTree;
    applyHybridDOMTreeDiff(diffQueue);
  }

  onInput = () => {
    if (this.input.current) {
      this.value = this.input.current.value;
    }
  };

  onClickButton = () => {
    // eslint-disable-next-line no-alert
    alert(`Search '${this.value}'`);
  };

  render() {
    return (
      <MDWC.Fragment>
        <input ref={this.input} />
        <button ref={this.button} type="button">
          Search
        </button>
        <p>{this.value}</p>
      </MDWC.Fragment>
    );
  }
}
```

### With `key`

```tsx
import { CoreElement, tag } from '@mofon-design/wc-core';
import MDWC, { applyHybridDOMTreeDiff, diffHybridDOMTree } from '@mofon-design/wc-jsx';
import { HybridDOMTreeRootNode } from '@mofon-design/wc-jsx/es/types';

@tag('random-order-list', { extends: 'ul' })
export class RandomOrderList extends HTMLUListElement implements CoreElement {
  items = [
    'Modify the contents of any input',
    'Click anywhere else on the page',
    'The inputs will be reordered',
    'But the modified input will still exist',
    'That is, when reordering, the inputs are not recreated',
    'Because MDWC recognizes elements by the property `key`',
  ];

  hybridDOMTree?: HybridDOMTreeRootNode;

  connectedCallback() {
    document.body.addEventListener('click', this.onReorder);
  }

  disconnectedCallback() {
    document.body.removeEventListener('click', this.onReorder);
  }

  forceUpdate() {
    const [diffQueue, hybridDOMTree] = diffHybridDOMTree(this.render(), this, this.hybridDOMTree);
    this.hybridDOMTree = hybridDOMTree;
    applyHybridDOMTreeDiff(diffQueue);
  }

  initialize() {
    this.forceUpdate();
    this.style.width = '54ex';
    this.addEventListener('click', (event) => event.stopPropagation(), { capture: true });
  }

  onReorder = () => {
    const reordered: string[] = [];

    for (const item of this.items) {
      reordered.splice(Math.trunc(Math.random() * reordered.length), 0, item);
    }

    console.log(`reordered: ${reordered.join(', ')}`);

    this.items = reordered;
    this.forceUpdate();
  };

  render() {
    return this.items.map((item) => (
      <li key={item}>
        <input style={{ width: '54ex' }} value={item} />
      </li>
    ));
  }
}
```
