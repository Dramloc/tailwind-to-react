import Editor from "@monaco-editor/react";
import "twin.macro";
import { useColorMode } from "./shared/ColorModeProvider";
import { Spinner } from "./shared/Spinner";

const CodeEditor = ({ value, onChange = () => {}, language, options, ...props }) => {
  const { colorMode } = useColorMode();
  const onEditorDidMount = (_, editor) => {
    editor.onDidChangeModelContent(() => {
      onChange(editor.getValue());
    });
  };
  return (
    <Editor
      tw="w-full h-full"
      loading={<Spinner>Loading editor</Spinner>}
      language={language}
      value={value}
      editorDidMount={onEditorDidMount}
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
  );
};

export default CodeEditor;
