import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom' // 👈 Ye Import Zaroori Hai
import { Provider } from 'react-redux'
import store from './redux/store'
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NotificationProvider>
      <SocketProvider>
        <Provider store={store}>
          <BrowserRouter> {/* 👈 Ye Wrap Karna Bhool Gaye The */}
            <App />
          </BrowserRouter>
        </Provider>
      </SocketProvider>
    </NotificationProvider>
  </React.StrictMode>,
)