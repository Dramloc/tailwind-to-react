import { useParams } from "react-router-dom";
import { Pen } from "../pens/Pen";
import { useExample } from "./ExampleQueries";

const ExamplePage = () => {
  const { exampleSlug } = useParams();
  const { status, data } = useExample(exampleSlug);

  return (
    <>
      {status === "success" && data && (
        <Pen defaultInput={data.html} defaultTailwindConfig={data.tailwindConfig} />
      )}
    </>
  );
};

export default ExamplePage;
