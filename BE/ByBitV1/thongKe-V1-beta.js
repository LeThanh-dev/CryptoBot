require('dotenv').config();
const { exec } = require('child_process');

const TelegramBot = require('node-telegram-bot-api');

const { RestClientV5, WebsocketClient } = require('bybit-api');
var cron = require('node-cron');

const bot = new TelegramBot("6992407921:AAFS2wimsauyuoj1eXJFN_XxRFhs5wWtp7c", {
    polling: false,
    request: {
        agentOptions: {
            family: 4
        }
    }
});
const CHANNEL_ID = "-1002178225625"
const MAX_ORDER_LIMIT = 20

var sendTeleCount = {
    logError: false,
    total: 0
}
let digit = []
let OpenTimem1 = []
let CoinFT = []
let messageList = []

var delayTimeOut = ""
var coinAllClose = false
var trichMauData = {}
var trichMauDataArray = {}
var trichMau = {}
var symbolObject = {}
var listKline = []
var trichMauTimeMainSendTele = {
    pre: 0,
}

let botListTelegram = {}

let wsConfig = {
    market: 'v5',
    recvWindow: 100000
}
let wsSymbol = new WebsocketClient(wsConfig);
let wsInfo = {
    testnet: false,
}
let CoinInfo = new RestClientV5(wsInfo);

//Funcition

async function sendMessageWithRetry(messageText, retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            messageText && await bot.sendMessage(CHANNEL_ID, messageText, {
                parse_mode: "HTML",
            });
            console.log('[->] Message sent to telegram successfully');
            return;
        } catch (error) {
            if (error.code === 429) {
                const retryAfter = error.parameters.retry_after;
                console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            } else {
                console.log("[!] Send Telegram Error", error)
            }
        }
    }
    throw new Error('Failed to send message after multiple retries');

}



async function ListCoinFT() {

    let ListCoin1m = []

    await CoinInfo.getInstrumentsInfo({ category: 'spot' })
        .then((rescoin) => {
            rescoin.result.list.forEach((e) => {
                const symbol = e.symbol
                if (symbol.split("USDT")[1] === "") {
                    ListCoin1m.push(`kline.D.${symbol}`)
                }

                symbolObject[symbol] = e.marginTrading != "none" ? "🍁" : "🍀"
                trichMauData[symbol] = {
                    open: 0,
                    close: 0,
                    high: 0,
                    low: 0,
                    turnover: 0
                }
                trichMauDataArray[symbol] = []
                trichMau[symbol] = {
                    cur: 0,
                    pre: 0,
                }
            })
        })
        .catch((error) => {
            console.error(error);
        });


    return ListCoin1m
    // return [`kline.1.OASUSDT`]
}



const roundNumber = (number) => {
    return Math.round(number * 10000) / 100
}

const formatNumberString = number => {
    if (number >= 1000000000) {
        return (number / 1000000000).toFixed(2) + 'B';
    } else if (number >= 1000000) {
        return (number / 1000000).toFixed(2) + 'M';
    } else if (number >= 1000) {
        return (number / 1000).toFixed(2) + 'K';
    } else {
        return number.toFixed(2);
    }
}

const sendMessageTinhOC = async (messageList) => {
    console.log(`Send telegram tính OC ( 🍁 ): `, new Date().toLocaleString("vi-vn", { timeZone: 'Asia/Ho_Chi_Minh' }));
    await sendMessageWithRetry(messageList.join("\n\n"))

}




const tinhOC = (symbol, dataAll = []) => {

    // console.log(dataAll, symbol, new Date().toLocaleString());


    if (dataAll.length > 0) {

        let OC = 0
        let TP = 0
        let OCLong = 0
        let TPLong = 0
        let vol = 0
        let OCNotPercent = 0
        let OCLongNotPercent = 0

        vol = dataAll[dataAll.length - 1].turnoverD - dataAll[0].turnoverD

        dataAll.forEach((data, index) => {

            const Close = +data.close
            const Open = +data.open
            const Highest = +data.high
            const Lowest = +data.low

            
            if (index === 0) {
                OCNotPercent = Highest - Open
                OC = OCNotPercent / Open
                OCLongNotPercent = Lowest - Open
                OCLong = OCLongNotPercent / Open
            }
            else {

                let TPTemp = Math.abs((Highest - Close) / OCNotPercent)
                let TPLongTemp = Math.abs((Lowest - Close) / OCNotPercent)
                let TPTemp2 = Math.abs((Highest - Close) / Math.abs(OCLongNotPercent))
                let TPLongTemp2 = Math.abs((Lowest - Close) / Math.abs(OCLongNotPercent))


                if ([Infinity, -Infinity].includes(TPTemp)) {
                    TPTemp = 0
                }
                if ([Infinity, -Infinity].includes(TPLongTemp)) {
                    TPLongTemp = 0
                }
                if ([Infinity, -Infinity].includes(TPTemp2)) {
                    TPTemp2 = 0
                }
                if ([Infinity, -Infinity].includes(TPLongTemp2)) {
                    TPLongTemp2 = 0
                }


                if (TPTemp > TP) {
                    TP = TPTemp
                }
                if (TPLongTemp > TPLong) {
                    TPLong = TPLongTemp
                }
                if (TPTemp2 > TP) {
                    TP = TPTemp2
                }
                if (TPLongTemp2 > TPLong) {
                    TPLong = TPLongTemp2
                }
            }
        })


        if ([Infinity, -Infinity].includes(OC)) {
            OC = 0
        }

        if ([Infinity, -Infinity].includes(OCLong)) {
            OCLong = 0
        }


        const OCRound = roundNumber(OC)
        const TPRound = roundNumber(TP)
        const OCLongRound = roundNumber(OCLong)
        const TPLongRound = roundNumber(TPLong)


        if (vol >= 0) {
            if (OCRound >= .5 && TPRound > 20) {
                // console.log("TPRound > 60", TPRound, typeof TPRound, TPRound > 60);
                const ht = (`${symbolObject[symbol]} | <b>${symbol.replace("USDT", "")}</b> - OC: ${OCRound}% - TP: ${TPRound}% - VOL: ${formatNumberString(vol)}`)
                messageList.push(ht)
                console.log(ht, new Date().toLocaleTimeString());
                console.log(dataAll);
            }

            // if (OCLongRound <= -1 && TPLongRound > 60) {
            if (OCLongRound <= -.5 && TPLongRound > 20) {
                // console.log("TPLongRound > 60", TPLongRound, typeof TPLongRound, TPLongRound > 60);
                const htLong = (`${symbolObject[symbol]} | <b>${symbol.replace("USDT", "")}</b> - OC: ${OCLongRound}% - TP: ${TPLongRound}% - VOL: ${formatNumberString(vol)}`)
                messageList.push(htLong)
                console.log(htLong, new Date().toLocaleTimeString());
                console.log(dataAll);
            }
        }



        if (messageList.length > 0) {
            if (new Date() - trichMauTimeMainSendTele.pre >= 3000) {
                sendTeleCount.total += 1
                // sendMessageTinhOC(messageList)
                messageList = []
                trichMauTimeMainSendTele.pre = new Date()
            }
        }

        // if (sendTeleCount.total < MAX_ORDER_LIMIT) {
        // }
        // else {
        //     if (!sendTeleCount?.logError) {
        //         console.log(`[!] LIMIT SEND TELEGRAM`);
        //         sendTeleCount.logError = true
        //         setTimeout(() => {
        //             sendTeleCount.logError = false
        //             sendTeleCount.total = 0
        //         }, 3000)
        //     }
        // }
    }
}


let Main = async () => {


    listKline = await ListCoinFT()

    wsSymbol.subscribeV5(listKline, 'spot').then(() => {
        console.log("[V] Subscribe Kline Successful");

        wsSymbol.on('update', (dataCoin) => {

            const dataMain = dataCoin.data[0]

            const coinCurrent = +dataMain.close
            const turnover = +dataMain.turnover
            const [_, candle, symbol] = dataCoin.topic.split(".");

            // if (symbol === "GUMMYUSDT") {
            //     console.log("\n", dataCoin, new Date().toLocaleTimeString(), "\n");
            // }


            if (!trichMauData[symbol].open) {
                trichMauData[symbol] = {
                    open: coinCurrent,
                    close: coinCurrent,
                    high: coinCurrent,
                    low: coinCurrent,
                    turnover,
                    turnoverD:turnover
                }
                trichMauDataArray[symbol].push(trichMauData[symbol])
            }

            if (coinCurrent > trichMauData[symbol].high) {
                trichMauData[symbol].high = coinCurrent

            }
            if (coinCurrent < trichMauData[symbol].low) {
                trichMauData[symbol].low = coinCurrent
            }


            trichMauData[symbol].turnoverD = turnover
            trichMauData[symbol].close = coinCurrent
            
            if (new Date(dataMain.timestamp) - trichMau[symbol].pre >= 1000) {
                // trichMauData[symbol].turnover = turnover - trichMauData[symbol].turnover
                trichMauDataArray[symbol].push(trichMauData[symbol])
                trichMau[symbol].pre = new Date(dataMain.timestamp)
            }

            trichMauData[symbol] = {
                open: coinCurrent,
                close: coinCurrent,
                high: coinCurrent,
                low: coinCurrent,
                turnover
            }


            // }
            // else if (dataMain.confirm === true) {
            //     coinAllClose = true
            //     trichMau[symbol].pre = new Date()
            //     trichMauData[symbol] = {
            //         open: coinCurrent,
            //         high: coinCurrent,
            //         low: coinCurrent,
            //         turnover: turnover,
            //     }
            // }


        });
    }).catch((err) => { console.log(err) });





    //Báo lỗi socket$ pm2 start app.js
    wsSymbol.on('error', (err) => {
        process.exit(1);
    });

};

try {
    Main()

    setInterval(() => {

        listKline.forEach(item => {
            const [_, candle, symbol] = item.split(".");
            tinhOC(symbol, trichMauDataArray[symbol])
            const coinCurrent = trichMauData[symbol].close
            trichMauData[symbol] = {
                open: coinCurrent,
                close: coinCurrent,
                high: coinCurrent,
                low: coinCurrent,
                turnover: trichMauData[symbol].turnover,
                turnoverD: trichMauData[symbol].turnover,
            }
            trichMauDataArray[symbol] = []
        })
    }, 3000)

    setTimeout(() => {
        cron.schedule('0 */3 * * *', async () => {
            process.exit(0);
        });
    }, 1000)
}

catch (e) {
    console.log("Error Main:", e)
}