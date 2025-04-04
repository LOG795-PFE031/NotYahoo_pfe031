import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Text,
  Flex,
  Heading,
  Input,
  Button,
  VStack,
  HStack,
  Avatar,
  IconButton,
  Divider,
  Spinner,
  Tooltip,
  Badge,
  useColorModeValue
} from '@chakra-ui/react';
import { IconSend, IconRobot, IconUser, IconInfoCircle } from '@tabler/icons-react';
import chatbotService from '../../clients/ChatbotService';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const Advisor: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const messageBgUser = useColorModeValue('blue.500', 'blue.400');
  const messageBgAssistant = useColorModeValue('gray.200', 'gray.700');
  
  // Add initial welcome message from the assistant
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: crypto.randomUUID(),
          content: "👋 Hello! I'm your AI Financial Advisor. I can help you with investment advice, portfolio analysis, and answering your financial questions. How can I assist you today?",
          sender: 'assistant',
          timestamp: new Date()
        }
      ]);
    }
  }, [messages.length]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Send message to chatbot service
      const response = await chatbotService.sendMessage(input);
      
      // Add assistant response
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        content: response,
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error communicating with chatbot:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        content: "I'm sorry, I encountered an error processing your request. Please try again later.",
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <Container maxW="container.lg" py={8}>
      <Box bg={bgColor} borderRadius="lg" overflow="hidden" boxShadow="md">
        <Box bg="brand.500" color="white" p={4}>
          <Flex align="center">
            <IconRobot size={24} style={{ marginRight: '8px' }} />
            <Heading size="md">Financial Advisor</Heading>
            <Tooltip label="Powered by AI language model with financial expertise" placement="top">
              <IconButton
                aria-label="Information"
                icon={<IconInfoCircle size={20} />}
                variant="ghost"
                color="white"
                ml={2}
                size="sm"
              />
            </Tooltip>
            <Badge ml="auto" colorScheme="green">Online</Badge>
          </Flex>
        </Box>
        
        <Box height="500px" overflowY="auto" p={4}>
          <VStack spacing={4} align="stretch">
            {messages.map(message => (
              <Flex 
                key={message.id} 
                justify={message.sender === 'user' ? 'flex-end' : 'flex-start'}
              >
                <HStack
                  alignItems="flex-start" 
                  maxW="80%" 
                  bg={message.sender === 'user' ? messageBgUser : messageBgAssistant}
                  color={message.sender === 'user' ? 'white' : 'black'}
                  p={3} 
                  borderRadius="lg"
                >
                  {message.sender === 'assistant' && (
                    <Avatar size="sm" icon={<IconRobot size={20} />} bg="brand.500" />
                  )}
                  
                  <Box>
                    <Text>{message.content}</Text>
                    <Text fontSize="xs" color={message.sender === 'user' ? 'whiteAlpha.700' : 'gray.500'} textAlign="right">
                      {formatTime(message.timestamp)}
                    </Text>
                  </Box>
                  
                  {message.sender === 'user' && (
                    <Avatar size="sm" icon={<IconUser size={20} />} bg="blue.700" />
                  )}
                </HStack>
              </Flex>
            ))}
            <div ref={messagesEndRef} />
          </VStack>
          
          {isLoading && (
            <Flex justify="flex-start" mt={4}>
              <HStack
                alignItems="center" 
                bg={messageBgAssistant}
                p={3} 
                borderRadius="lg"
              >
                <Avatar size="sm" icon={<IconRobot size={20} />} bg="brand.500" />
                <Spinner size="sm" color="brand.500" />
                <Text>Thinking...</Text>
              </HStack>
            </Flex>
          )}
        </Box>
        
        <Divider />
        
        <Box p={4}>
          <form onSubmit={handleSubmit}>
            <Flex>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about investments, stock advice, financial planning..."
                mr={2}
                disabled={isLoading}
                _disabled={{ opacity: 0.7 }}
              />
              <Button
                type="submit"
                colorScheme="blue"
                isDisabled={isLoading || !input.trim()}
                leftIcon={<IconSend size={16} />}
              >
                Send
              </Button>
            </Flex>
          </form>
          
          <Text fontSize="xs" color="gray.500" mt={2}>
            This advisor provides general information and not personalized investment advice.
            Always consult with a qualified financial professional before making investment decisions.
          </Text>
        </Box>
      </Box>
    </Container>
  );
};

export default Advisor; 