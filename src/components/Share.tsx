import React, { useEffect, useState } from 'react';
import axios from 'axios';


type Share = {
    symbol: string;
    volume: number;
}

type Stock = {
    date: string;
    close: number;
    volume: number;
  };

type params = {
  setSearchTermFinal: React.Dispatch<React.SetStateAction<string>>;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<string>>;
  getSharePrice: (value: number) => void;
  share: Share
  reloadPage: () => Promise<void>;
};

const Share: React.FC<params> = ({ setSearchTermFinal,setSearchTerm,setCurrentPage,getSharePrice,share, reloadPage }) => {
    const [buySellShares, setBuySellShares] = useState<number>(0);
    const [stockPrice, setStockPrice] = useState<number>([]);

    const handleBuy = async (share: string) => {
        try{
            setBuySellShares(0)
            const response = await axios.patch("https://localhost:8081/portfolio/buy/" + share + "/" + buySellShares);
        }catch (err){
            console.log(err)
        }
        reloadPage()
    };

    const handleSell = async (share: string) => {
        try{
            setBuySellShares(0)
            const response = await axios.patch("https://localhost:8081/portfolio/sell/" + share + "/" + buySellShares); 
        }catch (err){
            console.log(err)
        }
        reloadPage()
    };

    useEffect(() => {

        const fetchData = async () => {
            try {
                const live = new Date().toISOString()
                const response = await axios.get("https://localhost:8081/stocks/" + share.symbol + "/" + live);
        
                setStockPrice(response.data.value)
                getSharePrice(share.volume * response.data.value)
    
            } catch (err) {
                  //setError('Failed to fetch data');
            }
        };

        fetchData();
      }, [share]);

      return(
<div>
    <button 
        onClick={() => {
            setSearchTermFinal(share.symbol);
            setSearchTerm(share.symbol);
            setCurrentPage("market");
        }}
        className="text-blue-500 hover:underline">

        <strong>{share.symbol}</strong>
    </button>
    : {share.volume} shares

    <input
        type="number"
        value={buySellShares}
        onChange={(e) => setBuySellShares(parseInt(e.target.value) > 0 ? parseInt(e.target.value) : 0)}
        placeholder="Enter a number"
        className="border p-2 rounded-md"
    />

    <button className="text-blue-500 hover:underline" onClick={() => handleBuy(share.symbol)}>
        buy
    </button>

    <button className="text-blue-500 hover:underline" onClick={() => handleSell(share.symbol)}>
        sell
    </button>

    price:{(share.volume * stockPrice).toFixed(2)}$

</div>
      );
}

export default Share;