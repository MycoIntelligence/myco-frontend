import React from "react";
import "./App.css";
import { ThemeProvider } from "./context/ThemeContext";
import { LeadModalProvider } from "./context/LeadModalContext";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Stats from "./components/Stats";
import DiffSection from "./components/DiffSection";
import ContextEngine from "./components/ContextEngine";
import ProofSection from "./components/ProofSection";
import FindingsFeed from "./components/FindingsFeed";
import HowItWorks from "./components/HowItWorks";
import Integration from "./components/Integration";
import Security from "./components/Security";
import Footer from "./components/Footer";

function App() {
  return (
    <ThemeProvider>
      <LeadModalProvider>
        <div className="App">
          <Navbar />
          <Hero />
          <Stats />
          <ContextEngine />
          <DiffSection />
          <ProofSection />
          <FindingsFeed />
          <HowItWorks />
          <Integration />
          <Security />
          <Footer />
        </div>
      </LeadModalProvider>
    </ThemeProvider>
  );
}

export default App;
