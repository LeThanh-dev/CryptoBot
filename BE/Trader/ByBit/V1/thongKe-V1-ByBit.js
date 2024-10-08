require('dotenv').config({
    path: "../../../.env"
});
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
var listKlineObject = {}

var delayTimeOut = ""
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
                    // if (e.marginTrading != "none" && e.symbol.split("USDT")[1] === "") {
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
                preTurnover[symbol] = 0
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
    // return [`kline.D.NEIROUSDT`]
}



const roundNumber = (number) => {
    return Math.round(number * 10000) / 100
}

const formatNumberString = (number = 0) => {
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



const tinhOCMinMax = (symbol, dataAll = []) => {

    // console.log(dataAll, symbol, new Date().toLocaleString());

    if (dataAll.length > 0) {

        let OC = 0
        let TP = 0
        let OCLong = 0
        let TPLong = 0

        let dataOCList = []
        let dataOC = {}
        let dataOCLong = {}

        const vol = Math.abs(dataAll[dataAll.length - 1].turnoverD - preTurnover[symbol])

        dataAll.forEach((data, index) => {

            const Open = +data.open
            const Highest = +data.high
            const Lowest = +data.low
            const timestamp = data.timestamp

            OC = (Highest - Open) / Open
            OCLong = (Lowest - Open) / Open

            if ([Infinity, -Infinity].includes(OC)) {
                OC = 0
            }

            if ([Infinity, -Infinity].includes(OCLong)) {
                OCLong = 0
            }
            dataOCList.push({
                OC: OC,
                OCLong: OCLong,
                index,
                timestamp
            })
        })

        const OCMain = sortListReverse(dataOCList)
        const OCLongData = OCMain.OCLong[0]
        const OCData = OCMain.OC[0]

        OC = OCData.OC
        const timestampOC = OCData.timestamp
        OCLong = OCLongData.OCLong
        const timestampOCLong = OCLongData.timestamp


        dataAll.forEach((data, index) => {

            const Close = +data.close
            const Open = +data.open
            const Highest = +data.high
            const Lowest = +data.low

            if (index >= OCData.index) {
                if (index === OCData.index) {
                    // Tinh OC Short
                    TP = Math.abs((Highest - Close) / (Highest - Open)) || 0
                    dataOC = {
                        close: Close,
                        open: Open,
                        high: Highest,
                        low: Lowest,
                    }
                }
                else {
                    let TPTemp = 0
                    if (Lowest < dataOC.close) {
                        TPTemp = Math.abs((Lowest - dataOC.high) / (dataOC.high - dataOC.open)) || 0
                    }
                    if (TPTemp > TP) {
                        TP = TPTemp
                    }

                }
            }
            if (index >= OCLongData.index) {
                if (index === OCLongData.index) {
                    // Tinh OC Long
                    TPLong = Math.abs(Close - Lowest) / (Open - Lowest) || 0
                    dataOCLong = {
                        close: Close,
                        open: Open,
                        high: Highest,
                        low: Lowest,
                    }
                }
                else {
                    let TPLongTemp = 0

                    if (Highest > dataOCLong.close) {
                        TPLongTemp = Math.abs((Highest - dataOCLong.low) / (dataOCLong.low - dataOCLong.open)) || 0
                    }

                    if (TPLongTemp > TPLong) {
                        TPLong = TPLongTemp
                    }
                }
            }

        })


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

        if (vol >= 2000) {
            if (OCRound >= 1 && TPRound > 0) {
                const ht = (`${symbolObject[symbol]} | <b>${symbol.replace("-USDT", "")}</b> - OC: ${OCRound}% - TP: ${TPRound}% - VOL: ${formatNumberString(vol)} - Index: ${OCData.index} | ${new Date(timestampOC).toLocaleString()}`)
                messageList.push(ht)
                console.log(ht);
                console.log(dataAll);
            }

            if (OCLongRound <= -1 && TPLongRound > 0) {
                const htLong = (`${symbolObject[symbol]} | <b>${symbol.replace("-USDT", "")}</b> - OC: ${OCLongRound}% - TP: ${TPLongRound}% - VOL: ${formatNumberString(vol)} - Index: ${OCLongData.index} | ${new Date(timestampOCLong).toLocaleString()}`)
                messageList.push(htLong)
                console.log(htLong);
                console.log(dataAll);
            }
        }


        const time = Date.now()

        if (messageList.length > 0) {
            if (time - trichMauTimeMainSendTele.pre >= 3000) {
                sendTeleCount.total += 1
                sendMessageTinhOC(messageList)
                messageList = []
                trichMauTimeMainSendTele.pre = time
            }
        }
    }
}

const checkInfinityValue = value => [Infinity, -Infinity].includes(value)
const formatTime = time => new Date(time).toLocaleString()

const tinhOC = (symbol, dataAll = []) => {

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

        if (vol >= 2000) {
            if (OCRound >= 1 && TPRound > 0) {
                const ht = (`${symbolObject[symbol]} | <b>${symbol.replace("-USDT", "")}</b> - OC: ${OCRound}% - TP: ${TPRound}% - VOL: ${formatNumberString(vol)} | ${formatTime(dataOC.OCData.timestamp)}`)
                messageList.push(ht)
                console.log(ht);
                console.log(dataAll);
            }

            if (OCLongRound <= -1 && TPLongRound > 0) {
                const htLong = (`${symbolObject[symbol]} | <b>${symbol.replace("-USDT", "")}</b> - OC: ${OCLongRound}% - TP: ${TPLongRound}% - VOL: ${formatNumberString(vol)} | ${formatTime(dataOCLong.OCData.timestamp)}`)
                messageList.push(htLong)
                console.log(htLong);
                console.log(dataAll);
            }
        }


        if (messageList.length > 0) {
            const time = Date.now()
            if (time - trichMauTimeMainSendTele.pre >= 3000) {
                sendTeleCount.total += 1
                sendMessageTinhOC(messageList)
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


    listKline = await ListCoinFT()

    await wsSymbol.subscribeV5(listKline, 'spot').then(() => {
        console.log("[V] Subscribe Kline Successful");

        wsSymbol.on('update', (dataCoin) => {
            const dataMain = dataCoin.data[0]

            const coinCurrent = +dataMain.close
            const turnover = +dataMain.turnover
            const timestamp = dataMain.timestamp
            const [_, candle, symbol] = dataCoin.topic.split(".");

            listKlineObject[symbol] = symbol

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
                }
                preTurnover[symbol] = turnover
                trichMauDataArray[symbol].push(trichMauData[symbol])
            }

            if (coinCurrent > trichMauData[symbol].high) {
                trichMauData[symbol].high = coinCurrent

            }
            if (coinCurrent < trichMauData[symbol].low) {
                trichMauData[symbol].low = coinCurrent
            }


            trichMauData[symbol].turnover = turnover
            trichMauData[symbol].close = coinCurrent
            trichMauData[symbol].timestamp = timestamp

            const time = Date.now()

            if (time - trichMau[symbol].pre >= 1000) {
                trichMauDataArray[symbol].push(trichMauData[symbol])
                trichMau[symbol].pre = time
            }
            trichMauData[symbol] = {
                open: coinCurrent,
                close: coinCurrent,
                high: coinCurrent,
                low: coinCurrent,
                turnover,
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


        })
    }).catch((err) => { console.log(err) });

    setInterval(() => {

        Object.values(listKlineObject).forEach(symbol => {
            tinhOC(symbol, trichMauDataArray[symbol])
            const coinCurrent = trichMauData[symbol].close
            const turnover = trichMauData[symbol].turnover
            trichMauData[symbol] = {
                open: coinCurrent,
                close: coinCurrent,
                high: coinCurrent,
                low: coinCurrent,
                turnover,
            }
            preTurnover[symbol] = turnover
            trichMauDataArray[symbol] = []
        })
        listKlineObject = {}
    }, 3000)



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