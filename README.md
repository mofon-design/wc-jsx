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
