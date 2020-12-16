import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { Pen } from "./Pen";
import { usePen } from "./PenQueries";

const PenPage = () => {
  const { penSlug } = useParams();
  const { status, data: pen } = usePen(penSlug);

  return (
    <>
      {status === "success" && pen && (
        <>
          <Helmet title={pen.name} />
          <Pen
            slug={pen.slug}
            defaultName={pen.name}
            defaultInput={pen.html}
            defaultTailwindConfig={pen.tailwindConfig}
          />
        </>
      )}
    </>
  );
};

export default PenPage;
