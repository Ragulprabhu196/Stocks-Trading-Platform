import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Container,
  Navbar,
  Button,
  Card,
  ListGroup,
  Form,
  Alert,
  InputGroup,
} from "react-bootstrap";
import { FaWallet, FaSignOutAlt, FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

const demoUsers = [
  { username: "user1", password: "password1", balance: 100000, portfolio: [] },
  { username: "user2", password: "password2", balance: 100000, portfolio: [] },
  { username: "user3", password: "password3", balance: 100000, portfolio: [] },
];

const TradingApp = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [users, setUsers] = useState(demoUsers);
  const [stocks, setStocks] = useState([]);
  const [showCredentials, setShowCredentials] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=inr")
      .then((res) => res.json())
      .then((data) => setStocks(data.slice(0, 10)))
      .catch((err) => console.error("Error fetching stocks:", err));
  }, []);

  const handleLogin = () => {
    const user = users.find(
      (u) => u.username === username.trim() && u.password === password.trim()
    );
    if (user) {
      setIsLoggedIn(true);
      setCurrentUser(user);
    } else {
      alert("Invalid credentials! Try user1/password1, user2/password2, or user3/password3.");
    }
  };

  const handleBuy = (stock) => {
    if (!currentUser || currentUser.balance < stock.current_price) {
      alert("Insufficient balance!");
      return;
    }

    const updatedUsers = users.map((user) =>
      user.username === currentUser.username
        ? {
            ...user,
            balance: user.balance - stock.current_price,
            portfolio: [...user.portfolio, { ...stock, quantity: 1 }],
          }
        : user
    );

    setUsers(updatedUsers);
    setCurrentUser(updatedUsers.find((u) => u.username === currentUser.username));
  };

  const handleSell = (stock) => {
    if (!currentUser) return;

    const updatedUsers = users.map((user) =>
      user.username === currentUser.username
        ? {
            ...user,
            balance: user.balance + stock.current_price,
            portfolio: user.portfolio.filter((s) => s.id !== stock.id),
          }
        : user
    );

    setUsers(updatedUsers);
    setCurrentUser(updatedUsers.find((u) => u.username === currentUser.username));
  };

  if (!isLoggedIn) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Card className="p-4 shadow-lg text-center" style={{ width: "350px", backgroundColor: "#f8f9fa", borderRadius: "10px" }}>
          <h3 className="mb-3" style={{ color: "#343a40" }}>Login</h3>
          <Form>
            <Form.Group className="mb-3">
              <InputGroup>
                <InputGroup.Text>
                  <FaUser />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Enter Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </InputGroup>
            </Form.Group>
            <Form.Group className="mb-3">
              <InputGroup>
                <InputGroup.Text>
                  <FaLock />
                </InputGroup.Text>
                <Form.Control
                  type={passwordVisible ? "text" : "password"}
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </InputGroup>
            </Form.Group>
            <Button variant="primary" className="w-100" onClick={handleLogin}>
              Login
            </Button>
          </Form>

          <Button
            variant="outline-dark"
            className="mt-3"
            onClick={() => setShowCredentials(!showCredentials)}
          >
            {showCredentials ? "Hide Demo Credentials" : "Show Demo Credentials"}
          </Button>

          {showCredentials && (
            <Alert variant="info" className="mt-3">
              <strong>Demo Users:</strong>
              <br /> 👤 user1 / password1
              <br /> 👤 user2 / password2
              <br /> 👤 user3 / password3
            </Alert>
          )}
        </Card>
      </Container>
    );
  }

  return (
    <div className="bg-light min-vh-100">
      <Navbar bg="dark" variant="dark" className="p-3">
        <Navbar.Brand>Trading App</Navbar.Brand>
        <span className="ms-auto text-white">
          <FaWallet className="me-2" /> ₹{currentUser.balance.toFixed(2)}
        </span>
        <Button variant="danger" className="ms-3" onClick={() => setIsLoggedIn(false)}>
          <FaSignOutAlt /> Logout
        </Button>
      </Navbar>

      <Container className="mt-4">
        <div className="row">
          <div className="col-md-6">
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title className="text-center">Available Stocks</Card.Title>
                <ListGroup variant="flush">
                  {stocks.map((stock, index) => (
                    <ListGroup.Item
                      key={index}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <span>{stock.name} - ₹{stock.current_price.toFixed(2)}</span>
                      <div>
                        <Button size="sm" variant="success" onClick={() => handleBuy(stock)}>
                          Buy
                        </Button>{" "}
                        <Button size="sm" variant="danger" onClick={() => handleSell(stock)}>
                          Sell
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </div>

          {/* View All Portfolios */}
          <div className="col-md-6">
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title className="text-center">User Portfolios</Card.Title>
                {users.map((user, index) => (
                  <Card key={index} className="mb-2" border={user.username === currentUser.username ? "primary" : "light"}>
                    <Card.Body>
                      <Card.Title className={user.username === currentUser.username ? "text-primary" : ""}>
                        {user.username} {user.username === currentUser.username && "(You)"}
                      </Card.Title>
                      {user.portfolio.length === 0 ? (
                        <p className="text-muted">No stocks in portfolio</p>
                      ) : (
                        <ListGroup variant="flush">
                          {user.portfolio.map((stock, i) => (
                            <ListGroup.Item key={i}>
                              {stock.name} - Qty: {stock.quantity} - ₹{(stock.quantity * stock.current_price).toFixed(2)}
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      )}
                    </Card.Body>
                  </Card>
                ))}
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default TradingApp;
