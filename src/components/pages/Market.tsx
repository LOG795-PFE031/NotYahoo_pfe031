import { Alert, AlertIcon, Container, Spinner, Text, useToast } from "@chakra-ui/react";
import React, { useState, useEffect } from 'react';
import apiService, { Stock} from '../../clients/ApiService';
import { useNavigate } from "react-router-dom";



const Market: React.FC = () => {



    const toast = useToast();
      
    const [loading, setLoading] = useState(true);
    const [stocks, setStocks] = useState<Stock[]>([])
    const [error, setError] = useState('');
    const [tableHeader, setTableHeader] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
          setLoading(true);
          setError('');

          try {
            
            const stocksData = await apiService.getStocks();
            setStocks(stocksData)

            setTableHeader(Object.keys(stocksData[0] || {}))

            setLoading(false);
            
          } catch (err) {
            console.error('Error fetching stocks:', err);
            setError('Failed to load stocks. Please try again later.');
            setLoading(false);
            
            toast({
              title: 'Error',
              description: 'Failed to load stocks.',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          }
        };
        
        fetchData();
    }, []);

    const navigate = useNavigate();

    const getStockColor = (sentiment: string) => {
    switch (sentiment) {
      case 'up':
        return "rgb(80, 245, 30)"
      case 'down':
        return "rgb(255, 10, 30)";
      default:
        return 'gray';
    }
  };

    if (loading) {
        return (
          <Container centerContent py={10}>
            <Spinner size="xl" color="brand.500" />
            <Text mt={4}>Loading stocks...</Text>
          </Container>
        );
    }

    if (error) {
        return (
          <Container maxW="container.xl" py={8}>
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          </Container>
        );
    }


    return (
        <Container>
          <table>
              <thead>
                                 <tr>
                   {tableHeader.map((value, index) => (
                       <th key={index} style={{backgroundColor:'grey'}}>{value}</th>
                   ))}
                 </tr>
              </thead>
              <tbody>
                {stocks.map((stock, index) => (
                  <tr key={index} style={{backgroundColor: getStockColor(stock.deltaIndicator)}}>
                      <td > <button onClick={() => navigate(`/stock/${stock.symbol}`)} >{stock.symbol}</button></td>
                      {/* <td >{stock.sector}</td> */}
                      <td >N/A</td> 
                      <td >{stock.companyName}</td>
                      <td >{stock.marketCap}</td>
                      <td>{stock.lastSalePrice}</td>
                      <td>{stock.netChange}</td>
                      <td>{stock.percentageChange}</td>
                      <td>{stock.deltaIndicator}</td>
                  </tr>
                ))}
              </tbody>
          </table>
        </Container>
    )

}


export default Market;
