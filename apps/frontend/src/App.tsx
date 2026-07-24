import { Routes, Route } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ParticleBackground } from '@/components/3d/ParticleBackground';
import { Analyze } from '@/pages/Analyze';
import { Calculator } from '@/pages/Calculator';
import { Monitor } from '@/pages/Monitor';
import { History } from '@/pages/History';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <ParticleBackground />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Analyze />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
