import React, { FormEvent, useEffect, useState } from 'react';
import axios from 'axios';
import Share from '../models/Share';


type ShareData = {
    symbol: string;
    volume: number;
}

type params = {
  setSearchTermFinal: React.Dispatch<React.SetStateAction<string>>;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<string>>;
  searchTerm: string;
  isLoggedIn: boolean

};

const Portfolio: React.FC<params> = ({ setSearchTermFinal,setSearchTerm,setCurrentPage,searchTerm,isLoggedIn }) => {
    const [shares, setShares] = useState<ShareData[]>([]);
    const [totalShares, setTotalShares]  = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
          const response = await axios.get("https://localhost:8081/portfolio");
          setShares(response.data.shareVolumes);
          setTotalShares(0)

        } catch (err) {
              const simulatedData = [
                  { symbol: "TSLA", volume: 384 },
                  { symbol: "AAPL", volume: 92 },
                  { symbol: "GOOGL", volume: 419 },
                  { symbol: "META", volume: 237 },
                  { symbol: "MSFT", volume: 12 }
              ];
              setShares(simulatedData);
          
              //setError('Failed to fetch data');
        } finally {
          setLoading(false);
        }
      };

    const countTotal = (value: number) => {
        setTotalShares((prevTotalShares) => prevTotalShares + value);
    }

    useEffect(() => {
        if (!isLoggedIn) return
        
        fetchData();
      }, [searchTerm, isLoggedIn]);

      if (!isLoggedIn) return <div>Please log in to see news updates.</div>;
      if (loading) return <div>Loading stock data...</div>;
      if (error) return <div>Error: {error}</div>;

      return(
<div className="p-4">
  <h2 className="text-xl font-bold mb-2">My Shares</h2>

  <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">
    <thead>
      <tr className="bg-gray-100">
        <th className="px-4 py-2">Symbol</th>
        <th className="px-4 py-2">Shares</th>
        <th className="px-4 py-2">Total Price</th>
        <th className="px-4 py-2">Amount</th>
        <th className="px-4 py-2">Actions</th>
      </tr>
    </thead>
    <tbody>
      {shares.map((share, index) => (
        <Share key={index} setSearchTermFinal={setSearchTermFinal} setSearchTerm={setSearchTerm} setCurrentPage={setCurrentPage} getSharePrice={countTotal} share={share} reloadPage={fetchData} />
      ))}
    </tbody>
  </table>

  <p className="mt-2 text-right font-bold">Total: {totalShares.toFixed(2)}$</p>
</div>

      );
}

export default Portfolio;