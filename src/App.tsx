import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Calculators } from './pages/Calculators';
import { Compare } from './pages/Compare';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="calculators" element={<Calculators />} />
          <Route path="compare" element={<Compare />} />
          <Route path="compare/:type/:id" element={<Compare />} />
          {/* Placeholder routes */}
          <Route path="learn" element={<Home />} />
          <Route path="start" element={<Home />} />
          <Route path="prices" element={<Dashboard />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
