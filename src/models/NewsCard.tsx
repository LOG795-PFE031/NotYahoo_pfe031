import React from 'react';

type NewsData = {
    title: string;
    publishedAt: string;
    opinion: number;
};

interface NewsCardProps {
    data: NewsData;
}

const NewsCard: React.FC<NewsCardProps> = ({ data }) => {
    const formattedData = {publishedAt: data.publishedAt.toString(), title: data.title, opinion: data.opinion}
    return (
      <div className="bg-white border-2 border-gray-300 rounded-2xl shadow-lg overflow-hidden w-full sm:w-[300px]">
        <div className="p-6">
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">{formattedData.publishedAt}</p>
          <h3 className="text-lg font-semibold">{formattedData.title}</h3>
          <p className={formattedData.opinion > 0 ? "text-green-500 text-lg" : "text-red-500 text-lg"}>
            {formattedData.opinion > 0 ? "▲" : "▼"}
          </p>
        </div>
      </div>
    );
  };
  
  export default NewsCard;