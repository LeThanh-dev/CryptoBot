const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
require('dotenv').config({
    path: "../../../.env"
});
const cron = require('node-cron');
const changeColorConsole = require('cli-color');
const TelegramBot = require('node-telegram-bot-api');

const { RestClientV5, WebsocketClient } = require('bybit-api');
const {
    getAllStrategiesActive,
    getAllSymbolBE,
    getFutureBE,
    createStrategiesMultipleStrategyBE,
    updateStrategiesMultipleStrategyBE,
    deleteStrategiesMultipleStrategyBE,
    syncSymbolBE,
    deleteAllScannerBE,
    deleteAllForUPcode
} = require('../../../controllers/Configs/ByBit/V3/config');
const {
    createPositionBE,
    updatePositionBE,
    deletePositionBE,
    getPositionBySymbol
} = require('../../../controllers/Positions/ByBit/V3/position');

const { getAllStrategiesActiveScannerV3BE } = require('../../../controllers/Configs/ByBit/V3/scanner');

const wsSymbol = new WebsocketClient({
    market: 'v5',
    recvWindow: 100000,
});

const limitNen = 100;
const LIST_ORDER = ["order", "position"]
const MAX_ORDER_LIMIT = 10

const clientPublic = new RestClientV5({
    testnet: false,
    recv_window: 100000,
});

// ----------------------------------------------------------------------------------
var allScannerDataObject = {}
let missTPDataBySymbol = {}
var botBalance = {}

var blockContinueOrderOCByStrategiesID = {}
var listKline = []
var allSymbol = {}
var updatingAllMain = false
var connectKlineError = false
var connectByBotError = {}

// ------- BTC ------------

var nangOCValue = 0
var checkOrderOCAll = true

var haOCFunc = ""

// -------  ------------

var allStrategiesByCandleAndSymbol = {}
var listPricePreOne = {}
var trichMauOCListObject = {}
var trichMauTPListObject = {}

var trichMauTimePre = {}

var allStrategiesByBotIDAndOrderID = {}
var allStrategiesByBotIDAndStrategiesID = {}
var allStrategiesByBotIDOrderOC = {}
var botApiList = {}
var digitAllCoinObject = {}
var botAmountListObject = {}
var botListTelegram = {}

// -------  ------------

var listOCByCandleBot = {}
var listConfigIDByScanner = {}

// ----------------------------------------------------------------------------------

const roundPrice = (
    {
        price,
        tickSize
    }
) => {
    // return (Math.floor(price / tickSize) * tickSize).toString()
    return price.toFixed(tickSize)
}

const getWebsocketClientConfig = ({
    ApiKey,
    SecretKey,
}) => {
    return new WebsocketClient({
        testnet: false,
        key: ApiKey,
        secret: SecretKey,
        market: 'v5',
        recvWindow: 100000,
    })
}
const getRestClientV5Config = ({
    ApiKey,
    SecretKey,
}) => {
    return new RestClientV5({
        testnet: false,
        key: ApiKey,
        secret: SecretKey,
        syncTimeBeforePrivateRequests: true,
        recvWindow: 10000,
    })
}

// ----------------------------------------------------------------------------------


const cancelAllListOrderOC = async (listOCByCandleBotInput) => {

    const allData = ["1m", "3m", "5m", "15m"].reduce((pre, candleItem) => {
        const arr = Object.values(listOCByCandleBotInput[candleItem] || {})

        if (arr.length > 0) {

            arr.forEach(item => {

                if (Object.values(item.listOC || {}).length > 0) {

                    pre[item.ApiKey] = {
                        listOC: {
                            ...(pre[item.ApiKey]?.listOC || {}),
                            ...item.listOC
                        },
                        ApiKey: item.ApiKey,
                        SecretKey: item.SecretKey,
                    }
                }
            })

        }
        return pre
    }, {});

    await handleCancelAllOrderOC(Object.values(allData || {}))

}

const Digit = async () => {// proScale
    let PScale = []
    await clientPublic.getInstrumentsInfo({
        category: 'linear',
    })
        .then((response) => {
            PScale = PScale.concat(response.result.list.map(item => ({
                symbol: item.symbol,
                // priceScale: item.priceFilter.tickSize
                priceScale: item.priceScale
            })))
        })
        .catch((error) => {
            console.log("Error Digit:", error)
        });
    return PScale
}


const handleSubmitOrder = async ({
    strategy,
    strategyID,
    symbol,
    qty,
    side,
    price,
    candle,
    ApiKey,
    SecretKey,
    botName,
    botID,
    coinOpen
}) => {

    !allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID] && cancelAll({ botID, strategyID });

    !allStrategiesByBotIDOrderOC[botID] && (
        allStrategiesByBotIDOrderOC[botID] = {
            totalOC: 0,
            logError: false,
            timeout: ""
        }
    );

    !listOCByCandleBot[candle] && (listOCByCandleBot[candle] = {});
    !listOCByCandleBot[candle][botID] && (listOCByCandleBot[candle][botID] = {
        listOC: {},
        ApiKey,
        SecretKey,
    });

    allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.ordering = true

    const orderLinkId = uuidv4()

    if (allStrategiesByBotIDOrderOC[botID].totalOC < MAX_ORDER_LIMIT) {

        allStrategiesByBotIDOrderOC[botID].totalOC += 1

        allStrategiesByBotIDAndOrderID[botID][orderLinkId] = {
            strategy,
            coinOpen,
            OrderChangeFilled: strategy.OrderChange,
            OC: true
        }

        listOCByCandleBot[candle][botID].listOC[strategyID] = {
            strategyID,
            candle,
            symbol,
            side,
            botName,
            botID,
            orderLinkId,
            scannerID: strategy.scannerID
        }

        const client = getRestClientV5Config({ ApiKey, SecretKey });

        await client
            .submitOrder({
                category: 'linear',
                symbol,
                side,
                positionIdx: 0,
                orderType: 'Limit',
                qty,
                price,
                orderLinkId
            })
            .then((response) => {
                if (response.retCode == 0) {

                    const newOrderID = response.result.orderId
                    const newOrderLinkID = response.result.orderLinkId

                    allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.orderID = newOrderID
                    allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.orderLinkId = newOrderLinkID
                    allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.coinOpen = coinOpen

                    const newOC = Math.abs((price - coinOpen)) / coinOpen * 100

                    const text = `\n[+OC] Order OC ( ${strategy.OrderChange}% -> ${newOC.toFixed(2)}% ) ( ${botName} - ${side} - ${symbol} - ${candle} ) successful`
                    console.log(text)
                    console.log(changeColorConsole.greenBright(`[_OC orderID_] ( ${botName} - ${side} - ${symbol} - ${candle} ): ${newOrderLinkID}`));

                    // sendMessageWithRetry({
                    //     messageText: text,
                    //     telegramID,
                    //     telegramToken
                    // })

                }
                else {
                    console.log(changeColorConsole.yellowBright(`\n[!] Ordered OC ( ${botName} - ${side} - ${symbol} - ${candle} ) failed: `, response.retMsg))
                    delete allStrategiesByBotIDAndOrderID[botID][orderLinkId]
                    delete listOCByCandleBot[candle][botID].listOC[strategyID]

                }
                allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.ordering = false
            })
            .catch((error) => {
                console.log(`\n[!] Ordered OC ( ${botName} - ${side} - ${symbol} - ${candle} ) error `, error)
                allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.ordering = false
                delete allStrategiesByBotIDAndOrderID[botID][orderLinkId]
                delete listOCByCandleBot[candle][botID].listOC[strategyID]

            });

        allStrategiesByBotIDOrderOC[botID].timeout && clearTimeout(allStrategiesByBotIDOrderOC[botID].timeout)
        allStrategiesByBotIDOrderOC[botID].timeout = setTimeout(() => {
            allStrategiesByBotIDOrderOC[botID].logError = false
            allStrategiesByBotIDOrderOC[botID].totalOC = 0
        }, 1000)
    }
    else {
        if (!allStrategiesByBotIDOrderOC[botID]?.logError) {
            console.log(changeColorConsole.redBright(`[!] LIMIT ORDER OC ( ${botName} )`));
            allStrategiesByBotIDOrderOC[botID].logError = true

        }
    }
}

const handleSubmitOrderTP = async ({
    strategy,
    OrderChangeFilled,
    strategyID,
    symbol,
    side,
    qty,
    price,
    candle = "",
    ApiKey,
    SecretKey,
    missState = false,
    botName,
    botID
}) => {

    // console.log(changeColorConsole.greenBright(`Price order TP ( ${botName} - ${side} - ${symbol} - ${candle} ):`, price));

    const botSymbolMissID = `${botID}-${symbol}`

    missTPDataBySymbol[botSymbolMissID]?.timeOutFunc && clearTimeout(missTPDataBySymbol[botSymbolMissID].timeOutFunc)



    const orderLinkId = uuidv4()

    if (!missState) {
        allStrategiesByBotIDAndOrderID[botID][orderLinkId] = {
            strategy,
            OrderChangeFilled,
            TP: true
        }
    }
    const client = getRestClientV5Config({ ApiKey, SecretKey });

    await client
        .submitOrder({
            category: 'linear',
            symbol,
            side,
            positionIdx: 0,
            orderType: 'Limit',
            qty,
            price,
            orderLinkId,
            reduceOnly: true
        })
        .then((response) => {
            if (response.retCode == 0) {
                const newOrderID = response.result.orderId
                const newOrderLinkID = response.result.orderLinkId

                allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.orderID = newOrderID
                allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.orderLinkId = newOrderLinkID




                missTPDataBySymbol[botSymbolMissID] = {
                    ...missTPDataBySymbol[botSymbolMissID],
                    size: missTPDataBySymbol[botSymbolMissID].size + Math.abs(qty),
                    priceOrderTP: price
                }

                missTPDataBySymbol[botSymbolMissID].orderIDOfListTP.push({
                    orderID: newOrderID,
                    strategyID
                })


                console.log(`[+TP] Order TP ${missState ? "( MISS )" : ''} ( ${botName} - ${side} - ${symbol} - ${candle} ) successful:  ${qty}`)
                console.log(changeColorConsole.greenBright(`[_TP orderID_] ( ${botName} - ${side} - ${symbol} - ${candle} ): ${newOrderLinkID}`));

            }
            else {
                console.log(changeColorConsole.yellowBright(`[!] Order TP ${missState ? "( MISS )" : ''} - ( ${botName} - ${side} - ${symbol} - ${candle} ) failed `, response.retMsg))
                delete allStrategiesByBotIDAndOrderID[botID][orderLinkId]

            }
        })
        .catch((error) => {
            console.log(`[!] Order TP ${missState ? "( MISS )" : ''} - ( ${botName} - ${side} - ${symbol} - ${candle} ) error `, error)
            delete allStrategiesByBotIDAndOrderID[botID][orderLinkId]

            console.log("ERROR Order TP:", error)
        });
}

const moveOrderTP = async ({
    strategyID,
    symbol,
    price,
    orderId,
    candle,
    side,
    ApiKey,
    SecretKey,
    botName,
    botID
}) => {
    // console.log(changeColorConsole.greenBright(`Price Move TP ( ${botName} - ${side} - ${symbol} - ${candle} ):`, price));

    const client = getRestClientV5Config({ ApiKey, SecretKey });

    await client
        .amendOrder({
            category: 'linear',
            symbol,
            price,
            orderId
        })
        .then((response) => {
            if (response.retCode == 0) {
                allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.orderID = response.result.orderId
                console.log(`[->] Move Order TP ( ${botName} - ${side} - ${symbol} - ${candle} ) successful: ${price}`)
            }
            else {
                console.log(changeColorConsole.yellowBright(`[!] Move Order TP ( ${botName} - ${side} - ${symbol} - ${candle} ) failed `, response.retMsg))
                // allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.orderID = ""
            }
        })
        .catch((error) => {
            console.log(`[!] Move Order TP ( ${botName} - ${side} - ${symbol} - ${candle} ) error `, error)
            // allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.orderID = ""
        });

}

const handleMoveOrderTP = async ({
    strategyID,
    strategy,
    coinOpen,
    candle = "",
    side,
    ApiKey,
    SecretKey,
    botName,
    botID
}) => {

    const sideText = side === "Buy" ? "Sell" : "buy"
    const symbol = strategy.symbol

    if (allStrategiesByBotIDAndStrategiesID[botID][strategyID]?.TP.orderID) {

        const TPOld = allStrategiesByBotIDAndStrategiesID[botID][strategyID]?.TP.price

        let TPNew
        if (strategy.PositionSide === "Long") {
            TPNew = TPOld - Math.abs(TPOld - coinOpen) * (strategy.ReduceTakeProfit / 100)
        }
        else {
            TPNew = TPOld + Math.abs(TPOld - coinOpen) * (strategy.ReduceTakeProfit / 100)
        }

        allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.price = TPNew

        const dataInput = {
            strategyID,
            symbol,
            price: roundPrice({
                price: TPNew,
                tickSize: strategy.digit
            }),
            orderId: allStrategiesByBotIDAndStrategiesID[botID][strategyID]?.TP.orderID,
            candle,
            side: sideText,
            ApiKey,
            SecretKey,
            botName,
            botID
        }
        await moveOrderTP(dataInput)

    }
}
const handleCancelOrderOC = async ({
    strategyID,
    symbol,
    candle = "",
    side,
    ApiKey,
    SecretKey,
    botName,
    botID
}) => {

    const client = getRestClientV5Config({ ApiKey, SecretKey });

    !allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderFilled &&
        await client
            .cancelOrder({
                category: 'linear',
                symbol,
                orderId: allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.orderID
            })
            .then((response) => {
                if (response.retCode == 0) {
                    console.log(`[V] Cancel order ( ${botName} - ${side} -  ${symbol} - ${candle} ) successful `);
                    cancelAll({ strategyID, botID })
                    delete listOCByCandleBot[candle][botID].listOC[strategyID]

                }
                else {
                    console.log(changeColorConsole.yellowBright(`[!] Cancel order ( ${botName} - ${side} -  ${symbol} - ${candle} ) failed `, response.retMsg))
                }
            })
            .catch((error) => {
                console.log(`[!] Cancel order ( ${botName} - ${side} -  ${symbol} - ${candle} ) error `, error)
            });

}
const handleCancelAllOrderOC = async (items = [], batchSize = 10) => {

    if (items.length > 0) {
        await Promise.allSettled(items.map(async item => {

            const client = getRestClientV5Config({ ApiKey: item.ApiKey, SecretKey: item.SecretKey });

            const list = Object.values(item.listOC || {})

            if (list.length > 0) {
                console.log(`[...] Total OC Can Be Cancelled: ${list.length}`);
                let index = 0;
                const listCancel = {}
                while (index < list.length) {
                    const batch = list.slice(index, index + batchSize);

                    const newList = batch.reduce((pre, cur) => {
                        const curOrderLinkId = cur.orderLinkId

                        const botIDTemp = cur.botID
                        const strategyIDTemp = cur.strategyID
                        const candleTemp = cur.candle

                        if (!allStrategiesByBotIDAndStrategiesID?.[botIDTemp]?.[strategyIDTemp]?.OC?.orderFilled) {
                            pre.push({
                                symbol: cur.symbol,
                                orderLinkId: curOrderLinkId,
                            })
                            listCancel[curOrderLinkId] = cur
                        }
                        else {
                            console.log(`[V] Cancel order OC ( ${cur.botName} - ${cur.side} -  ${cur.symbol} - ${candleTemp} ) has been filled `);
                        }
                        return pre
                    }, [])

                    console.log(`[...] Canceling ${newList.length} OC`);

                    const res = await client.batchCancelOrders("linear", newList)
                    const listSuccess = res.result.list || []
                    const listSuccessCode = res.retExtInfo.list || []


                    listSuccess.forEach((item, index) => {
                        const data = listCancel[item.orderLinkId]
                        const codeData = listSuccessCode[index]
                        const botIDTemp = data.botID
                        const strategyIDTemp = data.strategyID
                        const candleTemp = data.candle

                        if (codeData.code == 0) {
                            console.log(`[V] Cancel order OC ( ${data.botName} - ${data.side} -  ${data.symbol} - ${candleTemp} ) successful `);
                            cancelAll({
                                botID: botIDTemp,
                                strategyID: strategyIDTemp,
                            })
                            delete listOCByCandleBot[candleTemp][botIDTemp].listOC[strategyIDTemp]

                        }
                        else {
                            console.log(changeColorConsole.yellowBright(`[!] Cancel order OC ( ${data.botName} - ${data.side} -  ${data.symbol} - ${candleTemp} ) failed `, codeData.msg));
                            if (allStrategiesByBotIDAndStrategiesID?.[botIDTemp]?.[strategyIDTemp]?.OC?.orderID) {
                                console.log(changeColorConsole.magentaBright(`[!] Tồn đọng OC ( ${data.botName} - ${data.side} -  ${data.symbol} - ${candleTemp} )`));
                            }
                        }
                    })

                    await delay(1200)
                    index += batchSize;
                }
            }
        }))
        console.log("[V] Cancel All OC Successful");

    }

}

const handleCancelOrderTP = async ({
    strategyID,
    symbol,
    side,
    candle = "",
    orderId,
    ApiKey,
    SecretKey,
    gongLai = false,
    botName,
    botID
}) => {

    const botSymbolMissID = `${botID}-${symbol}`

    const client = getRestClientV5Config({ ApiKey, SecretKey });

    orderId && await client
        .cancelOrder({
            category: 'linear',
            symbol,
            orderId,
        })
        .then((response) => {
            if (response.retCode == 0) {
                console.log(`[V] Cancel TP ( ${botName} - ${side} - ${symbol} - ${candle} ) successful `);

                if (gongLai && !missTPDataBySymbol[botSymbolMissID].gongLai) {
                    missTPDataBySymbol[botSymbolMissID].gongLai = true
                    missTPDataBySymbol[botSymbolMissID]?.orderIDToDB && updatePositionBE({
                        newDataUpdate: {
                            Miss: true,
                            TimeUpdated: new Date()
                        },
                        orderID: missTPDataBySymbol[botSymbolMissID].orderIDToDB
                    }).then(message => {
                        console.log(message);
                    }).catch(err => {
                        console.log(err)
                    })
                    // resetMissData({
                    //     botID,
                    //     symbol
                    // })
                }
            }
            else {
                console.log(changeColorConsole.yellowBright(`[!] Cancel TP ( ${botName} - ${side} - ${symbol} - ${candle} ) failed `, response.retMsg))
            }

        })
        .catch((error) => {
            console.log(`[!] Cancel TP ( ${botName} - ${side} - ${symbol} - ${candle} ) error `, error)
        });
    cancelAll({ strategyID, botID })
    delete listOCByCandleBot[candle]?.[botID]?.listOC?.[strategyID]


}

async function handleCancelAllOrderTP({
    items,
    batchSize = 10
}) {
    if (items.length > 0) {
        console.log(`[...] Canceling TP`);

        let index = 0;
        while (index < items.length) {
            const batch = items.slice(index, index + batchSize);
            await Promise.allSettled(batch.map(item => handleCancelOrderTP({
                strategyID: item.strategyID,
                symbol: item.symbol,
                candle: item.candle,
                side: item.side,
                ApiKey: item.ApiKey,
                SecretKey: item.SecretKey,
                botName: item.botName,
                botID: item.botID,
                orderId: item.orderId,
                gongLai: item.gongLai,
            })));
            await delay(1200)
            index += batchSize;

        }
    }
}

const resetMissData = ({
    botID,
    symbol
}) => {
    const id = `${botID}-${symbol}`
    missTPDataBySymbol[id] = {
        size: 0,
        side: "",
        Candlestick: "",
        timeOutFunc: "",
        sizeTotal: 0,
        orderIDToDB: "",
        orderID: "",
        gongLai: false,
        orderIDOfListTP: [],
        priceOrderTP: 0,
        prePrice: 0,
        ApiKey: "",
        SecretKey: "",
        botName: "",
        botID: "",
    }

}

const cancelAll = (
    {
        strategyID,
        botID
    }
) => {
    if (botID && strategyID) {
        const data = allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]

        if (data) {
            const OCOrderID = data?.OC?.orderLinkId
            const TPOrderID = data?.TP?.orderLinkId
            OCOrderID && delete allStrategiesByBotIDAndOrderID[botID]?.[OCOrderID]
            TPOrderID && delete allStrategiesByBotIDAndOrderID[botID]?.[TPOrderID]
        }
        !allStrategiesByBotIDAndOrderID[botID] && (allStrategiesByBotIDAndOrderID[botID] = {});
        !allStrategiesByBotIDAndStrategiesID[botID] && (allStrategiesByBotIDAndStrategiesID[botID] = {});

        allStrategiesByBotIDAndStrategiesID[botID][strategyID] = {
            "OC": {
                orderID: "",
                orderLinkId: "",
                orderFilled: false,
                openTrade: "",
                dataSend: {},
                priceOrder: 0,
                orderFilledButMiss: false,
                moveAfterCompare: false,
                newOC: 0,
                coinOpen: 0,
                ordering: false
            },
            "TP": {
                orderID: "",
                orderLinkId: "",
                orderFilled: false,
                price: 0,
                qty: 0,
                side: "",
                priceCompare: 0,
                minMaxTempPrice: 0,
                coinClose: 0,
                moveAfterCompare: false,
                moveSuccess: false,
                orderFilledButMiss: false,
            },
        }
    }

}

// 
const sendMessageWithRetry = async ({
    messageText,
    retries = 5,
    telegramID,
    telegramToken,
}) => {

    let BOT_TOKEN_RUN_TRADE = botListTelegram[telegramToken]

    try {
        if (!BOT_TOKEN_RUN_TRADE) {
            const newBotInit = new TelegramBot(telegramToken, {
                polling: false,
                request: {
                    agentOptions: {
                        family: 4
                    }
                }
            })
            BOT_TOKEN_RUN_TRADE = newBotInit
            botListTelegram[telegramToken] = newBotInit
            // BOT_TOKEN_RUN_TRADE.launch();
        }
        for (let i = 0; i < retries; i++) {
            try {
                if (messageText) {
                    // await BOT_TOKEN_RUN_TRADE.telegram.sendMessage(telegramID, messageText);
                    await BOT_TOKEN_RUN_TRADE.sendMessage(telegramID, messageText, {
                        parse_mode: "HTML"
                    });
                    console.log('[->] Message sent to telegram successfully');
                    return;
                }
            } catch (error) {
                if (error.code === 429) {
                    const retryAfter = error.parameters.retry_after;
                    console.log(changeColorConsole.yellowBright(`[!] Rate limited. Retrying after ${retryAfter} seconds...`));
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                } else {
                    throw new Error(error);
                }
            }
        }

        throw new Error('[!] Failed to send message after multiple retries');
    } catch (error) {
        console.log("[!] Bot Telegram Error", error)
    }
};


const getMoneyFuture = async (botApiListInput) => {

    const list = Object.values(botApiListInput)
    if (list.length > 0) {
        const resultGetFuture = await Promise.allSettled(list.map(async botData => getFutureBE(botData.id)))

        if (resultGetFuture.length > 0) {
            resultGetFuture.forEach(({ value: data }) => {
                const botID = data?.botID
                if (botID) {
                    const money = +data?.totalWalletBalance
                    botAmountListObject[data.botID] = money || 0;
                    if (!money) {
                        console.log(changeColorConsole.redBright("[!] Get money failed: " + botApiList[botID]?.botName || botID));
                    }
                    // else {
                    //     console.log(changeColorConsole.greenBright("[V] Get money success: " + botApiList[botID]?.botName || botID));
                    // }
                }
            })
        }
    }
}
const sendAllBotTelegram = async (text) => {

    await Promise.allSettled(Object.values(botApiList).map(botApiData => {
        const telegramID = botApiData.telegramID
        const telegramToken = botApiData.telegramToken
        return sendMessageWithRetry({
            messageText: text,
            telegramID,
            telegramToken
        })
    }))
}



const handleSocketBotApiList = async (botApiListInput = {}, showLog = true) => {

    try {
        const objectToArray = Object.values(botApiListInput);
        const objectToArrayLength = objectToArray.length;
        if (showLog) {
            console.log(changeColorConsole.greenBright("[New-Bot-API] Length:", objectToArrayLength));
        }

        if (objectToArrayLength > 0) {

            await getMoneyFuture(botApiListInput)

            await Promise.allSettled(objectToArray.map(botApiData => {

                const ApiKey = botApiData.ApiKey
                const SecretKey = botApiData.SecretKey
                const botID = botApiData.id
                const botName = botApiList[botID]?.botName

                const wsOrder = getWebsocketClientConfig({ ApiKey, SecretKey });

                wsOrder.subscribeV5(LIST_ORDER, 'linear').then(() => {

                    console.log(`[V] Subscribe order ( ${botName} ) successful\n`);

                    wsOrder.on('update', async (dataCoin) => {

                        const botID = botApiData.id

                        const ApiKey = botApiList[botID]?.ApiKey
                        const SecretKey = botApiList[botID]?.SecretKey
                        const IsActive = botApiList[botID]?.IsActive
                        const botName = botApiList[botID]?.botName

                        const telegramID = botApiList[botID]?.telegramID
                        const telegramToken = botApiList[botID]?.telegramToken

                        const topicMain = dataCoin.topic
                        const dataMainAll = dataCoin.data

                        IsActive && ApiKey && SecretKey && await Promise.allSettled(dataMainAll.map(async dataMain => {

                            if (dataMain.category == "linear") {


                                const symbol = dataMain.symbol
                                const orderID = dataMain.orderLinkId
                                const orderStatus = dataMain.orderStatus

                                const botSymbolMissID = `${botID}-${symbol}`

                                if (orderStatus === "Filled") {
                                    console.log(changeColorConsole.greenBright(`[V] Filled OrderID ( ${botName} - ${dataMain.side} - ${symbol} ):`, orderID));

                                    if (!orderID) {

                                        ["1m", "3m", "5m", "15m"].forEach(candle => {
                                            const listObject = listOCByCandleBot?.[candle]?.[botID]?.listOC
                                            listObject && Object.values(listObject).map(strategyData => {
                                                const strategyID = strategyData.strategyID
                                                const symbolItem = strategyData.symbol
                                                if (symbol == symbolItem && !allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.TP?.orderID) {
                                                    {
                                                        console.log(`[V] RESET-Filled | ${symbol.replace("USDT", "")} - ${strategyData.side} - ${strategyData.candle} - Bot: ${strategyData.botName}`);
                                                        cancelAll({ botID, strategyID })
                                                        delete listOCByCandleBot[candle][botID].listOC[strategyID]

                                                    }
                                                }
                                            })
                                        });

                                    }
                                }
                                if (orderStatus === "PartiallyFilled") {
                                    console.log(changeColorConsole.blueBright(`[V] PartiallyFilled OrderID( ${botName} - ${dataMain.side} - ${symbol} - ${strategy.Candlestick} ):`, dataMain.qty));
                                }

                                if (topicMain === "order") {

                                    const strategyData = allStrategiesByBotIDAndOrderID[botID]?.[orderID]

                                    const strategy = strategyData?.strategy
                                    const OCTrue = strategyData?.OC
                                    const TPTrue = strategyData?.TP


                                    if (strategy) {

                                        const strategyID = strategy.value
                                        const OrderChangeFilled = strategyData.OrderChangeFilled
                                        // const coinOpenOC = allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.coinOpen || strategy.coinOpen

                                        const scannerIDData = strategy?.scannerID
                                        const scannerText = scannerIDData ? `\n<code>Scan: ${scannerIDData?.Label} 🌀</code>` : ""

                                        if (orderStatus === "Filled") {

                                            if (OCTrue) {

                                                const coinOpenOC = strategyData.coinOpen
                                                allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.orderFilled = true

                                                // Send telegram
                                                const openTrade = +dataMain.avgPrice;  //Gia khop lenh

                                                allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.openTrade = openTrade


                                                const qty = dataMain.qty

                                                const newOC = (Math.abs((openTrade - coinOpenOC)) / coinOpenOC * 100).toFixed(2)

                                                allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.newOC = newOC
                                                // const newOC = strategy.OrderChange

                                                const priceOldOrder = (botAmountListObject[botID] * strategy.Amount / 100).toFixed(2)

                                                console.log(`\n\n[V] Filled OC: \n${symbol.replace("USDT", "")} | Open ${strategy.PositionSide} ${scannerText} \nBot: ${botName} \nFT: ${strategy.Candlestick} | OC: ${OrderChangeFilled}% -> ${newOC}% | TP: ${strategy.TakeProfit}% \nPrice: ${openTrade} | Amount: ${priceOldOrder}\n`);
                                                const teleText = `<b>${symbol.replace("USDT", "")}</b> | Open ${strategy.PositionSide} ${scannerText} \nBot: ${botName} \nFT: ${strategy.Candlestick} | OC: ${OrderChangeFilled}% -> ${newOC}% | TP: ${strategy.TakeProfit}% \nPrice: ${openTrade} | Amount: ${priceOldOrder}`
                                                // const teleText = `<b>${symbol.replace("USDT", "")}</b> | Open ${sideText} \nBot: ${botName} \nFT: ${strategy.Candlestick} | OC: ${OrderChangeFilled}% | TP: ${strategy.TakeProfit}% \nPrice: ${openTrade} | Amount: ${priceOldOrder}`

                                                if (!missTPDataBySymbol[botSymbolMissID]?.orderIDToDB) {

                                                    const Quantity = dataMain.side === "Buy" ? qty : (qty * -1)

                                                    const newDataToDB = {
                                                        Symbol: symbol,
                                                        Side: dataMain.side,
                                                        Quantity,
                                                        Price: openTrade,
                                                    }

                                                    console.log(`\n[Saving->Mongo] Position When Filled OC ( ${botName} - ${dataMain.side} - ${symbol} )`);

                                                    await createPositionBE({
                                                        ...newDataToDB,
                                                        botID,
                                                    }).then(async data => {
                                                        console.log(data.message);
                                                        !missTPDataBySymbol[botSymbolMissID] && resetMissData({ botID, symbol })

                                                        const newID = data.id
                                                        if (newID) {
                                                            missTPDataBySymbol[botSymbolMissID].orderIDToDB = newID
                                                        }
                                                        else {
                                                            await getPositionBySymbol({ symbol, botID }).then(data => {
                                                                console.log(data.message);
                                                                missTPDataBySymbol[botSymbolMissID].orderIDToDB = data.id
                                                            }).catch(error => {
                                                                console.log("ERROR getPositionBySymbol:", error)

                                                            })
                                                        }

                                                    }).catch(err => {
                                                        console.log("ERROR createPositionBE:", err)
                                                    })
                                                }

                                                // Create TP

                                                let TPNew = 0

                                                if (strategy.PositionSide === "Long") {
                                                    TPNew = openTrade + Math.abs((openTrade - coinOpenOC)) * (strategy.TakeProfit / 100)
                                                    allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.priceCompare = openTrade + Math.abs((openTrade - coinOpenOC)) * ((strategy.EntryTrailing || 40) / 100)
                                                }
                                                else {
                                                    TPNew = openTrade - Math.abs((openTrade - coinOpenOC)) * (strategy.TakeProfit / 100)
                                                    allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.priceCompare = openTrade - Math.abs((openTrade - coinOpenOC)) * ((strategy.EntryTrailing || 40) / 100)
                                                }
                                                allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.side = strategy.PositionSide === "Long" ? "Sell" : "Buy"

                                                allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.price = TPNew


                                                allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.qty = qty

                                                const dataInput = {
                                                    strategy,
                                                    OrderChangeFilled,
                                                    strategyID,
                                                    symbol,
                                                    qty,
                                                    price: roundPrice({
                                                        price: TPNew,
                                                        tickSize: strategy.digit
                                                    }),
                                                    side: strategy.PositionSide === "Long" ? "Sell" : "Buy",
                                                    candle: strategy.Candlestick,
                                                    ApiKey,
                                                    SecretKey,
                                                    botName,
                                                    botID
                                                }

                                                allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.dataSend = dataInput

                                                handleSubmitOrderTP(dataInput)

                                                sendMessageWithRetry({
                                                    messageText: teleText,
                                                    telegramID,
                                                    telegramToken,
                                                })
                                            }
                                            // Khớp TP
                                            else if (TPTrue) {

                                                allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.orderFilled = true

                                                const closePrice = +dataMain.avgPrice;

                                                const side = strategy.PositionSide === "Long" ? "Buy" : "Sell"

                                                const openTradeOCFilled = allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.OC.openTrade

                                                const qty = +dataMain.qty;
                                                const priceOldOrder = (botAmountListObject[botID] * strategy.Amount / 100).toFixed(2)

                                                const newOC = allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.newOC

                                                console.log(`\n\n[V] Filled TP: \n${symbol.replace("USDT", "")} | Close ${strategy.PositionSide} ${scannerText} \nBot: ${botName} \nFT: ${strategy.Candlestick} | OC: ${OrderChangeFilled}% -> ${newOC}% | TP: ${strategy.TakeProfit}% \nPrice: ${closePrice} | Amount: ${priceOldOrder}\n`);

                                                const priceWinPercent = (Math.abs(closePrice - openTradeOCFilled) / openTradeOCFilled * 100).toFixed(2) || 0;
                                                const priceWin = ((closePrice - openTradeOCFilled) * qty).toFixed(2) || 0;

                                                let textWinLose = ""
                                                let textWinLoseShort = ""

                                                if (side === "Buy") {
                                                    if (priceWin > 0) {
                                                        textWinLose = `\n[WIN - LONG]: ${priceWin} | ${priceWinPercent}%\n`
                                                        textWinLoseShort = "✅"
                                                        console.log(changeColorConsole.greenBright(textWinLose));
                                                    }
                                                    else {
                                                        textWinLose = `\n[LOSE - LONG]: ${priceWin} | ${priceWinPercent}%\n`
                                                        textWinLoseShort = "❌"
                                                        console.log(changeColorConsole.magentaBright(textWinLose));
                                                    }
                                                }
                                                else {
                                                    if (priceWin > 0) {
                                                        textWinLose = `\n[LOSE - SHORT]: ${-1 * priceWin} | ${priceWinPercent}%\n`
                                                        textWinLoseShort = "❌"
                                                        console.log(changeColorConsole.magentaBright(textWinLose));
                                                    }
                                                    else {
                                                        textWinLose = `\n[WIN - SHORT]: ${Math.abs(priceWin)} | ${priceWinPercent}%\n`
                                                        textWinLoseShort = "✅"
                                                        console.log(changeColorConsole.greenBright(textWinLose));
                                                    }
                                                }

                                                const teleText = `<b>${textWinLoseShort} ${symbol.replace("USDT", "")}</b> | Close ${strategy.PositionSide} ${scannerText} \nBot: ${botName} \nFT: ${strategy.Candlestick} | OC: ${OrderChangeFilled}% -> ${newOC}% | TP: ${strategy.TakeProfit}% \nPrice: ${closePrice} | Amount: ${priceOldOrder}`

                                                missTPDataBySymbol[botSymbolMissID]?.timeOutFunc && clearTimeout(missTPDataBySymbol[botSymbolMissID].timeOutFunc)

                                                missTPDataBySymbol[botSymbolMissID].size -= Math.abs(qty)


                                                // Fill toàn bộ
                                                if (missTPDataBySymbol[botSymbolMissID]?.sizeTotal == qty || missTPDataBySymbol[botSymbolMissID]?.size == 0) {
                                                    console.log(`\n[_FULL Filled_] Filled TP ( ${botName} - ${side} - ${symbol} - ${strategy.Candlestick} )\n`);


                                                    if (missTPDataBySymbol[botSymbolMissID]?.orderIDToDB) {
                                                        deletePositionBE({
                                                            orderID: missTPDataBySymbol[botSymbolMissID].orderIDToDB
                                                        }).then(message => {
                                                            console.log(`[...] Delete Position ( ${botName} - ${side} - ${symbol} - ${strategy.Candlestick} )`);
                                                            console.log(message);
                                                        }).catch(err => {
                                                            console.log("ERROR deletePositionBE:", err)
                                                        })
                                                    }

                                                    console.log(`[...] Reset All ( ${botName} - ${side} - ${symbol} - ${strategy.Candlestick} )`);

                                                    resetMissData({
                                                        botID,
                                                        symbol,
                                                    })

                                                }
                                                else {
                                                    console.log(`\n[_Part Filled_] Filled TP ( ${botName} - ${side} - ${symbol} - ${strategy.Candlestick} )\n`);
                                                }

                                                delete listOCByCandleBot[strategy.Candlestick][botID].listOC[strategyID]

                                                cancelAll({ strategyID, botID })

                                                sendMessageWithRetry({
                                                    messageText: `${teleText} \n${textWinLose}`,
                                                    telegramID,
                                                    telegramToken,
                                                })


                                            }

                                        }

                                        else if (orderStatus === "Cancelled") {
                                            // console.log("[X] Cancelled");
                                            // Khớp TP
                                            if (TPTrue) {
                                                console.log(`[-] Cancelled TP ( ${botName} - ${strategy.PositionSide === "Long" ? "Sell" : "Buy"} - ${symbol} - ${strategy.Candlestick} ) - Chốt lời `);

                                                allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.orderID = ""
                                                // allStrategiesByBotIDOrderOC[botID][symbol].totalOC -= 1

                                                const qty = +dataMain.qty;
                                                missTPDataBySymbol[botSymbolMissID].size -= Math.abs(qty)


                                                if (missTPDataBySymbol[botSymbolMissID]?.sizeTotal - missTPDataBySymbol[botSymbolMissID].size > 0) {
                                                    missTPDataBySymbol[botSymbolMissID].gongLai = true
                                                    updatePositionBE({
                                                        newDataUpdate: {
                                                            Miss: true,
                                                            TimeUpdated: new Date()
                                                        },
                                                        orderID: missTPDataBySymbol[botSymbolMissID].orderIDToDB
                                                    }).then(message => {
                                                        console.log(message);
                                                    }).catch(err => {
                                                        console.log("ERROR updatePositionBE:", err)
                                                    })
                                                    // resetMissData({
                                                    //     botID,
                                                    //     symbol,
                                                    // })
                                                }

                                            }
                                            else if (OCTrue) {
                                                // allStrategiesByBotIDOrderOC[botID][symbol].totalOC -= 1

                                                console.log(`[-] Cancelled OC ( ${botName} - ${strategy.PositionSide === "Long" ? "Sell" : "Buy"} - ${symbol} - ${strategy.Candlestick}) `);

                                                delete listOCByCandleBot[strategy.Candlestick]?.[botID]?.listOC?.[strategyID]
                                                cancelAll({ botID, strategyID })
                                            }

                                        }
                                    }
                                }

                                else if (topicMain === "position") {

                                    const size = Math.abs(dataMain.size)


                                    !missTPDataBySymbol[botSymbolMissID] && resetMissData({ botID, symbol })

                                    missTPDataBySymbol[botSymbolMissID].sizeTotal = size

                                    if (size > 0) {
                                        missTPDataBySymbol[botSymbolMissID]?.timeOutFunc && clearTimeout(missTPDataBySymbol[botSymbolMissID].timeOutFunc)
                                        missTPDataBySymbol[botSymbolMissID].timeOutFunc = setTimeout(async () => {

                                            const symbol = dataMain.symbol
                                            const side = dataMain.side
                                            const openTrade = +dataMain.entryPrice;  //Gia khop lenh

                                            const size = Math.abs(dataMain.size)

                                            missTPDataBySymbol[botSymbolMissID].sizeTotal = size

                                            const missSize = size - missTPDataBySymbol[botSymbolMissID].size

                                            const Quantity = side === "Buy" ? size : (size * -1)

                                            if (!missTPDataBySymbol[botSymbolMissID]?.orderIDToDB) {

                                                const newDataToDB = {
                                                    Symbol: symbol,
                                                    Side: side,
                                                    Quantity,
                                                    Price: openTrade,
                                                    Pnl: dataMain.unrealisedPnl,
                                                }

                                                console.log(`\n[Saving->Mongo] Position When Check Miss ( ${botName} - ${side} - ${symbol} )`);

                                                await createPositionBE({
                                                    ...newDataToDB,
                                                    botID,
                                                }).then(async data => {
                                                    console.log(data.message);

                                                    const newID = data.id

                                                    !missTPDataBySymbol[botSymbolMissID] && resetMissData({ botID, symbol })

                                                    if (newID) {
                                                        missTPDataBySymbol[botSymbolMissID].orderIDToDB = newID
                                                    }
                                                    else {
                                                        await getPositionBySymbol({ symbol, botID }).then(data => {
                                                            console.log(data.message);
                                                            missTPDataBySymbol[botSymbolMissID].orderIDToDB = data.id
                                                        }).catch(error => {
                                                            console.log("ERROR getPositionBySymbol:", error)
                                                        })
                                                    }

                                                }).catch(err => {
                                                    console.log("ERROR createPositionBE:", err)
                                                })
                                            }

                                            if (!missTPDataBySymbol[botSymbolMissID]?.gongLai) {
                                                if (missSize > 0) {


                                                    const teleText = `<b>⚠️ [ MISS ] | ${symbol.replace("USDT", "")}</b> - ${side} - Bot: ${botName} - PnL: ${dataMain.unrealisedPnl} \n`
                                                    console.log(changeColorConsole.redBright(`\n${teleText.slice(5)}\n`));

                                                    // const TPNew = missTPDataBySymbol[botSymbolMissID].priceOrderTP
                                                    let TPNew = openTrade

                                                    if (side === "Buy") {
                                                        TPNew = openTrade + (openTrade * 3 / 100) * (50 / 100)
                                                    }
                                                    else {
                                                        TPNew = openTrade - (openTrade * 3 / 100) * (50 / 100)
                                                    }

                                                    missTPDataBySymbol[botSymbolMissID].prePrice = TPNew
                                                    missTPDataBySymbol[botSymbolMissID].side = side



                                                    // const dataInput = {
                                                    //     symbol,
                                                    //     qty: missSize.toString(),
                                                    //     price: roundPrice({
                                                    //         price: TPNew,
                                                    //         tickSize: digitAllCoinObject[symbol]
                                                    //     }),
                                                    //     side: side === "Buy" ? "Sell" : "Buy",
                                                    //     ApiKey,
                                                    //     SecretKey,
                                                    //     missState: true,
                                                    //     botName,
                                                    //     botID,
                                                    // }

                                                    // console.log("[ Re-TP ] Order TP Miss");

                                                    // handleSubmitOrderTP(dataInput)

                                                    sendMessageWithRetry({
                                                        messageText: teleText,
                                                        telegramID,
                                                        telegramToken
                                                    })

                                                    updatePositionBE({
                                                        newDataUpdate: {
                                                            Miss: true
                                                        },
                                                        orderID: missTPDataBySymbol[botSymbolMissID].orderIDToDB
                                                    }).then(message => {
                                                        console.log(message);
                                                    }).catch(err => {
                                                        console.log("ERROR updatePositionBE:", err)
                                                    })


                                                }
                                                else {
                                                    // console.log(`[ NOT-MISS ] | ${symbol.replace("USDT", "")} - ${side} - Bot: ${botName}`);
                                                    // updatePositionBE({
                                                    //     newDataUpdate: {
                                                    //         Miss: false,
                                                    //         TimeUpdated: new Date()
                                                    //     },
                                                    //     orderID: missTPDataBySymbol[botSymbolMissID].orderIDToDB
                                                    // }).then(message => {
                                                    //     console.log(message);
                                                    // }).catch(err => {
                                                    //     console.log("ERROR updatePositionBE:", err)
                                                    // })
                                                }
                                            }
                                            else {
                                                console.log(changeColorConsole.redBright(`[ GongLai ] | ${symbol.replace("USDT", "")} - ${side} - Bot: ${botName} - PnL: ${dataMain.unrealisedPnl} \n`));

                                                // console.log("[...] Đang lọc OC MISS\n");


                                                // updatePositionBE({
                                                //     newDataUpdate: {
                                                //         Miss: true,
                                                //         TimeUpdated: new Date()
                                                //     },
                                                //     orderID: missTPDataBySymbol[botSymbolMissID].orderIDToDB
                                                // }).then(message => {
                                                //     console.log(message);
                                                // }).catch(err => {
                                                //     console.log("ERROR updatePositionBE:", err)
                                                // })
                                            }

                                        }, 3000)
                                    }
                                    else {
                                        missTPDataBySymbol[botSymbolMissID]?.timeOutFunc && clearTimeout(missTPDataBySymbol[botSymbolMissID].timeOutFunc)
                                    }
                                }

                                // User cancel vị thế ( Limit )
                                if (!orderID && (orderStatus === "New" || orderStatus === "Filled") && dataMain.orderType !== "Market") {

                                    console.log(`[...] User ( ${botName} ) Clicked Close Vị Thế (Limit) - ( ${symbol} )`)

                                    const botSymbolMissID = `${botID}-${symbol}`

                                    missTPDataBySymbol[botSymbolMissID]?.timeOutFunc && clearTimeout(missTPDataBySymbol[botSymbolMissID].timeOutFunc)

                                    // const listMiss = missTPDataBySymbol[botSymbolMissID]?.orderIDOfListTP

                                    // listMiss?.length > 0 && await handleCancelAllOrderTP({
                                    //     items: listMiss.map((orderIdTPData) => ({
                                    //         ApiKey,
                                    //         SecretKey,
                                    //         strategyID: orderIdTPData?.strategyID,
                                    //         symbol,
                                    //         side: dataMain.side,
                                    //         orderId: orderIdTPData?.orderID,
                                    //         botID,
                                    //         botName
                                    //     }))
                                    // })

                                    !missTPDataBySymbol[botSymbolMissID] && resetMissData({ botID, symbol })

                                    // missTPDataBySymbol[botSymbolMissID].orderIDOfListTP = []

                                    // missTPDataBySymbol[botSymbolMissID].orderIDOfListTP.push({
                                    //     orderID: dataMain.orderId,
                                    // })

                                    const newSize = Math.abs(dataMain.qty)

                                    missTPDataBySymbol[botSymbolMissID].size = newSize

                                    missTPDataBySymbol[botSymbolMissID].gongLai = false

                                }
                                // User cancel vị thế ( Market )
                                if (dataMain.orderType === "Market") {
                                    console.log(`[...] User ( ${botName} ) Clicked Close Vị Thế (Market) - ( ${symbol} )`)

                                    missTPDataBySymbol[botSymbolMissID]?.timeOutFunc && clearTimeout(missTPDataBySymbol[botSymbolMissID].timeOutFunc)


                                    if (missTPDataBySymbol[botSymbolMissID]?.orderIDToDB) {
                                        await deletePositionBE({
                                            orderID: missTPDataBySymbol[botSymbolMissID].orderIDToDB
                                        }).then(message => {
                                            console.log(message);
                                        }).catch(err => {
                                            console.log("ERROR deletePositionBE:", err)
                                        })
                                    }


                                    resetMissData({ botID, symbol })



                                }

                            }
                        }))

                    })

                    wsOrder.on('close', () => {
                        console.log('ơV] Connection order closed');
                        wsOrder.connectPrivate(LIST_ORDER, "linear")
                    });

                    wsOrder.on('reconnected', () => {
                        if (connectByBotError[botID]) {
                            const telegramID = botApiList[botID]?.telegramID
                            const telegramToken = botApiList[botID]?.telegramToken

                            const text = `🔰 ${botName} khôi phục kết nối thành công`
                            console.log(text);
                            console.log(`[V] Reconnected Bot ( ${botName} ) successful`)
                            connectByBotError[botID] = false
                            sendMessageWithRetry({
                                messageText: text,
                                telegramID,
                                telegramToken
                            })

                            ["1m", "3m", "5m", "15m"].forEach(candle => {
                                const listOCByBot = listOCByCandleBot?.[candle]?.[botID]
                                const listObject = listOCByBot?.listOC
                                listOCByBot && handleCancelAllOrderOC([listOCByBot])

                                listObject && Object.values(listObject).map(strategyData => {
                                    const strategyID = strategyData.strategyID
                                    cancelAll({ botID, strategyID })
                                    delete listOCByCandleBot[candle][botID].listOC[strategyID]
                                    console.log(`[V] RESET-Reconnected | ${strategyData.symbol.replace("USDT", "")} - ${strategyData.side} - ${strategyData.candle} - Bot: ${strategyData.botName}`);
                                })
                            });
                        }
                    });

                    wsOrder.on('error', (err) => {

                        if (!connectByBotError[botID]) {
                            const telegramID = botApiList[botID]?.telegramID
                            const telegramToken = botApiList[botID]?.telegramToken

                            const text = `🚫 [ Cảnh báo ] ${botName} đang bị gián đoạn kết nối`
                            console.log(text);
                            console.log(`[!] Connection bot ( ${botName} ) error`);
                            console.log(err);
                            connectByBotError[botID] = true
                            wsOrder.connectAll()

                            sendMessageWithRetry({
                                messageText: text,
                                telegramID,
                                telegramToken
                            })
                        }
                    });
                }).catch(err => {
                    console.log(`[V] Subscribe order ( ${botName} ) error:`, err)
                })



            }))
        }
    } catch (error) {
        console.log("[!] Error BotApi Socket:", error)
    }
}

const handleSocketListKline = async (listKlineInput) => {

    await wsSymbol.subscribeV5(listKlineInput, 'linear').then(() => {

        console.log("[V] Subscribe kline successful\n");

    }).catch(err => {
        console.log("[!] Subscribe kline error:", err)
    })

}


// ----------------------------------------------------------------------------------
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const checkConditionBot = (botData) => {
    return botData.botID?.Status === "Running" && botData.botID?.ApiKey && botData.botID?.SecretKey
}

const handleSocketAddNew = async (newData = [], showLog = true) => {
    if (showLog) {
        console.log("[...] Add New Strategies From Realtime", newData.length);
    }
    const newBotApiList = {}

    await Promise.allSettled(newData.map(async newStrategiesData => {

        if (checkConditionBot(newStrategiesData)) {

            delete newStrategiesData.TimeTemp

            const symbol = newStrategiesData.symbol

            const strategyID = newStrategiesData.value

            const botID = newStrategiesData.botID._id
            const botName = newStrategiesData.botID.botName
            const Candlestick = newStrategiesData.Candlestick.split("m")[0]

            const ApiKey = newStrategiesData.botID.ApiKey
            const SecretKey = newStrategiesData.botID.SecretKey


            if (!botApiList[botID]) {
                botApiList[botID] = {
                    id: botID,
                    botName,
                    ApiKey,
                    SecretKey,
                    telegramID: newStrategiesData.botID.telegramID,
                    telegramToken: newStrategiesData.botID.telegramToken,
                    IsActive: true
                }
                newBotApiList[botID] = {
                    id: botID,
                    botName,
                    ApiKey,
                    SecretKey,
                    telegramID: newStrategiesData.botID.telegramID,
                    telegramToken: newStrategiesData.botID.telegramToken,
                    IsActive: true
                }


            }



            !allStrategiesByCandleAndSymbol[symbol] && (allStrategiesByCandleAndSymbol[symbol] = {});
            !allStrategiesByCandleAndSymbol[symbol][Candlestick] && (allStrategiesByCandleAndSymbol[symbol][Candlestick] = {});
            allStrategiesByCandleAndSymbol[symbol][Candlestick][strategyID] = newStrategiesData;

            cancelAll({ strategyID, botID })

        }

    }))

    await handleSocketBotApiList(newBotApiList,showLog)
}
const handleSocketUpdate = async (newData = [], showLog = true) => {

    if (showLog) {
        console.log("[...] Update Strategies From Realtime", newData.length);
    }

    const newBotApiList = {}

    const listOrderOC = {}
    const listOrderTP = []

    await Promise.allSettled(newData.map((strategiesData) => {

        if (checkConditionBot(strategiesData)) {

            const ApiKey = strategiesData.botID.ApiKey
            const SecretKey = strategiesData.botID.SecretKey
            const botID = strategiesData.botID._id
            const botName = strategiesData.botID.botName

            const symbol = strategiesData.symbol
            const strategyID = strategiesData.value
            const IsActive = strategiesData.IsActive
            const CandlestickMain = strategiesData.Candlestick
            const Candlestick = strategiesData.Candlestick.split("m")[0]

            blockContinueOrderOCByStrategiesID[strategyID] = false

            const side = strategiesData.PositionSide === "Long" ? "Buy" : "Sell"


            !allStrategiesByCandleAndSymbol[symbol] && (allStrategiesByCandleAndSymbol[symbol] = {});
            !allStrategiesByCandleAndSymbol[symbol][Candlestick] && (allStrategiesByCandleAndSymbol[symbol][Candlestick] = {});
            allStrategiesByCandleAndSymbol[symbol][Candlestick][strategyID] = strategiesData
            allStrategiesByCandleAndSymbol[symbol][Candlestick][strategyID].OrderChangeOld = strategiesData.OrderChange


            !allStrategiesByBotIDAndOrderID[botID] && (allStrategiesByBotIDAndOrderID[botID] = {});
            !allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID] && cancelAll({ botID, strategyID });


            if (IsActive) {
                if (!botApiList[botID]) {
                    botApiList[botID] = {
                        id: botID,
                        botName,
                        ApiKey,
                        SecretKey,
                        telegramID: strategiesData.botID.telegramID,
                        telegramToken: strategiesData.botID.telegramToken,
                        IsActive: true
                    }

                    newBotApiList[botID] = {
                        id: botID,
                        botName,
                        ApiKey,
                        SecretKey,
                        telegramID: strategiesData.botID.telegramID,
                        telegramToken: strategiesData.botID.telegramToken,
                        IsActive: true
                    }


                }
            }


            const cancelDataObject = {
                ApiKey,
                SecretKey,
                strategyID,
                symbol: symbol,
                candle: CandlestickMain,
                side,
                botName,
                botID
            }

            !listOrderOC[CandlestickMain] && (listOrderOC[CandlestickMain] = {});
            !listOrderOC[CandlestickMain][botID] && (listOrderOC[CandlestickMain][botID] = {});
            !listOrderOC[CandlestickMain][botID].listOC && (listOrderOC[CandlestickMain][botID] = {
                listOC: {},
                ApiKey,
                SecretKey,
            });

            allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderLinkId && (listOrderOC[CandlestickMain][botID].listOC[strategyID] = {
                strategyID,
                candle: CandlestickMain,
                symbol,
                side,
                botName,
                botID,
                orderLinkId: allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderLinkId
            });

            if (!strategiesData.IsActive) {

                allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.TP?.orderID && listOrderTP.push({
                    ...cancelDataObject,
                    orderId: allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.TP?.orderID,
                    gongLai: true
                })


            }

        }

    }))


    const cancelAllOC = cancelAllListOrderOC(listOrderOC)

    const cancelAllTP = handleCancelAllOrderTP({
        items: listOrderTP
    })

    await Promise.allSettled([cancelAllOC, cancelAllTP])

    await handleSocketBotApiList(newBotApiList, showLog)
}
const handleSocketDelete = async (newData = []) => {

    console.log("[...] Deleted Strategies From Realtime", newData.length);

    const listOrderOC = {}
    const listOrderTP = []

    await Promise.allSettled(newData.map((strategiesData) => {
        if (checkConditionBot(strategiesData)) {

            const ApiKey = strategiesData.botID.ApiKey
            const SecretKey = strategiesData.botID.SecretKey

            const symbol = strategiesData.symbol
            const strategyID = strategiesData.value
            const botID = strategiesData.botID._id
            const botName = strategiesData.botID.botName
            const CandlestickMain = strategiesData.Candlestick
            const Candlestick = strategiesData.Candlestick.split("m")[0]
            const scannerID = strategiesData.scannerID

            const side = strategiesData.PositionSide === "Long" ? "Buy" : "Sell"


            const cancelDataObject = {
                ApiKey,
                SecretKey,
                strategyID,
                symbol: symbol,
                candle: CandlestickMain,
                side,
                botName,
                botID
            }

            !listOrderOC[CandlestickMain] && (listOrderOC[CandlestickMain] = {});
            !listOrderOC[CandlestickMain][botID] && (listOrderOC[CandlestickMain][botID] = {});
            !listOrderOC[CandlestickMain][botID].listOC && (listOrderOC[CandlestickMain][botID] = {
                listOC: {},
                ApiKey,
                SecretKey,
            });
            allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderLinkId && (listOrderOC[CandlestickMain][botID].listOC[strategyID] = {
                strategyID,
                candle: CandlestickMain,
                symbol,
                side,
                botName,
                botID,
                orderLinkId: allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderLinkId
            });

            allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.TP?.orderID && listOrderTP.push({
                ...cancelDataObject,
                orderId: allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.TP?.orderID,
                gongLai: true
            })

            delete allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]
            delete allStrategiesByCandleAndSymbol[symbol]?.[Candlestick]?.[strategyID]
            scannerID && delete listConfigIDByScanner[scannerID]?.[symbol]
        }
    }))

    const cancelAllOC = cancelAllListOrderOC(listOrderOC)

    const cancelAllTP = handleCancelAllOrderTP({
        items: listOrderTP
    })

    await Promise.allSettled([cancelAllOC, cancelAllTP])
}

// ------------------------------ SCANNER ----------------------------------------------------


var allHistoryByCandleSymbol = {}

const roundNumber = (number) => {
    return Math.round(number * 10000) / 100
}



async function TimeS0(interval) {
    let TimeStart = ""
    await clientPublic.getKline({
        category: 'linear',
        symbol: "BTCUSDT",
        interval,
    })
        .then((response) => {
            TimeStart = Math.abs(response.result.list[0][0])
        })
        .catch((error) => {
            console.error(error);
        });
    return TimeStart
}

const sortListReverse = (arr) => {
    return [...arr].sort((a, b) => Math.abs(b.OC) - Math.abs(a.OC))
}

const history = async ({
    symbol,
    OpenTime,
    limitNen = 100,
    interval
}) => {

    const TimeStart = OpenTime - limitNen * 60000 * interval
    const TimeSop = OpenTime - 60000 * interval

    await clientPublic.getKline({
        category: 'linear',
        symbol,
        interval,
        start: TimeStart,
        end: TimeSop,
        limit: interval != 15 ? limitNen : 900,
    })
        .then((response) => {
            const listOC = [];
            const listOCLong = [];
            const listOCLongShort = [];

            const listAllData = response?.result?.list

            if (listAllData?.length > 0) {

                for (let i = 0; i <= limitNen - 2; i++) {
                    const dataCoin = listAllData?.[i]
                    const dataCoinPre = listAllData?.[i + 1]

                    if (dataCoin && dataCoinPre) {
                        const Open = +dataCoin[1]
                        const Highest = +dataCoin[2]
                        const Lowest = +dataCoin[3]
                        const Close = +dataCoin[4]

                        const OpenPre = +dataCoinPre[1]
                        const HighestPre = +dataCoinPre[2]
                        const LowestPre = +dataCoinPre[3]
                        const ClosePre = +dataCoinPre[4]


                        if (i == 0) {
                            const startTime = new Date(+dataCoin[0]).toLocaleString("vi-vn")

                            let TP = Math.abs((Highest - Close) / (Highest - Open)) || 0
                            let TPLong = Math.abs(Close - Lowest) / (Open - Lowest) || 0

                            if (TP == "Infinity") {
                                TP = 0
                            }
                            if (TPLong == "Infinity") {
                                TPLong = 0
                            }

                            const dataCoinHandle = {
                                open: Open,
                                close: Close,
                                high: Highest,
                                low: Lowest,
                            }
                            const OCData = {
                                OC: roundNumber((Highest - Open) / Open),
                                TP: roundNumber(TP),
                                startTime,
                                dataCoin: dataCoinHandle
                            }
                            const OCLongData = {
                                OC: roundNumber((Lowest - Open) / Open),
                                TP: roundNumber(TPLong),
                                startTime,
                                dataCoin: dataCoinHandle
                            }
                            listOC.push(OCData)
                            listOCLong.push(OCLongData)
                            listOCLongShort.push(OCData, OCLongData)
                        }
                        const startTime = new Date(+dataCoinPre[0]).toLocaleString("vi-vn")

                        let TP = Math.abs((HighestPre - ClosePre) / (HighestPre - OpenPre)) || 0
                        let TPLong = Math.abs(ClosePre - LowestPre) / (OpenPre - LowestPre) || 0

                        if (Lowest < Open) {
                            TP = Math.abs((Lowest - HighestPre) / (HighestPre - OpenPre)) || 0
                        }
                        if (Highest > Open) {
                            TPLong = Math.abs((Highest - LowestPre) / (LowestPre - OpenPre)) || 0
                        }

                        if (TP == "Infinity") {
                            TP = 0
                        }
                        if (TPLong == "Infinity") {
                            TPLong = 0
                        }

                        const dataCoinHandle = {
                            open: OpenPre,
                            close: ClosePre,
                            high: HighestPre,
                            low: LowestPre,
                        }
                        const OCData = {
                            OC: roundNumber((HighestPre - OpenPre) / OpenPre),
                            TP: roundNumber(TP),
                            startTime,
                            dataCoin: dataCoinHandle
                        }
                        const OCLongData = {

                            OC: roundNumber((LowestPre - OpenPre) / OpenPre),
                            TP: roundNumber(TPLong),
                            startTime,
                            dataCoin: dataCoinHandle
                        }
                        listOC.push(OCData)
                        listOCLong.push(OCLongData)
                        listOCLongShort.push(OCData, OCLongData)

                    }
                }

                allHistoryByCandleSymbol[interval] = allHistoryByCandleSymbol[interval] || {}

                allHistoryByCandleSymbol[interval][symbol] = {
                    listOC,
                    listOCLong,
                    listOCLongShort
                }
            }


        })
        .catch((error) => {
            console.error(`[!] Error get history ( ${symbol} - ${interval} )`, error);
        });
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function getHistoryAllCoin({ coinList, limitNen, interval, OpenTime }) {
    console.log(`[...] Processing history candle ( ${interval}m )`);

    let index = 0
    const batchSize = 200
    while (index < coinList.length) {
        const batch = coinList.slice(index, index + batchSize)

        await Promise.allSettled(batch.map(async coin => {
            await history({
                OpenTime,
                limitNen,
                symbol: coin.value,
                interval
            });
        }))
        await delay(1000);
        index += batchSize
    }

    console.log(`[V] Process history candle ( ${interval}m ) finished`);

}

const handleStatistic = async (coinList = Object.values(allSymbol)) => {
    for (const interval of [1, 3, 5, 15]) {
        const OpenTime = await TimeS0(interval);
        await getHistoryAllCoin({
            coinList,
            limitNen,
            interval,
            OpenTime
        });
        await delay(1000);
    }

}

// ---
const handleScannerDataList = async ({
    candle,
    symbol,
}) => {

    // console.log(changeColorConsole.cyanBright(`[...] Handle history scanner ( ${symbol} - ${candle}m )`));

    const allScannerData = allScannerDataObject[candle]?.[symbol]

    allScannerData && Object.values(allScannerData)?.length > 0 && await Promise.allSettled(Object.values(allScannerData).map(async scannerData => {
        try {

            scannerData.OCLength = Math.abs(scannerData.OCLength)
            scannerData.OrderChange = Math.abs(scannerData.OrderChange)
            scannerData.TP = Math.abs(scannerData.TP)
            scannerData.Adjust = Math.abs(scannerData.Adjust)
            scannerData.Amount = Math.abs(scannerData.Amount)
            scannerData.Expire = Math.abs(scannerData.Expire)
            scannerData.Limit = Math.abs(scannerData.Limit)
            scannerData.Turnover = Math.abs(scannerData.Turnover)

            const scannerID = scannerData._id
            const botData = scannerData.botID
            const botID = botData._id
            const Candlestick = scannerData.Candle
            const PositionSide = scannerData.PositionSide
            const Expire = Math.abs(scannerData.Expire)
            const CandlestickOnlyNumber = scannerData.Candle.split("m")[0]
            const botName = botApiList[botID]?.botName || botData.botName

            const allHistory = allHistoryByCandleSymbol[CandlestickOnlyNumber]?.[symbol]
            if (scannerData.IsActive && botApiList[botID]?.IsActive && allHistory) {

                const FrameMain = scannerData.Frame
                const checkTimeFrameHour = FrameMain.includes("h")
                const Frame = checkTimeFrameHour ? FrameMain.split("h") : FrameMain.split("D")

                const TimeHandle = checkTimeFrameHour ? 60 : 24 * 60

                const candleQty = Math.round(Frame[0] * TimeHandle / 15)

                const allHistory15 = allHistoryByCandleSymbol["15"][symbol]

                let allHistoryList = []
                let OCLengthCheck = false
                let conditionLongShort = 1

                switch (PositionSide) {
                    case "Long":
                        allHistoryList = allHistory.listOCLong
                        OCLengthCheck = allHistory15.listOCLong.slice(0, candleQty).some(item => Math.abs(item.OC) >= Math.abs(scannerData.OCLength))
                        break;
                    case "Short":
                        allHistoryList = allHistory.listOC
                        OCLengthCheck = allHistory15.listOC.slice(0, candleQty).some(item => Math.abs(item.OC) >= Math.abs(scannerData.OCLength))
                        break;
                    case "Long-Short":
                        allHistoryList = allHistory.listOCLongShort
                        const conditionOCLength = Math.abs(scannerData.OCLength)
                        OCLengthCheck = allHistory15.listOCLongShort.slice(0, candleQty * 2).some(item => Math.abs(item.OC) >= conditionOCLength || Math.abs(item.OCLength) >= conditionOCLength)
                        conditionLongShort = 2
                        break
                }

                const allHistoryListLimit50 = allHistoryList.slice(0, limitNen * conditionLongShort)

                // Check expire 
                if (Expire && (new Date() - scannerData.ExpirePre) >= Expire * 60 * 60 * 1000) {
                    // console.log(changeColorConsole.magentaBright(`[V] Scanner ( ${botName} - ${symbol} - ${PositionSide} - ${Candlestick} ) expire`));

                    // Delete all config
                    const listOCObject = listOCByCandleBot?.[Candlestick]?.[botID]?.listOC || {}

                    const checkListOC = listOCObject && Object.values(listOCObject).filter(OCData => {
                        return OCData.symbol === symbol && scannerID == OCData.scannerID
                    })

                    const listConfigIDByScannerData = listConfigIDByScanner[scannerID]?.[symbol]

                    if (listConfigIDByScannerData?.length > 0 && !checkListOC?.length) {
                        const deleteResSuccess = await deleteStrategiesMultipleStrategyBE({
                            botName,
                            Candlestick,
                            PositionSide,
                            scannerID,
                            symbol
                        })
                        if (deleteResSuccess) {
                            delete listConfigIDByScanner[scannerID]?.[symbol]
                            await handleSocketDelete(listConfigIDByScannerData)

                        }
                    }
                    allScannerDataObject[candle][symbol][scannerID].ExpirePre = new Date()
                }

                if (OCLengthCheck && Math.abs(allSymbol[symbol].volume24h || 0) >= Math.abs(scannerData.Turnover)) {

                    const LongestQty = Math.round(allHistoryListLimit50.length * scannerData.Longest / 100)
                    const RatioQty = Math.round(LongestQty * scannerData.Ratio / 100)
                    const Elastic = Math.abs(scannerData.Elastic)
                    const Adjust = Math.abs(scannerData.Adjust)

                    // console.log("allHistoryListLimit50", allHistoryListLimit50.slice(0, 4), symbol, candle);

                    const allHistoryListSort = sortListReverse(allHistoryListLimit50)

                    // // remove top max 
                    // allHistoryListSort.shift()

                    const allHistoryListSlice = allHistoryListSort.slice(0, LongestQty).filter(allHistory => Math.abs(allHistory.TP) >= Elastic)

                    const allHistoryListLongestTop3 = allHistoryListSort.slice(0, 3)

                    // console.log("allHistoryListSlice", allHistoryListSlice, allHistoryListSlice.length);

                    if (allHistoryListSlice.length >= RatioQty / conditionLongShort) {

                        const OCTotal = allHistoryListLongestTop3.reduce((pre, cur) => {
                            return pre + Math.abs(cur.OC)
                        }, 0)

                        const OCAvg = Math.abs((OCTotal / allHistoryListLongestTop3.length).toFixed(3))

                        // console.log("OCAvg", OCAvg, symbol, candle,PositionSide);

                        if (OCAvg >= Math.abs(scannerData.OrderChange)) {

                            const newOC = Math.abs((OCAvg * Adjust).toFixed(3))
                            const OCAdjust = `${OCAvg} x ${Adjust}`

                            const listConfigIDByScannerData = listConfigIDByScanner[scannerID]?.[symbol]
                            if (listConfigIDByScannerData?.length > 0) {
                                const res = await updateStrategiesMultipleStrategyBE({
                                    scannerID,
                                    newOC,
                                    Candlestick,
                                    botName,
                                    symbol,
                                    PositionSide,
                                    OCAdjust,
                                })

                                if (res.success) {
                                    // console.log(changeColorConsole.cyanBright("\n", res.message));
                                    await handleSocketUpdate(listConfigIDByScannerData.map(item => {
                                        item.OrderChange = newOC
                                        return item
                                    }), false)
                                }
                            } else {
                                const res = await createStrategiesMultipleStrategyBE({
                                    botID,
                                    botName,
                                    symbol,
                                    scannerID,
                                    OCAdjust,
                                    dataInput: {
                                        PositionSide,
                                        Amount: scannerData.Amount,
                                        OrderChange: newOC,
                                        Candlestick,
                                        TakeProfit: scannerData.TP || 40,
                                        ReduceTakeProfit: 45,
                                        ExtendedOCPercent: 80,
                                        Ignore: 85,
                                        EntryTrailing: 30,
                                        StopLose: 50,
                                        IsActive: true,
                                    },
                                })


                                const newData = res.data

                                if (newData.length > 0) {
                                    console.log(changeColorConsole.cyanBright("\n", res.message));
                                    listConfigIDByScanner[scannerID] = listConfigIDByScanner[scannerID] || {}
                                    listConfigIDByScanner[scannerID][symbol] = newData

                                    await handleSocketAddNew(newData, false)
                                }
                            }

                        }
                    }
                }
            }
        } catch (error) {
            console.log("[!] Error Scanner:", error);
        }
    }))
}

const syncVol24 = async () => {

    const syncSymbolBEAll = await syncSymbolBE()
    const listSymbolUpdate = syncSymbolBEAll || []
    listSymbolUpdate.forEach(symbolData => {
        allSymbol[symbolData.value] = symbolData
    })
    console.log("[V] Sync volume 24h all symbol");
}


// ----------------------------------------------------------------------------------

const Main = async () => {


    const allStrategiesActiveBE = getAllStrategiesActive()
    const allSymbolBE = getAllSymbolBE()
    const getAllConfigScanner = getAllStrategiesActiveScannerV3BE()
    const deleteAll = deleteAllScannerBE()
    const deleteAllUPcode = deleteAllForUPcode()

    const result = await Promise.allSettled([allStrategiesActiveBE, allSymbolBE, getAllConfigScanner, deleteAll, deleteAllUPcode])

    const allStrategiesActiveObject = result[0].value || []
    const allSymbolArray = result[1].value || []
    const getAllConfigScannerRes = result[2].value || []

    allStrategiesActiveObject.forEach(strategyItem => {
        if (checkConditionBot(strategyItem)) {

            const strategyID = strategyItem.value
            const botID = strategyItem.botID._id
            const botName = strategyItem.botID.botName
            const symbol = strategyItem.symbol
            const Candlestick = strategyItem.Candlestick.split("m")[0]

            botApiList[botID] = {
                id: botID,
                botName,
                ApiKey: strategyItem.botID.ApiKey,
                SecretKey: strategyItem.botID.SecretKey,
                telegramID: strategyItem.botID.telegramID,
                telegramToken: strategyItem.botID.telegramToken,
                IsActive: true
            }

            !allStrategiesByCandleAndSymbol[symbol] && (allStrategiesByCandleAndSymbol[symbol] = {});
            !allStrategiesByCandleAndSymbol[symbol][Candlestick] && (allStrategiesByCandleAndSymbol[symbol][Candlestick] = {});
            allStrategiesByCandleAndSymbol[symbol][Candlestick][strategyID] = strategyItem;

            cancelAll({ strategyID, botID })

        }
    })


    allSymbolArray.forEach(item => {
        const symbol = item.value
        const listKlineNumber = [1, 3, 5, 15]
        listKlineNumber.forEach(candle => {
            const symbolCandleID = `${symbol}-${candle}`
            listKline.push(`kline.${candle}.${symbol}`)
            allSymbol[symbol] = item
            listPricePreOne[symbolCandleID] = {
                open: 0,
                close: 0,
                high: 0,
                low: 0,
            }
            trichMauOCListObject[symbolCandleID] = {
                maxPrice: 0,
                minPrice: [],
                prePrice: 0,
                coinColor: [],
                curTime: 0,
                preTime: 0,
            }
            trichMauTPListObject[symbolCandleID] = {
                maxPrice: 0,
                minPrice: [],
                prePrice: 0,
            }

        })
        getAllConfigScannerRes.forEach(scannerData => {
            const scannerID = scannerData._id
            const setBlacklist = new Set(scannerData.Blacklist)
            const setOnlyPairs = new Set(scannerData.OnlyPairs)
            if (checkConditionBot(scannerData) && setOnlyPairs.has(symbol) && !setBlacklist.has(symbol)) {

                const botID = scannerData.botID._id
                const botName = scannerData.botID.botName

                botApiList[botID] = {
                    id: botID,
                    botName,
                    ApiKey: scannerData.botID.ApiKey,
                    SecretKey: scannerData.botID.SecretKey,
                    telegramID: scannerData.botID.telegramID,
                    telegramToken: scannerData.botID.telegramToken,
                    IsActive: true
                };

                const candleHandle = scannerData.Candle.split("m")[0]

                allScannerDataObject[candleHandle] = allScannerDataObject[candleHandle] || {}
                allScannerDataObject[candleHandle][symbol] = allScannerDataObject[candleHandle][symbol] || {}

                const newScannerData = scannerData.toObject()

                newScannerData.ExpirePre = new Date()

                allScannerDataObject[candleHandle][symbol][scannerID] = newScannerData
            }
        })
    });


    const resultDigitAll = await Digit()
    resultDigitAll?.length > 0 && (
        resultDigitAll.reduce((pre, cur) => {
            if (cur.symbol.includes("USDT")) {
                pre[cur.symbol] = cur.priceScale
            }
            return pre
        }, digitAllCoinObject)
    );

    await handleStatistic()

    await syncVol24()

    allSymbolArray.forEach(item => {
        const listKlineNumber = [1, 3, 5, 15]
        listKlineNumber.forEach(candle => {
            handleScannerDataList({ candle, symbol: item.value })
        })
    })


    await handleSocketBotApiList(botApiList)

    await handleSocketListKline(listKline)

}



try {
    Main()

    let cancelingAll = {};

    [1, 3, 5, 15].forEach(candleItem => {
        cancelingAll[candleItem] = {
            canceling: false,
        }
    });

    wsSymbol.on('update', async (dataCoin) => {


        const [_, candle, symbol] = dataCoin.topic.split(".");

        const symbolCandleID = `${symbol}-${candle}`

        const dataMain = dataCoin.data[0]
        const coinOpen = +dataMain.open;
        const coinCurrent = +dataMain.close;
        const dataConfirm = dataMain.confirm

        if (symbol === "BTCUSDT" && candle == 1) {
            const BTCPricePercent = Math.abs(coinCurrent - coinOpen) / coinOpen * 100

            if (BTCPricePercent >= 0.7) {

                const text = `<b>🛑 BTC đang biến động ${BTCPricePercent.toFixed(2)}% [1m]</b>`
                if (BTCPricePercent >= 1) {
                    const newNangOCValue = Math.round(BTCPricePercent - 0.3) * 5

                    if (newNangOCValue !== nangOCValue) {
                        nangOCValue = newNangOCValue
                        checkOrderOCAll = false
                        sendAllBotTelegram(text)

                    }
                }
                else if (0.7 <= BTCPricePercent && BTCPricePercent < 0.8) {
                    const newNangOCValue = 1

                    if (newNangOCValue !== nangOCValue) {
                        nangOCValue = newNangOCValue
                        checkOrderOCAll = false
                        sendAllBotTelegram(text)

                    }
                }
            }
            else {
                checkOrderOCAll = true
            }

        }

        const listDataObject = allStrategiesByCandleAndSymbol?.[symbol]?.[candle]

        if (checkOrderOCAll) {

            listDataObject && Object.values(listDataObject)?.length > 0 && await Promise.allSettled(Object.values(listDataObject).map(async strategy => {

                const botID = strategy.botID._id

                if (checkConditionBot(strategy) && botApiList[botID]?.IsActive) {

                    strategy.Amount = Math.abs(strategy.Amount)
                    strategy.OrderChange = Math.abs(strategy.OrderChange)
                    strategy.TakeProfit = Math.abs(strategy.TakeProfit)
                    strategy.ReduceTakeProfit = Math.abs(strategy.ReduceTakeProfit)
                    strategy.ExtendedOCPercent = Math.abs(strategy.ExtendedOCPercent)
                    strategy.Ignore = Math.abs(strategy.Ignore)
                    strategy.EntryTrailing = Math.abs(strategy.EntryTrailing)
                    strategy.StopLose = Math.abs(strategy.StopLose)

                    const strategyID = strategy.value

                    strategy.digit = digitAllCoinObject[strategy.symbol]

                    const botName = botApiList[botID]?.botName || strategy.botID.botName

                    const ApiKey = strategy.botID.ApiKey
                    const SecretKey = strategy.botID.SecretKey
                    const telegramID = strategy.botID.telegramID
                    const telegramToken = strategy.botID.telegramToken

                    const side = strategy.PositionSide === "Long" ? "Buy" : "Sell"

                    if (dataConfirm == false && strategy.IsActive && !updatingAllMain && !blockContinueOrderOCByStrategiesID[strategyID]) {

                        if (!allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderID && !allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.ordering) {

                            !trichMauTimePre[strategyID] && (trichMauTimePre[strategyID] = new Date())

                            if (new Date() - trichMauTimePre[strategyID] >= 150) {

                                const khoangGia = Math.abs(coinCurrent - trichMauOCListObject[symbolCandleID].prePrice)

                                // X-D-D || D-D-D

                                const coinColor = (coinCurrent - trichMauOCListObject[symbolCandleID].prePrice) > 0 ? "Blue" : "Red"

                                let checkColorListTrue = false

                                const coinColorPre = trichMauOCListObject[symbolCandleID].coinColor

                                if (coinColorPre.length > 0) {
                                    checkColorListTrue = coinColor === "Red"
                                }
                                else {
                                    checkColorListTrue = true
                                }

                                if (khoangGia > trichMauOCListObject[symbolCandleID].maxPrice) {
                                    trichMauOCListObject[symbolCandleID].maxPrice = khoangGia
                                    trichMauOCListObject[symbolCandleID].minPrice = []
                                    trichMauOCListObject[symbolCandleID].coinColor = []
                                }
                                else {
                                    if (khoangGia <= trichMauOCListObject[symbolCandleID].maxPrice / 4) {
                                        if (trichMauOCListObject[symbolCandleID].minPrice.length === 3) {
                                            trichMauOCListObject[symbolCandleID].minPrice.shift()
                                        }
                                        trichMauOCListObject[symbolCandleID].minPrice.push(coinColor)
                                    }
                                }

                                if (!checkColorListTrue) {
                                    trichMauOCListObject[symbolCandleID].coinColor = []
                                }
                                else {
                                    if (trichMauOCListObject[symbolCandleID].coinColor.length === 3) {
                                        trichMauOCListObject[symbolCandleID].coinColor.shift()
                                    }
                                    trichMauOCListObject[symbolCandleID].coinColor.push(coinColor)
                                }

                                trichMauOCListObject[symbolCandleID].prePrice = coinCurrent

                                trichMauTimePre[strategyID] = new Date()

                            }
                            if (true) {

                                // if (trichMauOCListObject[symbolCandleID].minPrice.length === 3) {

                                let conditionOrder = 0
                                let priceOrder = 0

                                // Check pre coin type 

                                let coinPreCoin = ""
                                let coinCurCoin = ""
                                let conditionPre = true

                                const pricePreData = listPricePreOne[symbolCandleID]
                                // if (pricePreData.close) {
                                if (pricePreData.close > pricePreData.open) {
                                    coinPreCoin = "Blue"
                                }
                                else {
                                    coinPreCoin = "Red"
                                }
                                const currentValue = coinCurrent - coinOpen
                                if (currentValue > 0) {
                                    coinCurCoin = "Blue"
                                }
                                else {
                                    coinCurCoin = "Red"
                                }
                                // }
                                // BUY
                                if (side === "Buy") {

                                    if (coinPreCoin === "Blue" && coinCurCoin === "Red") {
                                        const preValue = pricePreData.high - pricePreData.open
                                        conditionPre = Math.abs(currentValue) >= Math.abs((strategy.Ignore / 100) * preValue)
                                    }
                                    conditionOrder = coinOpen - coinOpen * (strategy.OrderChange / 100) * (strategy.ExtendedOCPercent / 100)
                                    priceOrder = (coinOpen - coinOpen * strategy.OrderChange / 100)

                                }
                                else {
                                    // SELL
                                    if (coinPreCoin === "Red" && coinCurCoin === "Blue") {
                                        const preValue = pricePreData.open - pricePreData.low
                                        conditionPre = Math.abs(currentValue) >= Math.abs((strategy.Ignore / 100) * preValue)
                                    }
                                    conditionOrder = coinOpen + coinOpen * (strategy.OrderChange / 100) * (strategy.ExtendedOCPercent / 100)
                                    priceOrder = (coinOpen + coinOpen * strategy.OrderChange / 100)

                                }

                                const qty = (botAmountListObject[botID] * strategy.Amount / 100 / +priceOrder).toFixed(0);

                                allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.priceOrder = +priceOrder;

                                const priceOC = roundPrice({
                                    price: priceOrder,
                                    tickSize: strategy.digit
                                })

                                const newOC = Math.abs((priceOC - coinOpen)) / coinOpen * 100

                                const MaxOC = strategy.OrderChange + strategy.OrderChange * strategy.StopLose / 100

                                let price2P = 0

                                if (side === "Buy") {
                                    const lowPrice1m = +dataMain.low;
                                    const price2Percent = lowPrice1m + lowPrice1m * 30 / 100;
                                    price2P = (price2Percent - lowPrice1m) / lowPrice1m;
                                }
                                else {
                                    const highPrice1m = +dataMain.high;
                                    const price2Percent = highPrice1m - highPrice1m * 30 / 100;
                                    price2P = (highPrice1m - price2Percent) / highPrice1m;

                                }

                                if (conditionPre && Math.abs(price2P) <= newOC && newOC <= Math.abs(MaxOC)) {

                                    const dataInput = {
                                        strategy,
                                        strategyID,
                                        ApiKey,
                                        SecretKey,
                                        symbol,
                                        qty,
                                        side,
                                        price: priceOC,
                                        candle: strategy.Candlestick,
                                        botName,
                                        botID,
                                        telegramID,
                                        telegramToken,
                                        coinOpen
                                    }


                                    if (side === "Buy") {
                                        (+conditionOrder) >= coinCurrent && coinOpen > coinCurrent && handleSubmitOrder(dataInput);
                                    }
                                    else {
                                        (+conditionOrder) <= coinCurrent && coinOpen < coinCurrent && handleSubmitOrder(dataInput);
                                    }
                                }

                            }



                        }
                        // } catch (error) {
                        //     console.log("ORDER OC:", error);
                        //     sendMessageWithRetry({
                        //         messageText: "ORDER OC ERROR: " + error,
                        //         telegramID,
                        //         telegramToken
                        //     })
                        // }

                        // Xem xét dịch OC
                        if (
                            allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderID &&
                            !allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderFilled &&
                            // !allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderFilledButMiss &&
                            !allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.moveAfterCompare
                        ) {

                            const coinOpen = allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.coinOpen

                            let checkMoveMain = false
                            const percentt = 2 / 100
                            const priceOrderOC = allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.priceOrder

                            if (side === "Buy") {
                                if (coinCurrent <= (priceOrderOC + Math.abs(priceOrderOC - coinOpen) * percentt)) {
                                    allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.moveAfterCompare = true
                                    checkMoveMain = true
                                }
                            }
                            else {
                                if (coinCurrent >= (priceOrderOC - Math.abs(priceOrderOC - coinOpen) * percentt)) {

                                    allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.moveAfterCompare = true
                                    checkMoveMain = true
                                }
                            }
                            if (checkMoveMain && !allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderFilled) {
                                const client = getRestClientV5Config({ ApiKey, SecretKey });

                                const newOCTemp = Math.abs((coinCurrent - coinOpen)) / coinOpen * 100

                                const priceMoveOC = roundPrice({
                                    price: coinCurrent,
                                    tickSize: strategy.digit
                                })
                                client
                                    .amendOrder({
                                        category: 'linear',
                                        symbol,
                                        price: priceMoveOC,
                                        orderId: allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.orderID
                                    })
                                    .then(async (response) => {
                                        if (response.retCode == 0) {
                                            allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.orderID = response.result.orderId
                                            console.log(changeColorConsole.blueBright(`[->] Move Order OC Compare ( ${botName} - ${side} - ${symbol} - ${candle} ) successful:`, priceMoveOC))
                                            // console.log(changeColorConsole.blackBright(`[_OC orderID Move_] ( ${botName} - ${side} - ${symbol} - ${candle} ) :`, response.result.orderId));

                                            const textQuayDau = `😃 Dịch OC ( ${strategy.OrderChange}% -> ${newOCTemp.toFixed(2)}% ) ( ${botName} - ${side} - ${symbol} - ${candle} ) `
                                            console.log(changeColorConsole.yellowBright(textQuayDau));
                                            // sendMessageWithRetry({
                                            //     messageText: textQuayDau,
                                            //     telegramID,
                                            //     telegramToken
                                            // })
                                            allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.moveAfterCompare = false
                                        }
                                        else {
                                            console.log(changeColorConsole.yellowBright(`[!] Move Order OC Compare ( ${botName} - ${side} - ${symbol} - ${candle} ) failed `, response.retMsg))
                                            // allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.orderFilledButMiss = true
                                        }
                                    })
                                    .catch((error) => {
                                        console.log(`[!] Move Order OC Compare ( ${botName} - ${side} - ${symbol} - ${candle} ) error `, error)
                                        // allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.orderFilledButMiss = true
                                    });


                            }
                        }

                        // if have TP
                        if (
                            allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.TP?.orderID &&
                            !allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.TP?.orderFilled &&
                            !allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.TP?.moveAfterCompare
                            // !allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.TP?.orderFilledButMiss
                        ) {
                            let checkMoveMain = false || allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.moveSuccess

                            if (!checkMoveMain) {
                                const PercentCheck = 2 / 100
                                const sideCheck = allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.side

                                const openTrade = allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.coinClose || allStrategiesByBotIDAndStrategiesID[botID][strategyID].OC.openTrade

                                !allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.minMaxTempPrice && (allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.minMaxTempPrice = coinCurrent);

                                let textQuanSat = ``
                                if (sideCheck === "Buy") {
                                    if ((coinCurrent < allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.priceCompare)) {
                                        textQuanSat = `🙈 Vào khoảng theo dõi ( ${botName} - ${side} - ${symbol} - ${candle} ) `
                                        console.log(changeColorConsole.cyanBright(textQuanSat));
                                        // sendMessageWithRetry({
                                        //     messageText: textQuanSat,
                                        //     telegramID,
                                        //     telegramToken
                                        // })
                                        if (coinCurrent > allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.minMaxTempPrice + Math.abs(openTrade - allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.minMaxTempPrice) * PercentCheck) {

                                            allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.moveAfterCompare = true
                                            allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.moveSuccess = true
                                            checkMoveMain = true
                                        }
                                    }
                                }
                                else {
                                    if ((coinCurrent > allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.priceCompare)) {
                                        textQuanSat = `🙈 Vào khoảng theo dõi ( ${botName} - ${side} - ${symbol} - ${candle} ) `
                                        console.log(changeColorConsole.cyanBright(textQuanSat));
                                        // sendMessageWithRetry({
                                        //     messageText: textQuanSat,
                                        //     telegramID,
                                        //     telegramToken
                                        // })
                                        if (coinCurrent < allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.minMaxTempPrice - Math.abs(openTrade - allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.minMaxTempPrice) * PercentCheck) {

                                            allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.moveAfterCompare = true
                                            allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.moveSuccess = true
                                            checkMoveMain = true
                                        }
                                    }
                                }
                                allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.minMaxTempPrice = coinCurrent

                            }
                            if (checkMoveMain && !allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.TP?.orderFilled) {

                                // console.log(changeColorConsole.cyanBright(`Price Move TP Compare ( ${botName} - ${side} - ${symbol} - ${candle} ):`, coinCurrent));
                                const priceMoveTP = roundPrice({
                                    price: coinCurrent,
                                    tickSize: strategy.digit
                                })
                                const client = getRestClientV5Config({ ApiKey, SecretKey });

                                client
                                    .amendOrder({
                                        category: 'linear',
                                        symbol,
                                        price: priceMoveTP,
                                        orderId: allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.orderID
                                    })
                                    .then(async (response) => {
                                        if (response.retCode == 0) {
                                            allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.orderID = response.result.orderId
                                            allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.price = coinCurrent
                                            console.log(changeColorConsole.blueBright(`[->] Move Order TP Compare ( ${botName} - ${side} - ${symbol} - ${candle} ) successful:`, priceMoveTP))
                                            const textQuayDau = `\n😎 Quay đầu ( ${botName} - ${side} - ${symbol} - ${candle} )\n`
                                            console.log(changeColorConsole.greenBright(textQuayDau));
                                            // sendMessageWithRetry({
                                            //     messageText: textQuayDau,
                                            //     telegramID,
                                            //     telegramToken
                                            // })
                                            allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.moveAfterCompare = false
                                        }
                                        else {
                                            console.log(changeColorConsole.yellowBright(`[!] Move Order TP Compare ( ${botName} - ${side} - ${symbol} - ${candle} ) failed `, response.retMsg))
                                            // allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.orderFilledButMiss = true
                                        }
                                    })
                                    .catch((error) => {
                                        console.log(`[!] Move Order TP Compare ( ${botName} - ${side} - ${symbol} - ${candle} ) error `, error)
                                        // allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.orderFilledButMiss = true
                                    });


                            }

                        }





                    }
                    // Coin CLosed
                    else if (dataConfirm == true) {

                        blockContinueOrderOCByStrategiesID[strategyID] = false

                        // TP chưa khớp -> Dịch TP mới

                        if (allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.TP.orderID) {

                            allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.coinClose = coinCurrent

                            let newPriceCompare = 0
                            const oldPriceCompare = allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.priceCompare
                            if (strategy.PositionSide === "Long") {
                                newPriceCompare = oldPriceCompare - Math.abs(oldPriceCompare - coinCurrent) * (strategy.ReduceTakeProfit / 100)
                            }
                            else {
                                newPriceCompare = oldPriceCompare + Math.abs(oldPriceCompare - coinCurrent) * (strategy.ReduceTakeProfit / 100)
                            }

                            allStrategiesByBotIDAndStrategiesID[botID][strategyID].TP.priceCompare = newPriceCompare


                            !allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID].TP.moveSuccess && handleMoveOrderTP({
                                ApiKey,
                                SecretKey,
                                strategyID,
                                strategy,
                                candle: strategy.Candlestick,
                                side,
                                coinOpen: coinCurrent,
                                botName,
                                botID
                            });
                        }

                    }

                }
            }))

            trichMauOCListObject[symbolCandleID].preTime = new Date()

        }

        else {
            console.log(changeColorConsole.greenBright(`[...] START NÂNG OC THÊM ${nangOCValue}`));

            updatingAllMain = true
            haOCFunc && clearTimeout(haOCFunc)


            const nangAllOC = Promise.allSettled(
                Object.values(allSymbol).map(async symbolItem => {
                    const symbol = symbolItem.value
                    return Promise.allSettled([1, 3, 5, 15].map(candle => {
                        const listDataObject = allStrategiesByCandleAndSymbol?.[symbol]?.[candle]
                        if (listDataObject && Object.values(listDataObject)?.length > 0) {
                            return Promise.allSettled(Object.values(listDataObject).map(async strategy => {
                                const strategyID = strategy.value
                                if (!allStrategiesByCandleAndSymbol[symbol][candle][strategyID].OrderChangeOld) {
                                    allStrategiesByCandleAndSymbol[symbol][candle][strategyID].OrderChangeOld = allStrategiesByCandleAndSymbol[symbol][candle][strategyID].OrderChange
                                }
                                allStrategiesByCandleAndSymbol[symbol][candle][strategyID].OrderChange = allStrategiesByCandleAndSymbol[symbol][candle][strategyID].OrderChangeOld + nangOCValue
                            }))
                        }
                    }))
                }
                ))

            const cancelAllOC = cancelAllListOrderOC(listOCByCandleBot)

            await Promise.allSettled([nangAllOC, cancelAllOC])

            console.log(changeColorConsole.greenBright("[V] NÂNG OC XONG"));

            checkOrderOCAll = true

            haOCFunc = setTimeout(async () => {
                console.log(changeColorConsole.greenBright("[...] START HẠ OC"));
                await Promise.allSettled(
                    Object.values(allSymbol).map(async symbolItem => {
                        const symbol = symbolItem.value
                        return Promise.allSettled([1, 3, 5, 15].map(candle => {
                            const listDataObject = allStrategiesByCandleAndSymbol?.[symbol]?.[candle]
                            if (listDataObject && Object.values(listDataObject)?.length > 0) {
                                return Promise.allSettled(Object.values(listDataObject).map(async strategy => {
                                    const strategyID = strategy.value

                                    allStrategiesByCandleAndSymbol[symbol][candle][strategyID].OrderChange = allStrategiesByCandleAndSymbol[symbol][candle][strategyID].OrderChangeOld

                                }))
                            }
                        }))
                    }
                    ))
                console.log(changeColorConsole.greenBright("[V] HẠ OC XONG"));

            }, 5 * 60 * 1000)

            updatingAllMain = false
        }

        // Coin CLosed
        if (dataConfirm == true) {

            const Open = coinOpen
            const Highest = +dataMain.high
            const Lowest = +dataMain.low
            const Close = coinCurrent

            listPricePreOne[symbolCandleID] = {
                open: Open,
                close: Close,
                high: Highest,
                low: Lowest,
            }

            if (!cancelingAll[candle].canceling) {

                cancelingAll[candle].canceling = true

                setTimeout(() => {
                    cancelingAll[candle].canceling = false
                }, 10 * 1000)

                console.log(`[V] Kline ( ${candle}m ) closed`);

                handleCancelAllOrderOC(Object.values(listOCByCandleBot[`${candle}m`] || {}))

            }

            trichMauOCListObject[symbolCandleID] = {
                maxPrice: 0,
                minPrice: [],
                prePrice: 0,
                coinColor: [],
                curTime: 0,
                preTime: 0,
            }

            // HANDLE SCANNER

            if (allHistoryByCandleSymbol[candle]?.[symbol]) {

                const startTime = new Date(+dataMain.start).toLocaleString("vi-vn")

                let TP = Math.abs((Highest - Close) / (Highest - Open)) || 0

                let TPLong = Math.abs(Close - Lowest) / (Open - Lowest) || 0

                const dataPre = allHistoryByCandleSymbol[candle][symbol].listOC[0].dataCoin
                const dataPreLong = allHistoryByCandleSymbol[candle][symbol].listOCLong[0].dataCoin
                let TPPre = dataPre.TP
                let TPLongPre = dataPreLong.TP

                if (Lowest < Open) {
                    const OpenPre = +dataPre.open
                    const HighestPre = +dataPre.high
                    TPPre = Math.abs((Lowest - HighestPre) / (HighestPre - OpenPre)) || 0
                }
                if (Highest > Open) {
                    const OpenPre = +dataPreLong.open
                    const LowestPre = +dataPreLong.low
                    TPLongPre = Math.abs((Highest - LowestPre) / (LowestPre - OpenPre)) || 0
                }

                if (TP == "Infinity") {
                    TP = 0
                }
                if (TPLong == "Infinity") {
                    TPLong = 0
                }
                if (TPPre == "Infinity") {
                    TPPre = 0
                }
                if (TPLongPre == "Infinity") {
                    TPLongPre = 0
                }

                allHistoryByCandleSymbol[candle][symbol].listOC[0].TP = roundNumber(TPPre)
                allHistoryByCandleSymbol[candle][symbol].listOCLong[0].TP = roundNumber(TPLongPre)

                const OCData = {
                    OC: roundNumber((Highest - Open) / Open),
                    TP: roundNumber(TP),
                    startTime,
                    dataCoin: dataMain
                }
                const OCLongData = {
                    OC: roundNumber((Lowest - Open) / Open),
                    TP: roundNumber(TPLong),
                    startTime,
                    dataCoin: dataMain
                }

                allHistoryByCandleSymbol[candle][symbol].listOC.pop()
                allHistoryByCandleSymbol[candle][symbol].listOC.unshift(OCData)

                allHistoryByCandleSymbol[candle][symbol].listOCLong.pop()
                allHistoryByCandleSymbol[candle][symbol].listOCLong.unshift(OCLongData)

                allHistoryByCandleSymbol[candle][symbol].listOCLongShort.pop()
                allHistoryByCandleSymbol[candle][symbol].listOCLongShort.pop()
                allHistoryByCandleSymbol[candle][symbol].listOCLongShort.unshift(OCData, OCLongData)

                handleScannerDataList({ candle, symbol })

            }
        }


    })

    wsSymbol.on('close', () => {
        console.log('[V] Connection listKline closed');
        wsSymbol.unsubscribeV5(listKline, "linear")
    });

    wsSymbol.on('reconnected', () => {
        if (connectKlineError) {
            const text = "🔰 Hệ thống khôi phục kết nối thành công"
            console.log(text);
            sendAllBotTelegram(text)
            console.log('[V] Reconnected kline successful')
            connectKlineError = false
        }
    });

    wsSymbol.on('error', (err) => {
        if (!connectKlineError) {
            const text = "🚫 [ Cảnh báo ] Hệ thống đang bị gián đoạn kết nối"
            console.log(text);
            sendAllBotTelegram(text)
            console.log('[!] Connection kline error');
            console.log(err);
            connectKlineError = true
            wsSymbol.connectAll()
        }
    });

    setTimeout(() => {
        cron.schedule('*/1 * * * *', () => {
            getMoneyFuture(botApiList)
        });
    }, 1000)

    // SYNC VOL  --------------------------------

    cron.schedule('0 */1 * * *', async () => {

        await syncVol24()

    });

}

catch (e) {
    console.log("Error Main:", e)
}


// REALTIME
const socket = require('socket.io-client');

const socketRealtime = socket(process.env.SOCKET_IP);

socketRealtime.on('connect', () => {
    console.log('\n[V] Connected Socket Realtime\n');
    socketRealtime.emit('joinRoom', 'ByBitV3');
});

socketRealtime.on('add', async (newData = []) => {
    await handleSocketAddNew(newData)

});

socketRealtime.on('update', async (newData = []) => {

    await handleSocketUpdate(newData)


});

socketRealtime.on('delete', async (newData) => {

    await handleSocketDelete(newData)


});


socketRealtime.on('bot-update', async (data = {}) => {
    const { newData, botIDMain, botActive } = data;

    const configData = newData.configData
    const scannerData = newData.scannerData

    const botNameExist = botApiList[botIDMain]?.botName || botIDMain
    console.log(`[...] Bot-Update ( ${botNameExist} ) Strategies From Realtime: \nConfig: ${configData.length} - Scanner: ${scannerData.length}`,);

    const newBotApiList = {}

    const botApiData = botApiList[botIDMain]

    const listOrderOC = {}
    const listOrderTP = []

    await Promise.allSettled(configData.map((strategiesData) => {

        const ApiKey = strategiesData.botID.ApiKey
        const SecretKey = strategiesData.botID.SecretKey
        const botID = strategiesData.botID._id
        const botName = strategiesData.botID.botName

        const symbol = strategiesData.symbol
        const strategyID = strategiesData.value
        const side = strategiesData.PositionSide === "Long" ? "Buy" : "Sell"
        const CandlestickMain = strategiesData.Candlestick
        const Candlestick = strategiesData.Candlestick.split("m")[0]

        blockContinueOrderOCByStrategiesID[strategyID] = false


        !allStrategiesByCandleAndSymbol[symbol] && (allStrategiesByCandleAndSymbol[symbol] = {});
        !allStrategiesByCandleAndSymbol[symbol][Candlestick] && (allStrategiesByCandleAndSymbol[symbol][Candlestick] = {});
        allStrategiesByCandleAndSymbol[symbol][Candlestick][strategyID] = strategiesData
        allStrategiesByCandleAndSymbol[symbol][Candlestick][strategyID].IsActive = false

        !allStrategiesByBotIDAndOrderID[botID] && (allStrategiesByBotIDAndOrderID[botID] = {});
        !allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID] && cancelAll({ botID, strategyID });

        if (!botApiList[botID]) {
            if (botActive) {

                newBotApiList[botID] = {
                    id: botID,
                    ApiKey,
                    SecretKey,
                    botName,
                    telegramID: strategiesData.botID.telegramID,
                    telegramToken: strategiesData.botID.telegramToken,
                    IsActive: true
                }
            }
        }
        botApiList[botID] = {
            id: botID,
            ApiKey,
            SecretKey,
            botName,
            telegramID: strategiesData.botID.telegramID,
            telegramToken: strategiesData.botID.telegramToken,
            IsActive: botActive
        }

        const cancelDataObject = {
            ApiKey,
            SecretKey,
            strategyID,
            symbol: symbol,
            candle: CandlestickMain,
            side,
            botName,
            botID
        }


        !listOrderOC[CandlestickMain] && (listOrderOC[CandlestickMain] = {});
        !listOrderOC[CandlestickMain][botID] && (listOrderOC[CandlestickMain][botID] = {});
        !listOrderOC[CandlestickMain][botID].listOC && (listOrderOC[CandlestickMain][botID] = {
            listOC: {},
            ApiKey,
            SecretKey,
        });

        allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderLinkId && (listOrderOC[CandlestickMain][botID].listOC[strategyID] = {
            strategyID,
            candle: CandlestickMain,
            symbol,
            side,
            botName,
            botID,
            orderLinkId: allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderLinkId
        });

        if (!botActive) {

            allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.TP?.orderID && listOrderTP.push({
                ...cancelDataObject,
                orderId: allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.TP?.orderID,
                gongLai: true
            })
        }

    }))

    scannerData.forEach(scannerItem => {
        const ApiKey = scannerItem.botID.ApiKey
        const SecretKey = scannerItem.botID.SecretKey
        const botID = scannerItem.botID._id
        const botName = scannerItem.botID.botName

        const OnlyPairs = scannerItem.OnlyPairs
        const Candlestick = scannerItem.Candle.split("m")[0]
        const scannerID = scannerItem._id

        if (!botApiList[botID]) {
            if (botActive) {

                newBotApiList[botID] = {
                    id: botID,
                    ApiKey,
                    SecretKey,
                    botName,
                    telegramID: scannerItem.botID.telegramID,
                    telegramToken: scannerItem.botID.telegramToken,
                    IsActive: true
                }
            }
        }
        botApiList[botID] = {
            id: botID,
            ApiKey,
            SecretKey,
            botName,
            telegramID: scannerItem.botID.telegramID,
            telegramToken: scannerItem.botID.telegramToken,
            IsActive: botActive
        }
        OnlyPairs.forEach(symbol => {
            delete allScannerDataObject[Candlestick]?.[symbol]?.[scannerID]
        })
    })

    const cancelAllOC = cancelAllListOrderOC(listOrderOC)

    const cancelAllTP = handleCancelAllOrderTP({
        items: listOrderTP
    })

    await Promise.allSettled([cancelAllOC, cancelAllTP])

    if (!botApiData) {
        await handleSocketBotApiList(newBotApiList)
    }

    else {

        if (!botActive) {
            ["1m", "3m", "5m", "15m"].forEach(candle => {
                const listOCByBot = listOCByCandleBot?.[candle]?.[botIDMain]
                const listObject = listOCByBot?.listOC
                listOCByBot && handleCancelAllOrderOC([listOCByBot])

                listObject && Object.values(listObject).map(strategyData => {
                    const strategyID = strategyData.strategyID
                    cancelAll({ botID: botIDMain, strategyID })
                    delete listOCByCandleBot[candle][botIDMain].listOC[strategyID]
                    console.log(`[V] RESET | ${strategyData.symbol.replace("USDT", "")} - ${strategyData.side} - ${strategyData.candle} - Bot: ${strategyData.botName}`);
                })
            });
        }
    }


});

// socketRealtime.on('bot-api', async (data) => {
//     const { newData, botID: botIDMain, newApiData } = data;

//     const botNameExist = botApiList[botIDMain]?.botName || botIDMain

//     console.log(`[...] Bot-Api ( ${botNameExist} ) Update Strategies From Realtime`, newData.length);

//     const listOrderOC = []
//     const listOrderTP = []

//     await Promise.allSettled(newData.map((strategiesData) => {

//         if (checkConditionBot(strategiesData)) {
//             const strategyID = strategiesData.value
//             const symbol = strategiesData.symbol
//             const ApiKey = strategiesData.botID.ApiKey
//             const SecretKey = strategiesData.botID.SecretKey
//             const botID = strategiesData.botID._id
//             const botName = strategiesData.botID.botName
//             const side = strategiesData.PositionSide === "Long" ? "Buy" : "Sell"
//             const CandlestickMain = strategiesData.Candlestick
//             const Candlestick = strategiesData.Candlestick.split("m")[0]


//             !allStrategiesByCandleAndSymbol[symbol] && (allStrategiesByCandleAndSymbol[symbol] = {});
//             !allStrategiesByCandleAndSymbol[symbol][Candlestick] && (allStrategiesByCandleAndSymbol[symbol][Candlestick] = {});
//             allStrategiesByCandleAndSymbol[symbol][Candlestick][strategyID] = strategiesData

//             const cancelDataObject = {
//                 ApiKey,
//                 SecretKey,
//                 strategyID,
//                 symbol: symbol,
//                 candle: CandlestickMain,
//                 side,
//                 botName,
//                 botID
//             }


//             !listOrderOC[CandlestickMain] && (listOrderOC[CandlestickMain] = {});
//             !listOrderOC[CandlestickMain][botID] && (listOrderOC[CandlestickMain][botID] = {});
//             !listOrderOC[CandlestickMain][botID].listOC && (listOrderOC[CandlestickMain][botID] = {
//                 listOC: {},
//                 ApiKey,
//                 SecretKey,
//             });
//             allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderLinkId && (listOrderOC[CandlestickMain][botID].listOC[strategyID] = {
//                 strategyID,
//                 candle: CandlestickMain,
//                 symbol,
//                 side,
//                 botName,
//                 botID,
//                 orderLinkId: allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderLinkId
//             });

//             allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.TP?.orderID && listOrderTP.push({
//                 ...cancelDataObject,
//                 orderId: allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.TP?.orderID,
//                 gongLai: true
//             })


//         }
//     }))

//     const cancelAllOC = cancelAllListOrderOC(listOrderOC)

//     const cancelAllTP = handleCancelAllOrderTP({
//         items: listOrderTP
//     })

//     await Promise.allSettled([cancelAllOC, cancelAllTP])

//     // 
//     try {
//         const botApiData = botApiList[botIDMain]
//         const ApiKeyBot = botApiData.ApiKey
//         const SecretKeyBot = botApiData.SecretKey


//         const wsConfigOrder = getWebsocketClientConfig({ ApiKey: ApiKeyBot, SecretKey: SecretKeyBot });

//         const wsOrder = new WebsocketClient(wsConfigOrder);

//         await wsOrder.unsubscribeV5(LIST_ORDER, 'linear')

//         botApiList[botIDMain] = {
//             ...botApiList[botIDMain],
//             ApiKey: newApiData.ApiKey,
//             SecretKey: newApiData.SecretKey,
//         }

//         const wsConfigOrderNew = getWebsocketClientConfig({ ApiKey: newApiData.ApiKey, SecretKey: newApiData.SecretKey });

//         const wsOrderNew = new WebsocketClient(wsConfigOrderNew);

//         await wsOrderNew.subscribeV5(LIST_ORDER, 'linear')

//     } catch (error) {
//         console.log("[!] Error subscribeV5", error)
//     }


// });

socketRealtime.on('bot-delete', async (data) => {
    const { newData, botID: botIDMain } = data;

    const botNameExist = botApiList[botIDMain]?.botName || botIDMain

    const configData = newData.configData
    const scannerData = newData.scannerData

    console.log(`[...] Bot-Deleted ( ${botNameExist} ) Strategies From Realtime: \nConfig: ${configData.length} - Scanner: ${scannerData.length}`,);

    const listOrderOC = []
    const listOrderTP = []
    const botApiData = botApiList[botIDMain]

    const ApiKeyBot = botApiData.ApiKey
    const SecretKeyBot = botApiData.SecretKey

    delete botApiList[botIDMain];


    await Promise.allSettled(configData.map(async (strategiesData) => {

        const ApiKey = strategiesData.botID.ApiKey
        const SecretKey = strategiesData.botID.SecretKey

        const symbol = strategiesData.symbol
        const strategyID = strategiesData.value
        const botID = strategiesData.botID._id
        const botName = strategiesData.botID.botName

        const side = strategiesData.PositionSide === "Long" ? "Buy" : "Sell"
        const CandlestickMain = strategiesData.Candlestick
        const Candlestick = strategiesData.Candlestick.split("m")[0]

        const cancelDataObject = {
            ApiKey,
            SecretKey,
            strategyID,
            symbol: symbol,
            candle: CandlestickMain,
            side,
            botName,
            botID
        }

        !listOrderOC[CandlestickMain] && (listOrderOC[CandlestickMain] = {});
        !listOrderOC[CandlestickMain][botID] && (listOrderOC[CandlestickMain][botID] = {});
        !listOrderOC[CandlestickMain][botID].listOC && (listOrderOC[CandlestickMain][botID] = {
            listOC: {},
            ApiKey,
            SecretKey,
        });
        allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderLinkId && (listOrderOC[CandlestickMain][botID].listOC[strategyID] = {
            strategyID,
            candle: CandlestickMain,
            symbol,
            side,
            botName,
            botID,
            orderLinkId: allStrategiesByBotIDAndStrategiesID?.[botID]?.[strategyID]?.OC?.orderLinkId
        })

        allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.TP?.orderID && listOrderTP.push({
            ...cancelDataObject,
            orderId: allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]?.TP?.orderID,
            gongLai: true
        })


        delete allStrategiesByBotIDAndStrategiesID[botID]?.[strategyID]
        delete allStrategiesByCandleAndSymbol[symbol]?.[Candlestick]?.[strategyID]

    }))

    scannerData.forEach(scannerItem => {

        const OnlyPairs = scannerItem.OnlyPairs
        const Candlestick = scannerItem.Candle.split("m")[0]
        const scannerID = scannerItem._id

        OnlyPairs.forEach(symbol => {
            delete allScannerDataObject[Candlestick]?.[symbol]?.[scannerID]
        })
    })

    const cancelAllOC = cancelAllListOrderOC(listOrderOC)

    const cancelAllTP = handleCancelAllOrderTP({
        items: listOrderTP
    })

    await Promise.allSettled([cancelAllOC, cancelAllTP])

    const wsOrder = getWebsocketClientConfig({ ApiKey: ApiKeyBot, SecretKey: SecretKeyBot });

    await wsOrder.unsubscribeV5(LIST_ORDER, 'linear')

    ["1m", "3m", "5m", "15m"].forEach(candle => {
        delete listOCByCandleBot?.[candle]?.[botIDMain]
    });


});

socketRealtime.on('bot-telegram', async (data) => {

    const { botID: botIDMain, newApiData } = data;

    const botNameExist = botApiList[botIDMain]?.botName || botIDMain

    console.log(`[...] Bot-Telegram ( ${botNameExist} ) Update From Realtime`);

    if (botApiList[botIDMain]) {
        botApiList[botIDMain] = {
            ...botApiList[botIDMain],
            telegramID: newApiData.telegramID,
            telegramToken: newApiData.telegramToken,
            botName: newApiData.botName,
        }
    }

});

socketRealtime.on('sync-symbol', async (newData) => {

    console.log("[...] Sync New Symbol");

    const newListKline = []

    const resultDigitAll = await Digit()
    resultDigitAll?.length > 0 && (
        resultDigitAll.reduce((pre, cur) => {
            if (cur.symbol.includes("USDT")) {
                pre[cur.symbol] = cur.priceScale
            }
            return pre
        }, digitAllCoinObject)
    );

    newData.forEach(item => {
        const symbol = item.value
        const listKline = [1, 3, 5, 15]
        listKline.forEach(candle => {
            const symbolCandleID = `${symbol}-${candle}`

            newListKline.push(`kline.${candle}.${symbol}`)

            allSymbol[symbol] = item

            listPricePreOne[symbolCandleID] = {
                open: 0,
                close: 0,
                high: 0,
                low: 0,
            }
            trichMauOCListObject[symbolCandleID] = {
                maxPrice: 0,
                minPrice: [],
                prePrice: 0,
                coinColor: [],
                curTime: 0,
                preTime: 0,
            }
            trichMauTPListObject[symbolCandleID] = {
                maxPrice: 0,
                minPrice: [],
                prePrice: 0,
            }

        })

    })

    newData?.length > 0 && await handleStatistic(newData)
    await handleSocketListKline(newListKline)

});

socketRealtime.on('closeAllPosition', async (botListData = []) => {


    console.log(`[...] Close All Position From Realtime:`, botListData);

    await Promise.allSettled(botListData.map(async botData => {

        ["1m", "3m", "5m", "15m"].forEach(candle => {
            const botID = botData.botID
            const symbolList = botData.symbolList

            const listOCByBot = listOCByCandleBot?.[candle]?.[botID]
            const listObject = listOCByBot?.listOC
            listObject && Object.values(listObject).map(strategyData => {
                const symbolItem = strategyData.symbol
                const strategyID = strategyData.strategyID
                const side = strategyData.side
                const candle = strategyData.candle
                const botName = strategyData.botName

                if (symbolList.includes(symbolItem)) {
                    console.log(changeColorConsole.magentaBright(`[V] BLOCK Continue Order OC | ${symbolItem.replace("USDT", "")} - ${side} - ${candle} - Bot: ${botName}`));
                    blockContinueOrderOCByStrategiesID[strategyID] = true
                }
            })

            listOCByBot && handleCancelAllOrderOC([listOCByBot])

        })
    }))

});

socketRealtime.on('close-upcode', async () => {

    console.log(`[...] Close All Bot For Upcode`);

    updatingAllMain = true

    const cancelOC = cancelAllListOrderOC(listOCByCandleBot)
    const deleteAll = deleteAllForUPcode()

    await Promise.allSettled([cancelOC, deleteAll])

    console.log("PM2 Kill Successful");
    exec("pm2 stop runTrade-V3-ByBit")

});

socketRealtime.on('disconnect', () => {
    console.log('[V] Disconnected from socket realtime');
});

// ------- Scanner --------------------------------

socketRealtime.on('scanner-add', async (newData = []) => {
    console.log("[...] Add Scanner From Realtime", newData.length);

    const newBotApiList = {}

    newData.forEach(scannerData => {

        const scannerID = scannerData._id
        const candle = scannerData.Candle.split("m")[0]

        const botID = scannerData.botID?._id
        const botName = scannerData.botID.botName
        const ApiKey = scannerData.botID.ApiKey
        const SecretKey = scannerData.botID.SecretKey
        const telegramID = scannerData.botID.telegramID
        const telegramToken = scannerData.botID.telegramToken

        if (!botApiList[botID]) {
            botApiList[botID] = {
                id: botID,
                botName,
                ApiKey,
                SecretKey,
                telegramID,
                telegramToken,
                IsActive: true
            }
            newBotApiList[botID] = {
                id: botID,
                botName,
                ApiKey,
                SecretKey,
                telegramID,
                telegramToken,
                IsActive: true
            }
        }

        const setBlacklist = new Set(scannerData.Blacklist)
        if (checkConditionBot(scannerData)) {
            scannerData.OnlyPairs.forEach(symbol => {
                if (!setBlacklist.has(symbol)) {

                    allScannerDataObject[candle] = allScannerDataObject[candle] || {}
                    allScannerDataObject[candle][symbol] = allScannerDataObject[candle][symbol] || {}

                    const newScannerData = { ...scannerData }
                    newScannerData.ExpirePre = new Date()

                    allScannerDataObject[candle][symbol][scannerID] = newScannerData

                }
            })
        }
    })
    await handleSocketBotApiList(newBotApiList)

});

socketRealtime.on('scanner-update', async (newData = []) => {
    console.log("[...] Update Scanner From Realtime", newData.length);
    const newBotApiList = {}

    newData.forEach(scannerData => {
        const scannerID = scannerData._id
        const IsActive = scannerData.IsActive
        const candle = scannerData.Candle.split("m")[0]

        const botID = scannerData.botID?._id
        const botName = scannerData.botID.botName
        const ApiKey = scannerData.botID.ApiKey
        const SecretKey = scannerData.botID.SecretKey
        const telegramID = scannerData.botID.telegramID
        const telegramToken = scannerData.botID.telegramToken

        if (!botApiList[botID]) {
            botApiList[botID] = {
                id: botID,
                botName,
                ApiKey,
                SecretKey,
                telegramID,
                telegramToken,
                IsActive: true
            }
            newBotApiList[botID] = {
                id: botID,
                botName,
                ApiKey,
                SecretKey,
                telegramID,
                telegramToken,
                IsActive: true
            }
        }

        const setOnlyPairs = new Set(scannerData.OnlyPairs)
        const setBlacklist = new Set(scannerData.Blacklist)
        Object.values(allSymbol).forEach(symbolData => {

            const symbol = symbolData.value
            if (IsActive && setOnlyPairs.has(symbol) && !setBlacklist.has(symbol)) {

                allScannerDataObject[candle] = allScannerDataObject[candle] || {}
                allScannerDataObject[candle][symbol] = allScannerDataObject[candle][symbol] || {}

                const newScannerData = { ...scannerData }
                newScannerData.ExpirePre = new Date()

                allScannerDataObject[candle][symbol][scannerID] = newScannerData
            }
            else {
                delete allScannerDataObject[candle]?.[symbol]?.[scannerID]
            }
        })
    })

    await handleSocketBotApiList(newBotApiList)

});

socketRealtime.on('scanner-delete', async (newData = []) => {
    console.log("[...] Delete Scanner From Realtime", newData.length);

    newData.forEach(scannerData => {
        const scannerID = scannerData._id
        const candle = scannerData.Candle.split("m")[0]
        Object.values(allSymbol).forEach(symbol => {
            delete allScannerDataObject[candle]?.[symbol.value]?.[scannerID]
        })
    })

});