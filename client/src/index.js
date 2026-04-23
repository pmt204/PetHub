import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

const initialOptions = {
    "clientId": process.env.REACT_APP_PAYPAL_CLIENT_ID,
    "currency": "USD",
    "intent": "capture",
};


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <PayPalScriptProvider options={initialOptions}>
      <App />
    </PayPalScriptProvider>
);

reportWebVitals();