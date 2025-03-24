import React, { useEffect, useState } from 'react';
import axios from 'axios';


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
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoggedIn) return
        // Example: fetch data from an API or mocked JSON
        // For demonstration, let's just simulate with a setTimeout
        const fetchData = async () => {
          try {
            const response = await axios.get("https://localhost:8081/portfolio");

            console.log(response.data);

            setShares(response.data);
            
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
    
        fetchData();
      }, [searchTerm, isLoggedIn]);

      if (!isLoggedIn) return <div>Please log in to see news updates.</div>;
      if (loading) return <div>Loading stock data...</div>;
      if (error) return <div>Error: {error}</div>;

      return(
<div className="p-4">
  <h2 className="text-xl font-bold mb-2">Random Shares</h2>

  <ul className="list-disc pl-5">
    {shares.map((share, index) => (
      <li key={index} className="mb-1">
        <button 
          onClick={() => {setSearchTermFinal(share.symbol);setSearchTerm(share.symbol);setCurrentPage("market")}}
          className="text-blue-500 hover:underline"
        >
          <strong>{share.symbol}</strong>
        </button>
        : {share.volume} shares
      </li>
    ))}
  </ul>
</div>
      );
}

export default Portfolio;