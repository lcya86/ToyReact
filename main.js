import { render, Component, createElement } from "./toy-react";

class MyComponent extends Component {
  render() {
    return (
      <div>
        <div>My Component</div>
        {this.children}
      </div>
    );
  }
}

render(
  <MyComponent id="a" class="b" className="c">
    <p>aaa</p>
    <p>aaa</p>
    <div>
      <p>aaa</p>
    </div>
  </MyComponent>,
  document.body
);
