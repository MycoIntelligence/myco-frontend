import React from "react";
import "./App.css";
import { ThemeProvider } from "./context/ThemeContext";
import { LeadModalProvider } from "./context/LeadModalContext";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Stats from "./components/Stats";
import DiffSection from "./components/DiffSection";
import ContextEngine from "./components/ContextEngine";
import Playground from "./components/Playground";
import ProofSection from "./components/ProofSection";
import Integration from "./components/Integration";
import Pricing from "./components/Pricing";
import Security from "./components/Security";
import Footer from "./components/Footer";
import ChatWidget from "./components/chat/ChatWidget";

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
          {/* <Playground /> */}
          <Integration />
          {/* <Pricing /> */}
          <Security />
          <Footer />
          <ChatWidget />
        </div>
      </LeadModalProvider>
    </ThemeProvider>
  );
}

export default App;
