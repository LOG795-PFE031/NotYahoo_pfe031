import React from 'react';

type NewsData = {
    Title: string;
    PublishedAt: string;
    Opinion: number;
};

interface NewsCardProps {
    data: NewsData;
}

const NewsCard: React.FC<NewsCardProps> = ({ data }) => {
    const formattedData = {PublishedAt: data.PublishedAt.toString(), Title: data.Title, Opinion: data.Opinion}
    return (
      <div className="bg-white border-2 border-gray-300 rounded-2xl shadow-lg overflow-hidden w-full sm:w-[300px]">
        <div className="p-6">
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">{formattedData.PublishedAt}</p>
          <h3 className="text-lg font-semibold">{formattedData.Title}</h3>
          <p className={formattedData.Opinion > 0 ? "text-green-500 text-lg" : "text-red-500 text-lg"}>
            {formattedData.Opinion > 0 ? "▲" : "▼"}
          </p>
        </div>
      </div>
    );
  };
  
  export default NewsCard;