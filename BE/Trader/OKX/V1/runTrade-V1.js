const Big = require('big.js');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const { getSymbolFromCloud } = require('../../../controllers/spot-OKX');
require('dotenv').config({
    path: "../../.env"
});

(async ()=>{
    await getSymbolFromCloud()
})()


