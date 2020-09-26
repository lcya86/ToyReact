const RENDER_TO_DOM = Symbol("render to dom");
export class Component {
  constructor() {
    this.props = Object.create(null);
    this.children = [];
    this._range = null;
  }

  setAttribute(name, value) {
    this.props[name] = value;
  }

  appendChild(c) {
    this.children.push(c);
  }

  [RENDER_TO_DOM](range) {
    this._range = range;
    this._vdom = this.vdom;
    this._vdom[RENDER_TO_DOM](range);
  }

  get vdom() {
    return this.render().vdom;
  }

  update() {
    const isSameNode = (oldNode, newNode) => {
      if (oldNode.type !== newNode.type) {
        return false;
      }

      if (
        Object.keys(oldNode.props).length > Object.keys(newNode.props).length
      ) {
        return false;
      }

      for (let name in newNode.props) {
        if (newNode.props[name] !== oldNode.props[name]) {
          return false;
        }
      }

      if (newNode.type === "#text" && newNode.text !== oldNode.text) {
        return false;
      }

      return true;
    };

    const update = (oldNode, newNode) => {
      if (!isSameNode(oldNode, newNode)) {
        newNode[RENDER_TO_DOM](oldNode._range);
        return;
      }
      newNode._range = oldNode._range;

      const newChildren = newNode.vChildren;
      const oldChildren = oldNode.vChildren;

      let tailRange = oldChildren[oldChildren.length - 1]._range;

      for (let i = 0; i < newChildren.length; i++) {
        const newChild = newChildren[i];
        const oldChild = oldChildren[i];
        if (i < oldChildren.length) {
          update(oldChild, newChild);
        } else {
          const range = document.createRange();
          range.setStart(tailRange.endContainer, tailRange.endOffset);
          range.setEnd(tailRange.endContainer, tailRange.endOffset);
          newChild[RENDER_TO_DOM](range);
          tailRange = range;
        }
      }
    };

    const vdom = this.vdom;
    update(this._vdom, vdom);
    this._vdom = vdom;
  }

  // rerender() {
  //   let oldRange = this._range;

  //   let range = document.createRange();
  //   range.setStart(oldRange.startContainer, oldRange.startOffset);
  //   range.setEnd(oldRange.startContainer, oldRange.startOffset);
  //   this[RENDER_TO_DOM](range);

  //   oldRange.setStart(range.endContainer, range.endOffset);
  //   oldRange.deleteContents();
  // }

  setState(newState) {
    if (this.state === null || typeof this.state !== "object") {
      this.state = newState;
      this.update();
      return;
    }

    const merge = (oldState, newState) => {
      for (let p in newState) {
        if (oldState[p] === null || typeof oldState[p] !== "object") {
          oldState[p] = newState[p];
        } else {
          merge(oldState[p], newState[p]);
        }
      }
    };

    merge(this.state, newState);
    this.update();
  }
}
class ElementWrapper extends Component {
  constructor(type) {
    super(type);
    this.type = type;
  }

  // setAttribute(name, value) {
  //   if (name.match(/^on([\s\S]+)$/)) {
  //     this.root.addEventListener(
  //       RegExp.$1.replace(/^[\s\S]/, (c) => c.toLowerCase()),
  //       value
  //     );
  //   } else if (name.toLowerCase() === "classname") {
  //     this.root.setAttribute("class", value);
  //   } else {
  //     this.root.setAttribute(name, value);
  //   }
  // }

  // appendChild(component) {
  //   let range = document.createRange();
  //   range.setStart(this.root, this.root.childNodes.length);
  //   range.setEnd(this.root, this.root.childNodes.length);
  //   component[RENDER_TO_DOM](range);
  // }

  get vdom() {
    this.vChildren = this.children.map((item) => item.vdom);
    return this;
  }

  [RENDER_TO_DOM](range) {
    this._range = range;

    const root = document.createElement(this.type);

    for (let name in this.props) {
      if (name.match(/^on([\s\S]+)$/)) {
        root.addEventListener(
          RegExp.$1.replace(/^[\s\S]/, (c) => c.toLowerCase()),
          this.props[name]
        );
      } else if (name.toLowerCase() === "classname") {
        root.setAttribute("class", this.props[name]);
      } else {
        root.setAttribute(name, this.props[name]);
      }
    }

    if (!this.vChildren) {
      this.vChildren = this.children.map((item) => item.vdom);
    }

    for (let component of this.vChildren) {
      let childRange = document.createRange();
      childRange.setStart(root, root.childNodes.length);
      childRange.setEnd(root, root.childNodes.length);
      component[RENDER_TO_DOM](childRange);
    }

    replaceContent(range, root);
  }
}

class TextWrapper extends Component {
  constructor(text) {
    super(text);
    this.text = text;
    this.type = "#text";
  }
  get vdom() {
    return this;
  }
  [RENDER_TO_DOM](range) {
    this._range = range;
    const root = document.createTextNode(this.text);
    replaceContent(range, root);
  }
}

function replaceContent(range, node) {
  range.insertNode(node);
  range.setStartAfter(node);
  range.deleteContents();

  range.setStartBefore(node);
  range.setEndAfter(node);
}

export const createElement = (type, attributes, ...children) => {
  let e;
  if (typeof type === "string") {
    e = new ElementWrapper(type);
  } else {
    e = new type();
  }

  for (let p in attributes) {
    e.setAttribute(p, attributes[p]);
  }
  let insertChildren = (children) => {
    for (let c of children) {
      if (typeof c === "string") {
        c = new TextWrapper(c);
      }
      if (c === null) {
        continue;
      }
      if (typeof c === "object" && c instanceof Array) {
        insertChildren(c);
      } else {
        e.appendChild(c);
      }
    }
  };
  insertChildren(children);

  return e;
};

export const render = (component, parentElement) => {
  let range = document.createRange();
  range.setStart(parentElement, 0);
  range.setEnd(parentElement, parentElement.childNodes.length);
  range.deleteContents();
  component[RENDER_TO_DOM](range);
};
