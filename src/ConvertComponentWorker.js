import { convertComponent } from "./codemods/convertComponent";

export const convert = async (html) => {
  const { code } = await convertComponent({ name: "Component", html });
  return code;
};
