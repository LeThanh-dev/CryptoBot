const WebSocket = require('ws');

// Kết nối đến WebSocket
const ws = new WebSocket('wss://stream.bybit.com/v5/public/spot');

ws.on('open', () => {
    console.log('Connected to Bybit WebSocket');

    // Đăng ký nhận dữ liệu nến 1 giây cho cặp giao dịch
    const subscribeMessage = {
        op: 'subscribe',
        args: ['tickers.SCAUSDT']
    };

    ws.send(JSON.stringify(subscribeMessage));
});

ws.on('message', (dataCoinJSON) => {
    const dataCoin = JSON.parse(dataCoinJSON)
    const data = dataCoin.data?.lastPrice
    console.log('Received:', data); 

});

ws.on('error', (error) => {
    console.error('WebSocket error:', error);
});

ws.on('close', () => {
    console.log('WebSocket connection closed');
});
