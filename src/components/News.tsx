import React, { useEffect, useState } from 'react';
import NewsCard from '../models/NewsCard'
import axios from 'axios';

type NewsData = {
  title: string;
  publishedAt: string;
  opinion: number;
};

type params = {
  searchTerm: string;
  isLoggedIn: boolean
};

const News: React.FC<params> = ({ searchTerm,isLoggedIn }) => {
    const [newsData, setNewsData] = useState<NewsData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoggedIn) return
        // Example: fetch data from an API or mocked JSON
        // For demonstration, let's just simulate with a setTimeout
        const fetchData = async () => {
          try {
            const response = await axios.get("https://localhost:8081/news/" + searchTerm);

            setNewsData(response.data.articleViewModels);

          } catch (err) {
            const simulatedData = [
              { title: "Stock Market Rallies Amid Economic Optimism", publishedAt: "2023-08-01 14:25:35", opinion: 1 },
              { title: "Federal Reserve Holds Interest Rates Steady", publishedAt: "2023-08-02 14:25:35", opinion: 0 },
              { title: "Tech Giants Report Mixed Quarterly Earnings", publishedAt: "2023-08-03 14:25:35", opinion: -1 },
              { title: "Oil Prices Surge Following Supply Concerns", publishedAt: "2023-08-04 14:25:35", opinion: 1 },
              { title: "Global Markets Tumble Amid Recession Fears", publishedAt: "2023-08-05 14:25:35", opinion: -1 },
              { title: "Government Announces New Infrastructure Plan", publishedAt: "2023-08-06 14:25:35", opinion: 1 },
              { title: "Cryptocurrency Market Sees Sharp Decline", publishedAt: "2023-08-07 14:25:35", opinion: -1 },
              { title: "Unemployment Rate Falls to Historic Low", publishedAt: "2023-08-08 14:25:35", opinion: 1 },
            ];
            setNewsData(simulatedData);
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

      return (
        <div style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
  {newsData.map((news, index) => (
    <div style={{ flex: '1 0 20%', maxWidth: '20%' }} key={index}>
      <NewsCard data={news} />
    </div>
  ))}
</div>

      );
}

export default News;