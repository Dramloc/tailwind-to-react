// @ts-check
import Editor from "@monaco-editor/react";
import clsx from "clsx";
import { useColorMode } from "./shared/ColorModeProvider";
import { Spinner } from "./shared/Spinner";

const noop = () => {};

/**
 * Controlled code editor component based on the Monaco editor.
 * @type {React.FC<import("@monaco-editor/react").EditorProps & { onChange?: (value: string) => void }>}
 */
export const CodeEditor = ({ onChange = noop, options, className, ...props }) => {
  const { colorMode } = useColorMode();

  /** @type {import("@monaco-editor/react").EditorDidMount} */
  const onEditorDidMount = (getEditorValue, editor) => {
    editor.onDidChangeModelContent(() => {
      onChange(getEditorValue());
    });
  };

  return (
    <div className={clsx("h-full w-full", className)}>
      <Editor
        editorDidMount={onEditorDidMount}
        loading={<Spinner>Loading editor</Spinner>}
        theme={colorMode}
        options={{
          fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontSize: 14,
          lineHeight: 21,
          minimap: { enabled: false },
          ...options,
        }}
        {...props}
      />
    </div>
  );
};
