require('dotenv').config({
    path: "../../../.env"
});

const TelegramBot = require('node-telegram-bot-api');

const { WebsocketClient } = require('okx-api');
var cron = require('node-cron');
const OKX_API = require('../Doc/api');

const bot = new TelegramBot(process.env.OKX_BOT_TOKEN_THONG_KE, {
    polling: false,
    request: {
        agentOptions: {
            family: 4
        }
    }
});

const CHANNEL_ID = process.env.OKX_CHANNEL_ID_THONG_KE

var sendTeleCount = {
    logError: false,
    total: 0
}
let messageList = []
var listKlineObject = {}

var coinAllClose = false
var preTurnover = {}
var trichMauData = {}
var trichMauDataArray = {}
var trichMau = {}
var symbolObject = {}
var listKline = []
var trichMauTimeMainSendTele = {
    pre: 0,
}


let wsSymbol = new WebsocketClient({
    market: "businessAws"
});

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
async function getListSymbol() {

    let listSymbol = {}

    const getSpot = OKX_API.publicData.restAPI.getInstruments({ instType: "SPOT" })
    const getMargin = OKX_API.publicData.restAPI.getInstruments({ instType: "MARGIN" })

    try {
        const resultGetAll = await Promise.allSettled([getSpot, getMargin])

        resultGetAll.forEach((symbolListData) => {
            symbolListData.value?.forEach(symbolData => {
                if (symbolData.quoteCcy == "USDT") {
                    const symbol = symbolData.instId

                    listSymbol[symbol] = {
                        channel: "candle1s",
                        instId: symbolData.instId
                    }

                    symbolObject[symbol] = symbolData.instType == "MARGIN" ? "🍁" : "🍀"

                    trichMauData[symbol] = {
                        open: 0,
                        close: 0,
                        high: 0,
                        low: 0,
                        turnover: 0
                    }

                    preTurnover[symbol] = 0
                    trichMauDataArray[symbol] = []
                    trichMau[symbol] = {
                        cur: 0,
                        pre: 0,
                    }
                }
            })
        })
    } catch (error) {
        console.log(`[!] Error get symbol: ${error.message}`);
    }

    return listSymbol
  
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

const sortListReverse = (arr) => {
    return {
        OC: [...arr].sort((a, b) => Math.abs(b.OC) - Math.abs(a.OC)),
        OCLong: [...arr].sort((a, b) => Math.abs(b.OCLong) - Math.abs(a.OCLong))
    }
}
const checkInfinityValue = value => [Infinity, -Infinity].includes(value)
const formatTime = time => new Date(time).toLocaleString()



const tinhOC = (symbol, data = {}) => {

    // console.log(dataAll, symbol, new Date().toLocaleString());



    const Close = +data.close
    const Open = +data.open
    const Highest = +data.high
    const Lowest = +data.low
    const vol = data.turnover
    const timestamp = data.timestamp

    let OC = (Highest - Open) / Open
    let TP = Math.abs((Highest - Close) / (Highest - Open)) || 0
    let OCLong = (Lowest - Open) / Open
    let TPLong = Math.abs(Close - Lowest) / (Open - Lowest) || 0


    if ([Infinity, -Infinity].includes(OC)) {
        OC = 0
    }

    if ([Infinity, -Infinity].includes(OCLong)) {
        OCLong = 0
    }
    if ([Infinity, -Infinity].includes(TP)) {
        TP = 0
    }

    if ([Infinity, -Infinity].includes(TPLong)) {
        TPLong = 0
    }

    const OCRound = roundNumber(OC)
    const TPRound = roundNumber(TP)
    const OCLongRound = roundNumber(OCLong)
    const TPLongRound = roundNumber(TPLong)


    if (vol >= 0) {
        if (OCRound >= .2 && TPRound > 0) {
            const ht = (`${symbolObject[symbol]} | <b>${symbol.replace("-USDT", "")}</b> - OC: ${OCRound}% - TP: ${TPRound}% - VOL: ${formatNumberString(vol)} | ${formatTime(timestamp)}`)
            messageList.push(ht)
            console.log(ht);
            console.log(data);
        }

        if (OCLongRound <= -.2 && TPLongRound > 0) {
            const htLong = (`${symbolObject[symbol]} | <b>${symbol.replace("-USDT", "")}</b> - OC: ${OCLongRound}% - TP: ${TPLongRound}% - VOL: ${formatNumberString(vol)} | ${formatTime(timestamp)}`)
            messageList.push(htLong)
            console.log(htLong);
            console.log(data);
        }
    }


    if (messageList.length > 0) {
        const time = Date.now()
        if (time - trichMauTimeMainSendTele.pre >= 3000) {
            sendTeleCount.total += 1
            // sendMessageTinhOC(messageList)
            messageList = []
            trichMauTimeMainSendTele.pre = time
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
const tinhOC2 = (symbol, dataAll = []) => {

    // console.log(dataAll, symbol, new Date().toLocaleString());

    if (dataAll.length > 0) {

        let dataOC = {
            close: 0,
            open: 0,
            high: 0,
            low: 0,
            OCData: {
                OC: 0,
                timestamp: 0,
            },
            TPData: {
                TP: 0,
                timestamp: 0,
            }
        }
        let dataOCLong = {
            close: 0,
            open: 0,
            high: 0,
            low: 0,
            OCData: {
                OC: 0,
                timestamp: 0,
            },
            TPData: {
                TP: 0,
                timestamp: 0,
            }
        }

        const vol = dataAll[dataAll.length - 1].turnover - preTurnover[symbol]

        dataAll.forEach((data, index) => {

            const Close = +data.close
            const Open = +data.open
            const Highest = +data.high
            const Lowest = +data.low
            // const turnover = data.turnover
            const timestamp = data.timestamp

            if (!dataOC.close) {
                const OC = (Highest - Open) / Open
                const TP = Math.abs((Highest - Close) / (Highest - Open)) || 0

                if (!checkInfinityValue(OC)) {
                    dataOC = {
                        close: Close,
                        open: Open,
                        high: Highest,
                        low: Lowest,
                        OCData: {
                            OC,
                            timestamp,
                        },
                        TPData: {
                            TP: checkInfinityValue(TP) ? 0 : TP,
                            timestamp,
                        }
                    }
                }
            }
            else {
                if (Lowest < dataOC.close) {
                    const TPTemp = Math.abs((Lowest - dataOC.high) / (dataOC.high - dataOC.open)) || 0
                    if (!checkInfinityValue(TPTemp) && TPTemp > dataOC.TPData.TP) {
                        dataOC.TPData = {
                            TP: TPTemp,
                            timestamp,
                        }
                    }
                }
            }
            if (!dataOCLong.close) {
                const OCLong = (Lowest - Open) / Open
                const TPLong = Math.abs(Close - Lowest) / (Open - Lowest) || 0
                if (!checkInfinityValue(OCLong)) {
                    dataOCLong = {
                        close: Close,
                        open: Open,
                        high: Highest,
                        low: Lowest,
                        OCData: {
                            OC: OCLong,
                            timestamp,
                        },
                        TPData: {
                            TP: checkInfinityValue(TPLong) ? 0 : TPLong,
                            timestamp,
                        }
                    }
                }
            }
            else {

                if (Highest > dataOCLong.close) {
                    const TPLongTemp = Math.abs((Highest - dataOCLong.low) / (dataOCLong.low - dataOCLong.open)) || 0
                    if (!checkInfinityValue(TPLongTemp) && TPLongTemp > dataOCLong.TPData.TP) {
                        dataOCLong.TPData = {
                            TP: TPLongTemp,
                            timestamp,
                        }

                    }
                }
            }
        })

        const OCRound = roundNumber(dataOC.OCData.OC)
        const TPRound = roundNumber(dataOC.TPData.TP)
        const OCLongRound = roundNumber(dataOCLong.OCData.OC)
        const TPLongRound = roundNumber(dataOCLong.TPData.TP)


        if (vol >= 0) {
            if (OCRound >= .2) {
                const ht = (`${symbolObject[symbol]} | <b>${symbol.replace("-USDT", "")}</b> \nOC: ${OCRound}% | ${formatTime(dataOC.OCData.timestamp)} \nTP: ${TPRound}% | ${formatTime(dataOC.TPData.timestamp)} \nVOL: ${formatNumberString(vol)}`)
                messageList.push(ht)
                console.log(ht);
                console.log(dataAll);
            }

            if (OCLongRound <= -.2) {
                const htLong = (`${symbolObject[symbol]} | <b>${symbol.replace("-USDT", "")}</b> \nOC: ${OCLongRound}% | ${formatTime(dataOCLong.OCData.timestamp)} \nTP: ${TPLongRound}% | ${formatTime(dataOCLong.TPData.timestamp)} \nVOL: ${formatNumberString(vol)}`)
                messageList.push(htLong)
                console.log(htLong);
                console.log(dataAll);
            }
        }


        if (messageList.length > 0) {
            const time = Date.now()
            if (time - trichMauTimeMainSendTele.pre >= 3000) {
                sendTeleCount.total += 1
                // sendMessageTinhOC(messageList)
                messageList = []
                trichMauTimeMainSendTele.pre = time
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


    const listSymbolObject = await getListSymbol()

    const listSymbol = Object.values(listSymbolObject)

    await wsSymbol.subscribe(listSymbol)

    wsSymbol.on('update', (dataCoin) => {

        const dataMain = dataCoin.data[0]
        const symbol = dataCoin.arg.instId


        tinhOC(symbol, {
            timestamp: +dataMain[0],
            open: +dataMain[1],
            high: +dataMain[2],
            low: +dataMain[3],
            close: +dataMain[4],
            turnover: +dataMain[6],
        })
        // if (symbol.toLowerCase() === "cetus-usdt") {
        //     console.log({
        //         timestamp: +dataMain[0],
        //         open: +dataMain[1],
        //         high: +dataMain[2],
        //         low: +dataMain[3],
        //         close: +dataMain[4],
        //         turnover: +dataMain[6],
        //     });
        // }

        // listKlineObject[symbol] = symbol

        // // if (symbol === "GUMMYUSDT") {
        // //     console.log("\n", dataCoin, new Date().toLocaleTimeString(), "\n");
        // // }

        // if (!trichMauData[symbol].open) {
        //     trichMauData[symbol] = {
        //         open: coinCurrent,
        //         close: coinCurrent,
        //         high: coinCurrent,
        //         low: coinCurrent,
        //         turnover,
        //     }
        //     preTurnover[symbol] = turnover
        //     trichMauDataArray[symbol].push(trichMauData[symbol])
        // }

        // if (coinCurrent > trichMauData[symbol].high) {
        //     trichMauData[symbol].high = coinCurrent

        // }
        // if (coinCurrent < trichMauData[symbol].low) {
        //     trichMauData[symbol].low = coinCurrent
        // }


        // trichMauData[symbol].turnover = turnover
        // trichMauData[symbol].close = coinCurrent
        // trichMauData[symbol].timestamp = timestamp

        // const time = Date.now()
        // if (time - trichMau[symbol].pre >= 1000) {
        //     trichMauDataArray[symbol].push(trichMauData[symbol])
        //     trichMau[symbol].pre = time
        // }
        // trichMauData[symbol] = {
        //     open: coinCurrent,
        //     close: coinCurrent,
        //     high: coinCurrent,
        //     low: coinCurrent,
        //     turnover,
        // }


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

    // setInterval(() => {

    //     Object.values(listKlineObject).forEach(symbol => {
    //         tinhOC(symbol, trichMauDataArray[symbol])
    //         const coinCurrent = trichMauData[symbol].close
    //         const turnover = trichMauData[symbol].turnover
    //         trichMauData[symbol] = {
    //             open: coinCurrent,
    //             close: coinCurrent,
    //             high: coinCurrent,
    //             low: coinCurrent,
    //             turnover,
    //         }
    //         preTurnover[symbol] = trichMauData[symbol].turnover
    //         trichMauDataArray[symbol] = []
    //     })
    //     listKlineObject = {}
    // }, 3000)




    //Báo lỗi socket$ pm2 start app.js
    wsSymbol.on('error', (err) => {
        process.exit(1);
    });

};

try {
    Main()

    setTimeout(() => {
        cron.schedule('0 */3 * * *', async () => {
            process.exit(0);
        });
    }, 1000)
}

catch (e) {
    console.log("Error Main:", e)
}