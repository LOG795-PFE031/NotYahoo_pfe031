import React, { useEffect, useState } from 'react';
import StockHistoryChart from '../models/StockHistoryChart'; // from above
import axios from 'axios';

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
        const response = await axios.get("http://localhost:8000/predict/next_day");

        console.log(response.data);

        // const formattedData = response.data.map((item: any) => ({
        //   date: item.timestamp, // Make sure the API returns this
        //   price: item.prediction || item.price, // Adjust based on API response
        // }));

        const formattedData = [{date: response.data.timestamp, close: response.data.prediction, volume:0}]

        setStockData(formattedData);
        // Mock data
        
      } catch (err) {
        //setError('Failed to fetch data');
        const simulatedData: StockDataPoint[] = [
          { date: '2025-02-18T18:23:59.469154', close: 190.03883841198058, volume: 9000 },
          { date: '2025-02-18T18:53:59.469154', close: 191.03883841198058, volume: 9000 },
          { date: '2025-02-18T19:23:59.469154', close: 192.03883841198058, volume: 9000 },
          // Add as many daily points as you like
        ];

        // Simulate API call
        //await new Promise((resolve) => setTimeout(resolve, 1000));
        setStockData(simulatedData);
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
      <StockHistoryChart data={stockData} />
    </div>
  );
};

export default Stock;