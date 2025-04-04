import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Flex,
  Stack,
  Button,
  Input,
  Link as ChakraLink,
  IconButton
} from '@chakra-ui/react';
import { IconSearch } from '@tabler/icons-react';

const Header = () => {
  return (
    <Box as="header" bg="white" boxShadow="sm" position="sticky" top={0} zIndex={10}>
      <Flex 
        maxW="7xl" 
        mx="auto" 
        px={4} 
        py={3} 
        align="center" 
        justify="space-between"
      >
        <Box fontWeight="bold" fontSize="xl">
          <ChakraLink as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
            FinTech Platform
          </ChakraLink>
        </Box>

        <Flex align="center" gap={8}>
          <Stack direction="row" gap={6} display={{ base: 'none', md: 'flex' }}>
            <ChakraLink as={RouterLink} to="/markets" fontWeight="medium">
              Markets
            </ChakraLink>
            <ChakraLink as={RouterLink} to="/portfolio" fontWeight="medium">
              Portfolio
            </ChakraLink>
            <ChakraLink as={RouterLink} to="/advisor" fontWeight="medium">
              AI Advisor
            </ChakraLink>
            <ChakraLink as={RouterLink} to="/news" fontWeight="medium">
              News
            </ChakraLink>
          </Stack>

          <Flex gap={2}>
            <Flex position="relative" display={{ base: 'none', md: 'flex' }}>
              <Input 
                placeholder="Search..." 
                size="sm" 
                width="auto" 
                borderRadius="md"
              />
              <IconButton
                icon={<IconSearch size={18} />}
                size="sm"
                aria-label="Search"
                position="absolute"
                right={1}
                top={1}
                zIndex={2}
                variant="ghost"
              />
            </Flex>

            <Button 
              size="sm" 
              colorScheme="brand"
              as={RouterLink}
              to="/login"
            >
              Login
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Header; 