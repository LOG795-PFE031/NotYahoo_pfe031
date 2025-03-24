import React, { useEffect, useState } from 'react';
import StockHistoryChart from '../models/StockHistoryChart'; // from above
import axios from 'axios';

type StockDataPoint = {
  date: string;
  close: number;
  volume: number;
};

type params = {
  searchTerm: string;
  isLoggedIn: boolean
};

const Stock: React.FC<params> = ({ searchTerm,isLoggedIn }) => {
  const [stockData, setStockData] = useState<StockDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return
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
          { date: '2025-02-18T18:23:59.469154', close: 190.289143, volume: 9000 },
          { date: '2025-02-18T18:53:59.469154', close: 189.311999, volume: 9000 },
          { date: '2025-02-18T19:23:59.469154', close: 188.427231, volume: 9000 },
          { date: '2025-02-18T19:53:59.469154', close: 188.167850, volume: 9000 },
          { date: '2025-02-18T20:23:59.469154', close: 188.074236, volume: 9000 },
          { date: '2025-02-18T20:53:59.469154', close: 191.080997, volume: 9000 },
          { date: '2025-02-18T21:23:59.469154', close: 189.575534, volume: 9000 },
          { date: '2025-02-18T21:53:59.469154', close: 190.376600, volume: 9000 },
          { date: '2025-02-18T22:23:59.469154', close: 188.879733, volume: 9000 },
          { date: '2025-02-18T22:53:59.469154', close: 188.437963, volume: 9000 },
        ];

        // Simulate API call
        //await new Promise((resolve) => setTimeout(resolve, 1000));
        setStockData(simulatedData);
        //setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchTerm,isLoggedIn]);

  if (!isLoggedIn) return <div>Please log in to see the stocks.</div>;
  if (loading) return <div>Loading stock data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <StockHistoryChart data={stockData} />
    </div>
  );
};

export default Stock;