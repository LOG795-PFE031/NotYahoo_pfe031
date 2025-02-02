import React, { useEffect, useState } from 'react';
import StockHistoryChart from '../models/StockHistoryChart'; // from above

type StockDataPoint = {
  date: string;
  close: number;
  volume: number;
};

const Stock: React.FC = () => {
  const [stockData, setStockData] = useState<StockDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Example: fetch data from an API or mocked JSON
    // For demonstration, let's just simulate with a setTimeout
    const fetchData = async () => {
      try {
        // Mock data
        const simulatedData: StockDataPoint[] = [
          { date: '2023-01-01', close: 110, volume: 10000 },
          { date: '2023-01-02', close: 113, volume: 15000 },
          { date: '2023-01-03', close: 115, volume: 9000 },
          // Add as many daily points as you like
        ];

        // Simulate API call
        //await new Promise((resolve) => setTimeout(resolve, 1000));
        setStockData(simulatedData);
      } catch (err) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading stock data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Stock View</h1>
      <StockHistoryChart data={stockData} />
    </div>
  );
};

export default Stock;