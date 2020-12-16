import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { Pen } from "../pens/Pen";
import { useExample } from "./ExampleQueries";

const ExamplePage = () => {
  const { exampleSlug } = useParams();
  const { status, data: example } = useExample(exampleSlug);

  return (
    <>
      {status === "success" && example && (
        <>
          <Helmet title={example.name} />
          <Pen defaultInput={example.html} defaultTailwindConfig={example.tailwindConfig} />
        </>
      )}
    </>
  );
};

export default ExamplePage;
