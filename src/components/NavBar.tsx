import React, { useState, FormEvent } from 'react';
import successLogo from '../Assets/Success.jpg'; // adjust the path
import '../css/NavBar.css';
import { AuthServer } from '../clients/AuthServer';
import axios from 'axios';
import Stock from './Stock';
import News from './News';

const authServer = new AuthServer('https://localhost:8081');

const NavBar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTermFinal, setSearchTermFinal] = useState('');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [accountUsername, setAccountUsername] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [loginError, setLoginError] = useState('');


  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearchTermFinal(searchTerm)
    console.log('Searching for:', searchTerm);
    // Your search logic here
  };

  const toggleAccountModal = () => {
    setShowAccountModal(!showAccountModal);
  };

  const handleAccountLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const loginResponse = await authServer.login(accountUsername, accountPassword);
      console.log('Login successful, token:', loginResponse);
      // Optionally: Save token (e.g., localStorage) and close modal on success
      axios.defaults.headers.common['Authorization'] = `Bearer ${loginResponse}`;
      axios.defaults.headers.post['Content-Type'] = 'application/json';
      setShowAccountModal(false);
      setIsLoggedIn(true);
      setSearchTerm("AAPL")
      setSearchTermFinal("AAPL")
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginError(error.message || 'Login failed');
    }
  };

  return (
    <>
      <nav className="navbar">
        {/* Left Section: Logo */}
        <div className="navbar__left">
          <img src={successLogo} alt="Success Logo" className="navbar__logo" />
        </div>

        {/* Center Section: Search Bar */}
        <div className="navbar__center">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="search-input"
            />
            <button type="submit" className="search-button">
              Search
            </button>
          </form>
        </div>

        {/* Right Section: Navigation Links */}
        <div className="navbar__right">
          <a href="#home" className="nav-link">
            Home
          </a>
          <button
            type="button"
            onClick={toggleAccountModal}
            className="nav-link button-link"
          >
            Account
          </button>
        </div>
      </nav>
      <Stock searchTerm={searchTermFinal} isLoggedIn={isLoggedIn}>

      </Stock>
      <News searchTerm={searchTermFinal} isLoggedIn={isLoggedIn}>

      </News>

      {/* Account Modal */}
      {showAccountModal && (
        <div className="modal-overlay" onClick={toggleAccountModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()} // Prevent modal close when clicking inside
          >
            <button className="modal-close" onClick={toggleAccountModal}>
              &times;
            </button>
            <h2>Account Login</h2>
            {loginError && <p className="error">{loginError}</p>}
            <form onSubmit={handleAccountLogin}>
              <div className="form-row">
                <label htmlFor="account-username">Username:</label>
                <input
                  id="account-username"
                  type="text"
                  value={accountUsername}
                  onChange={(e) => setAccountUsername(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="account-password">Password:</label>
                <input
                  id="account-password"
                  type="password"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                />
              </div>
              <button type="submit">Login</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default NavBar;