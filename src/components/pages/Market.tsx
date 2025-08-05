import { Alert, AlertIcon, ButtonGroup, Container, Heading, IconButton, Spinner, Stack, Table, Text, useToast, Pagination } from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu"
import React, { useState, useEffect, useMemo } from 'react';
import apiService, { Stock } from '../../clients/ApiService';
import { useNavigate } from "react-router-dom";



const Market: React.FC = () => {



  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stocks, setStocks] = useState<Stock[]>([])
  const [error, setError] = useState('');
  const [tableHeader, setTableHeader] = useState([]);

  useEffect(() => {

    const cachedData = localStorage.getItem('nasdaqStocks');
    if (cachedData) {
      setStocks(JSON.parse(cachedData));
      const headers = Object.keys(JSON.parse(cachedData)[0]);
      const formatedHeader = headers.map((head) => {
        return head.replace(/(?<!^)([A-Z])/g, ' $1');
      })
      setTableHeader(formatedHeader);
      setLoading(false);
    }
    else {
      const fetchData = async () => {
        setLoading(true);
        console.log(localStorage)
        setError('');

        try {

          const stocksData = await apiService.getStocks();
          setStocks(stocksData.data)

          const headers = Object.keys(JSON.parse(cachedData)[0]);
          const formatedHeader = headers.map((head) => {
            return head.replace(/(?<!^)([A-Z])/g, ' $1');
          })
          setTableHeader(formatedHeader)
          localStorage.setItem('nasdaqStocks', JSON.stringify(stocksData.data));

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
      }

      fetchData();
    };

  }, []);

  const navigate = useNavigate();

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

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  };

  const thStyle = {
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '12px',
    textAlign: 'left',
    fontWeight: 'bold'
  };

  const tdStyle = {
    padding: '12px',
    borderBottom: '1px solid #ecf0f1',
    fontSize: '14px'
  };

  const getStockColor = (deltaIndicator) => {
    return deltaIndicator === 'up' ? '#f1f8e8ff' : '#fdecea';
  };

  const getTextColor = (deltaIndicator) => {
    return deltaIndicator === 'up' ? '#27ae60' : '#c0392b';
  };

  const buttonStyle = {
    backgroundColor: '#2980b9',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    cursor: 'pointer'
  };


  return (
    <Container style={{ justifyContent: "center", alignItems: 'center' }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {tableHeader.map((value, index) => (
              <th style={thStyle} key={index}>{value}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock, index) => (
            <tr
              key={index}
              style={{
                backgroundColor: getStockColor(stock.deltaIndicator),
                color: getTextColor(stock.deltaIndicator)
              }}
            >
              <td style={tdStyle}>
                <button style={buttonStyle} onClick={() => navigate(`/stock/${stock.symbol}`)}>
                  {stock.symbol}
                </button>
              </td>
              <td style={tdStyle}>N/A</td>
              <td style={tdStyle}>{stock.companyName}</td>
              <td style={tdStyle}>{stock.marketCap}</td>
              <td style={tdStyle}>{stock.lastSalePrice}</td>
              <td style={tdStyle}>{stock.netChange}</td>
              <td style={tdStyle}>{stock.percentageChange}</td>
              <td style={tdStyle}>{stock.deltaIndicator}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Container>
  );
}


export default Market;