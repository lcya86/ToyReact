class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type);
  }

  setAttribute(name, value) {
    this.root.setAttribute(name, value);
  }

  appendChild(c) {
    this.root.appendChild(c.root);
  }
}

class TextWrapper {
  constructor(text) {
    this.root = document.createTextNode(text);
  }
}

export class Component {
  constructor() {
    this.props = Object.create(null);
    this.children = [];
    this._root = null;
  }
  get root() {
    if (!this._root) {
      this._root = this.render().root;
    }
    return this._root;
  }
  setAttribute(name, value) {
    this.props[name] = value;
  }

  appendChild(c) {
    this.children.push(c);
  }
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
  parentElement.appendChild(component.root);
};
