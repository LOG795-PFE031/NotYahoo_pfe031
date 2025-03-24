import React, { useEffect, useState } from 'react';
import NewsCard from '../models/NewsCard'
import axios from 'axios';

type NewsData = {
  Title: string;
  PublishedAt: string;
  Opinion: number;
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

            setNewsData(response.data.ArticleViewModels);
          } catch (err) {
            const simulatedData = [
              { Title: "Stock Market Rallies Amid Economic Optimism", PublishedAt: "2023-08-01 14:25:35", Opinion: 1 },
              { Title: "Federal Reserve Holds Interest Rates Steady", PublishedAt: "2023-08-02 14:25:35", Opinion: 0 },
              { Title: "Tech Giants Report Mixed Quarterly Earnings", PublishedAt: "2023-08-03 14:25:35", Opinion: -1 },
              { Title: "Oil Prices Surge Following Supply Concerns", PublishedAt: "2023-08-04 14:25:35", Opinion: 1 },
              { Title: "Global Markets Tumble Amid Recession Fears", PublishedAt: "2023-08-05 14:25:35", Opinion: -1 },
              { Title: "Government Announces New Infrastructure Plan", PublishedAt: "2023-08-06 14:25:35", Opinion: 1 },
              { Title: "Cryptocurrency Market Sees Sharp Decline", PublishedAt: "2023-08-07 14:25:35", Opinion: -1 },
              { Title: "Unemployment Rate Falls to Historic Low", PublishedAt: "2023-08-08 14:25:35", Opinion: 1 },
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