import React, { useEffect, useState } from 'react';
import axios from 'axios';

type Share = {
    symbol: string;
    volume: number;
};

type params = {
    setSearchTermFinal: React.Dispatch<React.SetStateAction<string>>;
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    setCurrentPage: React.Dispatch<React.SetStateAction<string>>;
    getSharePrice: (value: number) => void;
    share: Share;
    reloadPage: () => Promise<void>;
};

const Share: React.FC<params> = ({ setSearchTermFinal, setSearchTerm, setCurrentPage, getSharePrice, share, reloadPage }) => {
    const [buySellShares, setBuySellShares] = useState<number>(0);
    const [stockPrice, setStockPrice] = useState<number>(0);

    const handleBuy = async () => {
        try {
            await axios.patch(`https://localhost:8081/portfolio/buy/${share.symbol}/${buySellShares}`);
            setBuySellShares(0);
            reloadPage();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSell = async () => {
        try {
            await axios.patch(`https://localhost:8081/portfolio/sell/${share.symbol}/${buySellShares}`);
            setBuySellShares(0);
            reloadPage();
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const live = new Date().toISOString();
                const response = await axios.get(`https://localhost:8081/stocks/${share.symbol}/${live}`);
                setStockPrice(response.data.value);
                getSharePrice(share.volume * response.data.value);
            } catch (err) {
                console.error('Failed to fetch stock data', err);
            }
        };
        fetchData();
    }, [share]);

    return (
        <tr className="border-b">
            <td className="px-4 py-2 text-blue-600 font-bold hover:underline cursor-pointer" 
                onClick={() => {
                    setSearchTermFinal(share.symbol);
                    setSearchTerm(share.symbol);
                    setCurrentPage("market");
                }}>
                {share.symbol}
            </td>
            <td className="px-4 py-2">{share.volume}</td>
            <td className="px-4 py-2">{(share.volume * stockPrice).toFixed(2)}$</td>
            <td className="px-4 py-2">
                <input
                    type="number"
                    value={buySellShares}
                    onChange={(e) => setBuySellShares(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="Enter shares"
                    className="border p-2 rounded-md w-20 text-center"
                />
            </td>
            <td className="px-4 py-2">
                <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 mr-2" onClick={handleBuy}>
                    Buy
                </button>
                <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600" onClick={handleSell}>
                    Sell
                </button>
            </td>
        </tr>
    );
};

export default Share;

