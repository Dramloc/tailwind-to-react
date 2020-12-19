/** @jsxImportSource @emotion/react */
import { Global } from "@emotion/react";
import { lazy, Suspense } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";
import tw, { GlobalStyles } from "twin.macro";
import { ColorModeProvider } from "./shared/ColorModeProvider";

const DashboardPage = lazy(() => import("./dashboard/DashboardPage"));
const CreatePenPage = lazy(() => import("./pens/CreatePenPage"));
const PenPage = lazy(() => import("./pens/PenPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <Helmet titleTemplate="%s - Tailwind to React" />
        <GlobalStyles />
        <Global
          styles={{
            body: tw`antialiased font-sans`,
            "#root": tw`min-h-screen bg-gray-100 text-gray-800 dark:(bg-gray-900 text-white)`,
          }}
        />
        <ColorModeProvider>
          <BrowserRouter>
            <Suspense fallback={null}>
              <Switch>
                <Route path="/" exact component={DashboardPage} />
                <Route path="/pens/new" exact component={CreatePenPage} />
                <Route path="/pens/:penSlug" exact component={PenPage} />
                <Route path="*">
                  <Redirect to="/" />
                </Route>
              </Switch>
            </Suspense>
          </BrowserRouter>
        </ColorModeProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;
