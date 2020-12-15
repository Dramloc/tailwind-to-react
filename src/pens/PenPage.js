import { useParams } from "react-router-dom";
import { Pen } from "./Pen";
import { usePen } from "./PenQueries";

const PenPage = () => {
  const { penSlug } = useParams();
  const { status, data } = usePen(penSlug);

  return (
    <>
      {status === "success" && data && (
        <Pen
          slug={data.slug}
          defaultName={data.name}
          defaultInput={data.html}
          defaultTailwindConfig={data.tailwindConfig}
        />
      )}
    </>
  );
};

export default PenPage;
