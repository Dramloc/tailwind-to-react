/** @jsxImportSource @emotion/react */
import { Link } from "react-router-dom";
import tw, { styled } from "twin.macro";
import { examples } from "../examples/examples";
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

const PenListItem = ({ type, pen }) => {
  return (
    <li>
      <Link
        to={`/${type}/${pen.slug}`}
        className="group"
        css={[
          tw`block rounded-lg p-4 border transition hocus:shadow-lg focus:outline-none`,
          tw`bg-white border-gray-200 hocus:(bg-primary-500 border-transparent)`,
          tw`dark:(bg-gray-800 border-transparent hocus:bg-primary-600)`,
        ]}
      >
        <dl>
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
          <div>
            <dt tw="sr-only">Slug</dt>
            <dd
              css={[
                tw`text-sm font-medium truncate transition`,
                tw`text-gray-500 group-hocus:text-primary-200`,
                tw`dark:(text-gray-400 group-hocus:text-primary-300)`,
              ]}
            >
              {pen.slug}
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
          tw`flex h-full items-center justify-center rounded-lg p-4 border-2 border-dashed text-sm font-medium transition focus:outline-none`,
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
      <Navbar end={<ColorModeSwitch />} />
      <main tw="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-12">
        <section>
          <PenListHeading>Examples</PenListHeading>
          <PenList>
            {examples.map((example) => (
              <PenListItem type="examples" key={example.slug} pen={example} />
            ))}
          </PenList>
        </section>
        {status === "success" && (
          <section>
            <PenListHeading>Your pens</PenListHeading>
            <PenList>
              <CreatePenPlaceholder />
              {pens.map((pen) => (
                <PenListItem type="pens" key={pen.slug} pen={pen} />
              ))}
            </PenList>
          </section>
        )}
      </main>
    </>
  );
};

export default DashboardPage;
