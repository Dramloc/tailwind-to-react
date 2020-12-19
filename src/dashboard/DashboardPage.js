// @ts-check
/** @jsxImportSource @emotion/react */
import styled from "@emotion/styled";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import tw from "twin.macro";
import { usePens } from "../pens/PenQueries";
import { ColorModeSwitch } from "../shared/ColorModeSwitch";
import { Navbar } from "../shared/Navbar";

const PenListHeading = styled("h2")(
  tw`text-xs font-medium uppercase tracking-wide`,
  tw`text-gray-500`,
  tw`dark:text-gray-400`
);

const PenList = styled("ul")(
  tw`mt-3 grid grid-cols-1 gap-5`,
  tw`sm:(gap-6 grid-cols-2)`,
  tw`lg:(grid-cols-4)`
);

/** @type {React.FC<{ pen: import("../pens/PenQueries").Pen }>} */
const PenListItem = ({ pen }) => {
  return (
    <li>
      <Link
        to={`/pens/${pen.slug}`}
        className="group"
        css={[
          tw`block rounded-md border transition hocus:shadow-lg focus:outline-none`,
          tw`bg-white border-gray-200 hocus:(bg-primary-500 border-transparent)`,
          tw`dark:(bg-gray-800 border-transparent hocus:bg-primary-600)`,
        ]}
      >
        <div tw="relative rounded-t-md w-full h-48 overflow-hidden bg-gray-200 dark:bg-gray-900">
          {pen.thumbnail && <img tw="w-full" src={URL.createObjectURL(pen.thumbnail)} alt="" />}
        </div>
        <dl tw="p-4 rounded-b-md">
          <div>
            <dt tw="sr-only">Name</dt>
            <dd
              css={[
                tw`leading-6 font-medium truncate transition`,
                tw`text-black group-hocus:text-white`,
                tw`dark:(text-white)`,
              ]}
            >
              {pen.name}
            </dd>
          </div>
        </dl>
      </Link>
    </li>
  );
};

const CreatePenPlaceholder = () => {
  return (
    <li>
      <Link
        to="/pens/new"
        className="group"
        css={[
          tw`flex h-full items-center justify-center rounded-md p-4 border-2 border-dashed text-sm font-medium transition focus:outline-none`,
          tw`text-gray-500 border-gray-300 hocus:bg-gray-200`,
          tw`dark:(text-gray-400 border-gray-700 hocus:bg-gray-800)`,
        ]}
      >
        Create a new pen
      </Link>
    </li>
  );
};

const DashboardPage = () => {
  const { status, data: pens } = usePens();
  return (
    <>
      <Helmet title="Dashboard" />
      <Navbar end={<ColorModeSwitch />} />
      <main tw="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-12">
        <section>
          <PenListHeading>Your pens</PenListHeading>
          <PenList>
            <CreatePenPlaceholder />
            {status === "success" && pens.map((pen) => <PenListItem key={pen.slug} pen={pen} />)}
          </PenList>
        </section>
      </main>
    </>
  );
};

export default DashboardPage;
