import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@chakra-ui/react';

// Import pages
import Dashboard from './pages/Dashboard.tsx';
import StockDetails from './pages/StockDetails.tsx';
import Portfolio from './pages/Portfolio.tsx';
import Advisor from './pages/Advisor.tsx';
import PortfolioPerformance from './pages/PortfolioPerformance.tsx';
import News from './News.tsx';

// Import layout components
import Header from './layout/Header.tsx';
import Footer from './layout/Footer.tsx';

const App: React.FC = () => {
  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Header />
      
      <Box as="main" flex="1" p={4}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stock/:ticker" element={<StockDetails />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/performance" element={<PortfolioPerformance />} />
          <Route path="/advisor" element={<Advisor />} />
          <Route path="/news" element={<News searchTerm="" isLoggedIn={false} />} />
        </Routes>
      </Box>
      
      <Footer />
    </Box>
  );
};

export default App;
