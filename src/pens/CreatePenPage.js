import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Redirect } from "react-router-dom";
import { v4 as uuid } from "uuid";
import { defaultTailwindConfig } from "../examples/examples";
import { useCreatePen } from "./PenQueries";

const CreatePenPage = () => {
  const { mutate: createPen, status, data: pen } = useCreatePen();
  useEffect(() => {
    createPen({
      slug: uuid(),
      name: "New Pen",
      html: "",
      tailwindConfig: defaultTailwindConfig,
    });
  }, [createPen]);
  return (
    <>
      <Helmet title="Creating a new pen..." />
      {status === "success" && <Redirect to={`/pens/${pen.slug}`} />}
    </>
  );
};

export default CreatePenPage;