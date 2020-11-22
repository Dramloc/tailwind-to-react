import Editor from "@monaco-editor/react";
import { useColorMode } from "./shared/ColorModeProvider";
import { Spinner } from "./shared/Spinner";

export const CodeEditor = ({ value, onChange = () => {}, language, options, className }) => {
  const { colorMode } = useColorMode();
  const onEditorDidMount = (_, editor) => {
    editor.onDidChangeModelContent(() => {
      onChange(editor.getValue());
    });
  };
  return (
    <Editor
      className={className}
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
    />
  );
};
