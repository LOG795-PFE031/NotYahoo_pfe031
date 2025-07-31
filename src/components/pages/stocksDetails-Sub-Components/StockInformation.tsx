import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box,
    Flex,
    Container,
    Heading,
    Text,
    Spinner,
    useToast,
    AlertIcon,
    Alert,
    Badge,
} from '@chakra-ui/react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import apiService, { SentimentAnalysis } from '../../../clients/ApiService';
// import apiService from '../../../clients/ApiService';

type StockInformationProps = {
    ticker: string | undefined;
    stockName: string;
};
const StockInformation: React.FC<StockInformationProps> = ({ ticker, stockName }) => {

    const toast = useToast();
    const [sentimentData, setSentimentData] = useState<SentimentAnalysis[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!ticker) return;
            console.log(ticker)
            setLoading(true);
            setError('');

            try {
                const sentimentAnalysis = await apiService.getSentimentAnalysis(ticker);
                setSentimentData(sentimentAnalysis);

                setLoading(false);
            } catch (err) {
                console.error('Error fetching stock data:', err);
                setError('Failed to load stock data. Please try again later.');
                setLoading(false);

                toast({
                    title: 'Error',
                    description: 'Failed to load stock data.',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
            }
        };

        fetchData();
    }, []);

    const calculateSentimentAverages = () => {
        if (sentimentData.length === 0) return { positive: 0, neutral: 0, negative: 0 };

        const totals = sentimentData.reduce(
            (acc, item) => {
                acc.positive += item.sentiment_scores.positive;
                acc.neutral += item.sentiment_scores.neutral;
                acc.negative += item.sentiment_scores.negative;
                return acc;
            },
            { positive: 0, neutral: 0, negative: 0 }
        );

        const count = sentimentData.length;
        return {
            positive: totals.positive / count,
            neutral: totals.neutral / count,
            negative: totals.negative / count,
        };
    };

    const sentimentAverages = calculateSentimentAverages();
    const dominantSentiment = Object.entries(sentimentAverages).reduce(
        (max, [key, value]) => (value > max.value ? { key, value } : max),
        { key: 'neutral', value: 0 }
    ).key;

    if (loading) {
        return (
            <Container centerContent py={10}>
                <Spinner size="xl" color="brand.500" />
                <Text mt={4}>Loading stock data...</Text>
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
        <Flex justify="space-between" align="center" mb={4}>
            <Box>
                <Heading as="h1" size="xl">
                    {ticker}
                </Heading>
                <Text fontSize="lg" color="gray.600">
                    {stockName || 'Stock Details'}
                </Text>
            </Box>

            <Box>
                <Badge
                    colorScheme={dominantSentiment === 'positive' ? 'green' : dominantSentiment === 'negative' ? 'red' : 'gray'}
                    fontSize="md"
                    p={2}
                    borderRadius="md"
                >
                    {dominantSentiment.charAt(0).toUpperCase() + dominantSentiment.slice(1)} Sentiment
                </Badge>
            </Box>
        </Flex>
    )
}

export default StockInformation;