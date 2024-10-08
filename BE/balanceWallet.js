const cron = require('node-cron');
const TelegramBot = require('node-telegram-bot-api');
const { getAllBotActiveBE } = require('./controllers/bot');
const { balanceWalletBE } = require('./controllers/Configs/ByBit/V3/config');
const { RestClientV5 } = require('bybit-api');

var botListTelegram = {}

var botBalance = {}

const getFutureSpot = async ({
    API_KEY,
    SECRET_KEY
}) => {

    try {
        const client = new RestClientV5({
            testnet: false,
            key: API_KEY,
            secret: SECRET_KEY,
            syncTimeBeforePrivateRequests: true,

        });

        // get field totalWalletBalance
        const getFuture = client.getWalletBalance({
            accountType: 'UNIFIED',
            coin: 'USDT',
        })
        const getSpot = client.getAllCoinsBalance({
            accountType: 'FUND',
            coin: 'USDT'
        })
        const result = await Promise.all([getFuture, getSpot])

        if (result.every(item => item.retCode === 0)) {
            return {
                future: result[0]?.result?.list?.[0]?.coin[0].walletBalance || 0,
                spotTotal: result[1]?.result?.balance?.[0]?.walletBalance || 0,
                code:0
            }
        }
        else {
            return {
                code:-1,
                future: 0,
                spotTotal: 0,
                errorGetSpot: result[0].retMsg,
                errorGetFuture: result[1].retMsg,
            }
        }

    } catch (error) {
        return {}

    }
}
const sendMessageWithRetryByBot = async ({
    messageText,
    retries = 5,
    telegramID,
    telegramToken,
    botName
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
        }
        for (let i = 0; i < retries; i++) {
            try {
                if (messageText) {
                    // await BOT_TOKEN_RUN_TRADE.telegram.sendMessage(telegramID, messageText);
                    await BOT_TOKEN_RUN_TRADE.sendMessage(telegramID, messageText, {
                        parse_mode: "HTML"
                    });
                    console.log(`[->] Message sent to ( ${botName} ) telegram successfully`);
                    return;
                }
            } catch (error) {
                if (error.code === 429) {
                    const retryAfter = error.parameters.retry_after;
                    console.log(`[!] Rate limited. Retrying after ${retryAfter} seconds...`)
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

const handleWalletBalance = async () => {


    const botListDataActiveRes = await getAllBotActiveBE()
    if (botListDataActiveRes.length > 0) {
        const botListDataActiveObject = await Promise.allSettled(botListDataActiveRes.map(async item => {

            const botID = item._id

            const API_KEY = item.ApiKey
            const SECRET_KEY = item.SecretKey

            const result = await getFutureSpot({
                API_KEY,
                SECRET_KEY
            })

            return {
                id: botID,
                userID: item.userID,
                botType: item.botType,
                spotSavings: +item?.spotSavings || 0,
                future: +result.future || 0,
                spotTotal: +result.spotTotal || 0,
                API_KEY,
                SECRET_KEY,
                telegramID: item?.telegramID,
                telegramToken: item?.telegramToken,
                telegramToken: item?.telegramToken,
                botName: item?.botName,
                errorGetSpot: result?.errorGetSpot,
                errorGetFuture: result?.errorGetFuture,
            };

        }))

        const botListDataActive = botListDataActiveObject.map(item => item.value)


        await Promise.allSettled(botListDataActive.map(async botData => {

            console.log("botData",botData);
            

            const newSpotAvailable = botData.spotTotal - botData.spotSavings
            const average = (newSpotAvailable + botData.future) / 2

            const balancePrice = botData.spotTotal + botData.future

            const botID = `${botData.userID}-${botData.botType}`

            if (Math.abs(botData.future - newSpotAvailable) >= 1) {
                await balanceWalletBE({
                    amount: Math.abs(newSpotAvailable - average),
                    futureLarger: botData.future - newSpotAvailable > 0,
                    API_KEY: botData.API_KEY,
                    SECRET_KEY: botData.SECRET_KEY,
                })

                console.log(`\n[V] Saving ( ${botData.botName} ) Successful\n`);
            }
            else {
                console.log(`\n[!] Saving ( ${botData.botName} ) Failed ( < 1 )\n`);
            }

            if (!botBalance[botID]) {
                botBalance[botID] = {
                    botType: "",
                    totalBalanceAllBot: 0,
                    telegramInfo: {
                        telegramID: "",
                        telegramToken: ""
                    }
                }
            }
            botBalance[botID] = {
                botType: botData.botType,
                totalBalanceAllBot: balancePrice + botBalance[botID].totalBalanceAllBot,
                telegramInfo: {
                    telegramID: botData.telegramID,
                    telegramToken: botData.telegramToken,
                }
            }

            let teleText = `<b>Bot:</b> ${botData.botName}\n💵 <b>Balance:</b> ${balancePrice.toFixed(3)}$`
            if(botData?.errorGetSpot)
            {
                teleText += `\n<code>Error Get Spot: ${botData?.errorGetSpot}</code>`
            }
            if(botData?.errorGetFuture)
            {
                teleText += `\n<code>Error Get Future: ${botData?.errorGetFuture}</code>`
            }
            
            sendMessageWithRetryByBot({
                messageText: `<b>Bot:</b> ${botData.botName}\n💵 <b>Balance:</b> ${balancePrice.toFixed(3)}$`,
                telegramID: botData.telegramID,
                telegramToken: botData.telegramToken,
                botName: botData.botName
            })
        }))
    }

}


try {
    // cron.schedule('0 */3 * * *', async () => {
    (async () => {
        await handleWalletBalance();
        setTimeout(() => {
            const list = Object.entries(botBalance)

            if (list.length > 0) {
                Promise.allSettled(list.map(async item => {
                    const key = item[0]
                    const value = item[1]
                    sendMessageWithRetryByBot({
                        messageText: `<b>BotType:</b> ${value.botType}\n💰 <b>Total Balance:</b> ${(value.totalBalanceAllBot).toFixed(3)}$`,
                        telegramID: value.telegramInfo.telegramID,
                        telegramToken: value.telegramInfo.telegramToken,
                        botName: "Total Bot"
                    })

                    botBalance[key] = {
                        totalBalanceAllBot: 0,
                        telegramInfo: {
                            telegramID: "",
                            telegramToken: ""
                        }
                    }
                }))
            }
        }, 500)
    })()
}

catch (e) {
    console.log("[!] Error Balance:", e)
}

