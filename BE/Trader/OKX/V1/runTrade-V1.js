const Big = require('big.js');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const { setLever } = require('../../../controllers/bot');
require('dotenv').config({
    path: "../../.env"
});

(async () => {
    await setLever()
})()


