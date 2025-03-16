import Layout from "./components/Layout";
import Game from "./pages/Game";
import Landing from "./pages/Landing";
import { BrowserRouter, Routes, Route } from "react-router-dom";
function App() {
  return (
    <>
      <Layout>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/game" element={<Game />} />
          </Routes>
        </BrowserRouter>
      </Layout>
    </>
  );
}

export default App;
