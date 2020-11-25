import { transformAsync } from "@babel/core";
import pluginSyntaxJsx from "@babel/plugin-syntax-jsx";
import { recastPlugin } from "./convertComponent";
import { xData } from "./xData";

const transform = async (code) => {
  return transformAsync(code, {
    plugins: [xData, pluginSyntaxJsx, recastPlugin],
  });
};

test("should replace element children with x-text expression and replace expression identifiers with xData mappings", async () => {
  const { code } = await transform(`const Component = () => {
  return (
    <div x-data="{ index: 0 }" x-text="['Foo', 'Bar', 'Baz'][index]">
      Foo
    </div>
  );
}`);
  expect(code).toStrictEqual(`const Component = () => {\r
  const [_index, _setIndex] = useState(0);\r
  return <div>{["Foo", "Bar", "Baz"][_index]}</div>;\r
}`);
});
