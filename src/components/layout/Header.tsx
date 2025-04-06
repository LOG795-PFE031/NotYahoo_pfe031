import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Flex,
  Stack,
  Button,
  Input,
  Link as ChakraLink,
  IconButton,
  Popover,
  PopoverTrigger,
  Portal,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  Heading,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react';
import { IconSearch, IconChevronDown } from '@tabler/icons-react';
import Login from '../pages/Login';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  function loginButton() {

    if(isLoggedIn == false){
      return(
        <Popover>
          <PopoverTrigger>
            <Button 
              size="sm" 
              colorScheme="brand"
            >
              Login
            </Button>
          </PopoverTrigger>
          <Portal>
              <PopoverContent>
                <PopoverArrow />
                <PopoverBody shadow="md">
                  <Login setIsLoggedIn={setIsLoggedIn}/>
                </PopoverBody>
              </PopoverContent>
          </Portal>
        </Popover>
      )
    }else{
      return(
        <h5>Bonjour!</h5>
      )
    }
    
  }

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
            
            <Menu>
              <MenuButton as={ChakraLink} fontWeight="medium">
                Portfolio <IconChevronDown size={14} style={{ display: 'inline' }} />
              </MenuButton>
              <MenuList>
                <MenuItem as={RouterLink} to="/portfolio">
                  Overview
                </MenuItem>
                <MenuItem as={RouterLink} to="/portfolio/performance">
                  Performance Analytics
                </MenuItem>
              </MenuList>
            </Menu>
            
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
            {loginButton()}
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Header; 