import { Routes, Route } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ParticleBackground } from '@/components/3d/ParticleBackground';
import { Analyze } from '@/pages/Analyze';
import { Portfolio } from '@/pages/Portfolio';
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
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/launchpad" element={<Monitor />} />
          <Route path="/calculator" element={<Portfolio />} />
          <Route path="/admin" element={<History />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
