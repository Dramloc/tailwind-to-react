import { transformAsync } from "@babel/core";
import buildAllSyntaxPlugin from "@codemod/core/src/AllSyntaxPlugin";
import RecastPlugin from "@codemod/core/src/RecastPlugin";
import { xData } from "./xData";

const transform = async (code) => {
  return transformAsync(code, {
    plugins: [xData, buildAllSyntaxPlugin("unambiguous"), RecastPlugin],
  });
};

test("should replace element with x-transition attributes with a Transition component", async () => {
  const { code } = await transform(`const Component = () => {
  return (
    <div
      x-data="{ open: true }"
      x-show="open"
      x-transition:enter="transition ease-out duration-100"
      x-transition:enter-start="transform opacity-0 scale-95"
      x-transition:enter-end="transform opacity-100 scale-100"
      x-transition:leave="transition ease-in duration-75"
      x-transition:leave-start="transform opacity-100 scale-100"
      x-transition:leave-end="transform opacity-0 scale-95"
    >
      Foo
    </div>
  );
}`);
  expect(code).toStrictEqual(`const Component = () => {\r
  const [_open, _setOpen] = useState(true);\r
  return (\r
    <Transition\r
      show={_open}\r
      enter="transition ease-out duration-100"\r
      enterFrom="transform opacity-0 scale-95"\r
      enterTo="transform opacity-100 scale-100"\r
      leave="transition ease-in duration-75"\r
      leaveFrom="transform opacity-100 scale-100"\r
      leaveTo="transform opacity-0 scale-95"\r
      as="div"\r
    >\r
      Foo\r
    </Transition>\r
  );\r
}`);
});


test("should replace element with x-transition attributes with a Transition.Child component if there is a parent element with the same x-show expression", async () => {
  const { code } = await transform(`const Component = () => {
  return (
    <div x-data="{ open: true }" x-show="open">
      <div
        x-show="open"
        x-transition:enter="transition ease-out duration-100"
        x-transition:enter-start="transform opacity-0 scale-95"
        x-transition:enter-end="transform opacity-100 scale-100"
        x-transition:leave="transition ease-in duration-75"
        x-transition:leave-start="transform opacity-100 scale-100"
        x-transition:leave-end="transform opacity-0 scale-95"
      >
        Foo
      </div>
      <div
        x-show="open"
        x-transition:enter="transition ease-out duration-100"
        x-transition:enter-start="transform opacity-0 scale-95"
        x-transition:enter-end="transform opacity-100 scale-100"
        x-transition:leave="transition ease-in duration-75"
        x-transition:leave-start="transform opacity-100 scale-100"
        x-transition:leave-end="transform opacity-0 scale-95"
      >
        Bar
      </div>
    </div>
  );
}`);
  expect(code).toStrictEqual(`const Component = () => {\r
  const [_open, _setOpen] = useState(true);\r
  return (\r
    <Transition show={_open} as="div">\r
      <Transition.Child\r
        enter="transition ease-out duration-100"\r
        enterFrom="transform opacity-0 scale-95"\r
        enterTo="transform opacity-100 scale-100"\r
        leave="transition ease-in duration-75"\r
        leaveFrom="transform opacity-100 scale-100"\r
        leaveTo="transform opacity-0 scale-95"\r
        as="div"\r
      >\r
        Foo\r
      </Transition.Child>\r
      <Transition.Child\r
        enter="transition ease-out duration-100"\r
        enterFrom="transform opacity-0 scale-95"\r
        enterTo="transform opacity-100 scale-100"\r
        leave="transition ease-in duration-75"\r
        leaveFrom="transform opacity-100 scale-100"\r
        leaveTo="transform opacity-0 scale-95"\r
        as="div"\r
      >\r
        Bar\r
      </Transition.Child>\r
    </Transition>\r
  );\r
}`);
});



test("should handle nested transitions with different x-show values", async () => {
  const { code } = await transform(`const Component = () => {
  return (
    <div
      x-data="{ open: true, open2: true }"
      x-show="open"
      x-transition:enter="transition ease-out duration-100"
      x-transition:enter-start="transform opacity-0 scale-95"
      x-transition:enter-end="transform opacity-100 scale-100"
      x-transition:leave="transition ease-in duration-75"
      x-transition:leave-start="transform opacity-100 scale-100"
      x-transition:leave-end="transform opacity-0 scale-95"
    >
      <div
        x-show="open2"
        x-transition:enter="transition ease-out duration-100"
        x-transition:enter-start="transform opacity-0 scale-95"
        x-transition:enter-end="transform opacity-100 scale-100"
        x-transition:leave="transition ease-in duration-75"
        x-transition:leave-start="transform opacity-100 scale-100"
        x-transition:leave-end="transform opacity-0 scale-95"
      >
        Foo
      </div>
    </div>
  );
}`);
  expect(code).toStrictEqual(`const Component = () => {\r
  const [_open2, _setOpen2] = useState(true);\r
  const [_open, _setOpen] = useState(true);\r
  return (\r
    <Transition\r
      show={_open}\r
      enter="transition ease-out duration-100"\r
      enterFrom="transform opacity-0 scale-95"\r
      enterTo="transform opacity-100 scale-100"\r
      leave="transition ease-in duration-75"\r
      leaveFrom="transform opacity-100 scale-100"\r
      leaveTo="transform opacity-0 scale-95"\r
      as="div"\r
    >\r
      <Transition\r
        show={_open2}\r
        enter="transition ease-out duration-100"\r
        enterFrom="transform opacity-0 scale-95"\r
        enterTo="transform opacity-100 scale-100"\r
        leave="transition ease-in duration-75"\r
        leaveFrom="transform opacity-100 scale-100"\r
        leaveTo="transform opacity-0 scale-95"\r
        as="div">\r
        Foo\r
      </Transition>\r
    </Transition>\r
  );\r
}`);
});
