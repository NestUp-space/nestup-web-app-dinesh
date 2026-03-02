import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { PresetSelect } from './pages/PresetSelect';
import { WallSelect } from './pages/WallSelect';
import { Instructions } from './pages/Instructions';
import { Capture } from './pages/Capture';
import { Processing } from './pages/Processing';
import { Results } from './pages/Results';
import { WallDetails } from './pages/WallDetails';
import { Design } from './pages/Design';
import { History } from './pages/History';
import { Error } from './pages/Error';

function App() {
  return (
    <BrowserRouter basename="/measurements">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/preset" element={<PresetSelect />} />
        <Route path="/wall-select" element={<WallSelect />} />
        <Route path="/instructions" element={<Instructions />} />
        <Route path="/capture" element={<Capture />} />
        <Route path="/processing" element={<Processing />} />
        <Route path="/results" element={<Results />} />
        <Route path="/wall-details" element={<WallDetails />} />
        <Route path="/design" element={<Design />} />
        <Route path="/history" element={<History />} />
        <Route path="/error" element={<Error />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
