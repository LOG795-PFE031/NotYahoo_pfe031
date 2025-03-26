import React, { FormEvent, useEffect, useState } from 'react';
import axios from 'axios';
import Share from './Share';


type Share = {
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
    const [shares, setShares] = useState<Share[]>([]);
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

              const table: Record<string, number> = {};
              shares.forEach((share) => {
                  table[share.symbol] = 0;
              })
              setBuySellShares(table)
          
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

  <ul className="list-disc pl-5">
    {shares.map((share, index) => (
      <li key={index} className="mb-1">
        <Share setSearchTermFinal={setSearchTermFinal} setSearchTerm={setSearchTerm} setCurrentPage={setCurrentPage} getSharePrice={countTotal} share={share} reloadPage={fetchData}></Share>
      </li>
    ))}
  </ul>
  total: {totalShares.toFixed(2)}$
</div>
      );
}

export default Portfolio;