// client/src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Chatbot from './components/Chatbot.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import PhoneDetail from './pages/PhoneDetail.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Branches from './pages/Branches.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/phones" element={<Catalog />} />
          <Route path="/phones/:slug" element={<PhoneDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/branches" element={<Branches />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
}
