import styled from "@emotion/styled";
import tw from "twin.macro";

export const Select = styled(
  "select"
)(
  tw`bg-transparent border-none font-medium text-sm focus:(outline-none ring-0) transition-colors duration-200`,
  tw`text-gray-500 focus:text-gray-900`,
  tw`dark:(text-gray-400 focus:text-white)`,
  { textAlignLast: "right" }
);

export const SelectOption = styled("option")(
  tw`text-gray-900 bg-white dark:text-white dark:bg-gray-900`
);
