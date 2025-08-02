import { Alert, AlertIcon, Container, Spinner, Text, useToast, Box, Heading, Badge, Flex, IconButton, Tooltip, Button, Select, HStack } from "@chakra-ui/react";
import React, { useState, useEffect, useMemo } from 'react';
import apiService, { Stock} from '../../clients/ApiService';
import { useNavigate } from "react-router-dom";
import { IconArrowUp, IconArrowDown, IconMinus, IconExternalLink, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

const Market: React.FC = () => {
    const toast = useToast();
      
    const [loading, setLoading] = useState(true);
    const [stocks, setStocks] = useState<Stock[]>([])
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        const fetchData = async () => {
          setLoading(true);
          setError('');

          try {
            const stocksData = await apiService.getStocks();
            setStocks(stocksData)
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
          return "green.500"
        case 'down':
          return "red.500";
        default:
          return 'gray.500';
      }
    };

    const getStockBgColor = (sentiment: string) => {
      switch (sentiment) {
        case 'up':
          return "green.50"
        case 'down':
          return "red.50";
        default:
          return 'gray.50';
      }
    };

    const getStockIcon = (sentiment: string) => {
      switch (sentiment) {
        case 'up':
          return <IconArrowUp size={16} color="#22c55e" />;
        case 'down':
          return <IconArrowDown size={16} color="#ef4444" />;
        default:
          return <IconMinus size={16} color="#6b7280" />;
      }
    };

    const formatMarketCap = (marketCap: string) => {
      const num = parseFloat(marketCap.replace(/[$,]/g, ''));
      if (num >= 1e12) return `$${(num / 1e12).toFixed(1)}T`;
      if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
      if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
      return marketCap;
    };

    const formatValue = (value: string) => {
      return value?.toLowerCase() === "unch" ? "0.00" : value;
    };

    // Pagination calculations
    const totalPages = Math.ceil(stocks.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentStocks = useMemo(() => stocks.slice(startIndex, endIndex), [stocks, startIndex, endIndex]);

    const handlePageChange = (page: number) => {
      setCurrentPage(page);
    };

    const handlePageSizeChange = (newPageSize: number) => {
      setPageSize(newPageSize);
      setCurrentPage(1); // Reset to first page when changing page size
    };

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      return pages;
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
        <Container maxW="container.xl" py={8}>
          <Box mb={6}>
            <Heading size="lg" mb={2} color="gray.700">Market Overview</Heading>
            <Text color="gray.600" fontSize="md">
              Real-time stock data and market performance
            </Text>
          </Box>

          <Box 
            bg="white" 
            borderRadius="xl" 
            boxShadow="lg" 
            overflow="hidden"
            border="1px solid"
            borderColor="gray.200"
          >
            {/* Table Header */}
            <Box 
              bg="gray.50" 
              px={6} 
              py={4} 
              borderBottom="1px solid" 
              borderColor="gray.200"
            >
                             <Flex justify="space-between" align="center">
                 <Heading size="md" color="gray.700">Stock Market Data</Heading>
                 <Flex align="center" gap={4}>
                   <Text fontSize="sm" color="gray.600">
                     Showing {startIndex + 1}-{Math.min(endIndex, stocks.length)} of {stocks.length} stocks
                   </Text>
                   <Badge colorScheme="green" variant="subtle">
                     {stocks.length} Total
                   </Badge>
                 </Flex>
               </Flex>
            </Box>

            {/* Table */}
            <Box overflowX="auto">
              <Box as="table" w="full">
                <Box as="thead">
                  <Box as="tr" bg="gray.50">
                    <Box as="th" px={6} py={4} textAlign="left" fontWeight="bold" color="gray.700" borderBottom="1px solid" borderColor="gray.200">
                      Symbol
                    </Box>
                    <Box as="th" px={6} py={4} textAlign="left" fontWeight="bold" color="gray.700" borderBottom="1px solid" borderColor="gray.200">
                      Company
                    </Box>
                    <Box as="th" px={6} py={4} textAlign="right" fontWeight="bold" color="gray.700" borderBottom="1px solid" borderColor="gray.200">
                      Market Cap
                    </Box>
                    <Box as="th" px={6} py={4} textAlign="right" fontWeight="bold" color="gray.700" borderBottom="1px solid" borderColor="gray.200">
                      Price
                    </Box>
                    <Box as="th" px={6} py={4} textAlign="right" fontWeight="bold" color="gray.700" borderBottom="1px solid" borderColor="gray.200">
                      Change
                    </Box>
                    <Box as="th" px={6} py={4} textAlign="right" fontWeight="bold" color="gray.700" borderBottom="1px solid" borderColor="gray.200">
                      % Change
                    </Box>
                    <Box as="th" px={6} py={4} textAlign="center" fontWeight="bold" color="gray.700" borderBottom="1px solid" borderColor="gray.200">
                      Status
                    </Box>
                    <Box as="th" px={6} py={4} textAlign="center" fontWeight="bold" color="gray.700" borderBottom="1px solid" borderColor="gray.200">
                      Action
                    </Box>
                  </Box>
                </Box>
                
                                 <Box as="tbody">
                   {currentStocks.map((stock, index) => (
                    <Box 
                      as="tr" 
                      key={index}
                      bg={index % 2 === 0 ? "white" : "gray.50"}
                      _hover={{ bg: getStockBgColor(stock.deltaIndicator) }}
                      transition="all 0.2s"
                    >
                      <Box as="td" px={6} py={4} borderBottom="1px solid" borderColor="gray.100">
                        <Flex align="center" gap={2}>
                          <Box 
                            bg={getStockColor(stock.deltaIndicator)} 
                            color="white" 
                            px={3} 
                            py={1} 
                            borderRadius="full" 
                            fontWeight="bold"
                            fontSize="sm"
                          >
                            {stock.symbol}
                          </Box>
                        </Flex>
                      </Box>
                      
                      <Box as="td" px={6} py={4} borderBottom="1px solid" borderColor="gray.100">
                        <Text fontWeight="medium" color="gray.800" noOfLines={2}>
                          {stock.companyName}
                        </Text>
                      </Box>
                      
                      <Box as="td" px={6} py={4} textAlign="right" borderBottom="1px solid" borderColor="gray.100">
                        <Text fontWeight="medium" color="gray.700">
                          {formatMarketCap(stock.marketCap)}
                        </Text>
                      </Box>
                      
                      <Box as="td" px={6} py={4} textAlign="right" borderBottom="1px solid" borderColor="gray.100">
                        <Text fontWeight="bold" fontSize="lg" color="gray.800">
                          {stock.lastSalePrice}
                        </Text>
                      </Box>
                      
                      <Box as="td" px={6} py={4} textAlign="right" borderBottom="1px solid" borderColor="gray.100">
                        <Flex align="center" justify="flex-end" gap={1}>
                          {getStockIcon(stock.deltaIndicator)}
                                                     <Text 
                             fontWeight="bold" 
                             color={getStockColor(stock.deltaIndicator)}
                           >
                             {formatValue(stock.netChange)}
                           </Text>
                        </Flex>
                      </Box>
                      
                      <Box as="td" px={6} py={4} textAlign="right" borderBottom="1px solid" borderColor="gray.100">
                                                 <Badge 
                           colorScheme={stock.deltaIndicator === 'up' ? 'green' : stock.deltaIndicator === 'down' ? 'red' : 'gray'}
                           variant="subtle"
                           fontSize="sm"
                           fontWeight="bold"
                         >
                           {formatValue(stock.percentageChange)}
                         </Badge>
                      </Box>
                      
                      <Box as="td" px={6} py={4} textAlign="center" borderBottom="1px solid" borderColor="gray.100">
                        <Flex align="center" justify="center" gap={1}>
                          {getStockIcon(stock.deltaIndicator)}
                          <Text 
                            fontSize="sm" 
                            fontWeight="medium" 
                            color={getStockColor(stock.deltaIndicator)}
                            textTransform="capitalize"
                          >
                            {stock.deltaIndicator}
                          </Text>
                        </Flex>
                      </Box>
                      
                      <Box as="td" px={6} py={4} textAlign="center" borderBottom="1px solid" borderColor="gray.100">
                        <Tooltip label={`View details for ${stock.symbol}`} placement="top">
                          <IconButton
                            aria-label={`View ${stock.symbol} details`}
                            icon={<IconExternalLink size={16} />}
                            size="sm"
                            colorScheme="blue"
                            variant="ghost"
                            onClick={() => navigate(`/stock/${stock.symbol}`)}
                            _hover={{ bg: "blue.100" }}
                          />
                        </Tooltip>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
                         </Box>

             {/* Pagination Controls */}
             <Box 
               px={6} 
               py={4} 
               bg="gray.50" 
               borderTop="1px solid" 
               borderColor="gray.200"
             >
               <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                 {/* Page Size Selector */}
                 <Flex align="center" gap={2}>
                   <Text fontSize="sm" color="gray.600">Show:</Text>
                   <Select 
                     size="sm" 
                     width="80px" 
                     value={pageSize} 
                     onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                     bg="white"
                   >
                     <option value={5}>5</option>
                     <option value={10}>10</option>
                     <option value={25}>25</option>
                     <option value={50}>50</option>
                     <option value={100}>100</option>
                   </Select>
                   <Text fontSize="sm" color="gray.600">per page</Text>
                 </Flex>

                 {/* Pagination Navigation */}
                 <HStack spacing={1}>
                   {/* Previous Button */}
                   <IconButton
                     aria-label="Previous page"
                     icon={<IconChevronLeft size={16} />}
                     size="sm"
                     variant="outline"
                     isDisabled={currentPage === 1}
                     onClick={() => handlePageChange(currentPage - 1)}
                   />

                   {/* Page Numbers */}
                   {getPageNumbers().map((page) => (
                     <Button
                       key={page}
                       size="sm"
                       variant={currentPage === page ? "solid" : "outline"}
                       colorScheme={currentPage === page ? "blue" : "gray"}
                       onClick={() => handlePageChange(page)}
                       minW="40px"
                     >
                       {page}
                     </Button>
                   ))}

                   {/* Next Button */}
                   <IconButton
                     aria-label="Next page"
                     icon={<IconChevronRight size={16} />}
                     size="sm"
                     variant="outline"
                     isDisabled={currentPage === totalPages}
                     onClick={() => handlePageChange(currentPage + 1)}
                   />
                 </HStack>

                 {/* Page Info */}
                 <Text fontSize="sm" color="gray.600">
                   Page {currentPage} of {totalPages}
                 </Text>
               </Flex>
             </Box>
           </Box>
         </Container>
     );
};

export default Market;
