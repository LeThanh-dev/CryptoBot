const cron = require('node-cron');
const TelegramBot = require('node-telegram-bot-api');
const { getAllBotActiveBE } = require('./controllers/bot');
const { getFutureSpotBE, balanceWalletBE } = require('./controllers/Configs/ByBit/V3/config');

var botListTelegram = {}

var botBalance = {}

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
            // BOT_TOKEN_RUN_TRADE.launch();
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

            const result = await getFutureSpotBE(botID)

            console.log("result",result);
            

            // Trả về đối tượng mới cho mỗi item trong mảng
            return {
                id: botID,
                userID: item.userID,
                botType: item.botType,
                spotSavings: +item?.spotSavings || 0,
                future: +result.future || 0,
                spotTotal: +result.spotTotal || 0,
                API_KEY: result.ApiKey,
                SECRET_KEY: result.SecretKey,
                telegramID: item?.telegramID,
                telegramToken: item?.telegramToken,
                telegramToken: item?.telegramToken,
                botName: item?.botName,
            };

        }))
        const botListDataActive = botListDataActiveObject.map(item => item.value)

        await Promise.allSettled(botListDataActive.map(async botData => {

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
            console.log("botData",botData);
            
            // sendMessageWithRetryByBot({
            //     messageText: `<b>Bot:</b> ${botData.botName}\n💵 <b>Balance:</b> ${balancePrice.toFixed(3)}$`,
            //     telegramID: botData.telegramID,
            //     telegramToken: botData.telegramToken,
            //     botName: botData.botName
            // })
        }))
    }
    // return {
    //     totalBalanceAllBot: totalBalanceAllBot.toFixed(3),
    //     telegramInfo
    // }
}


try {

    (async () => {
        await handleWalletBalance();
        setTimeout(() => {
            const list = Object.entries(botBalance)
            console.log("list",list);
            
            if (list.length > 0) {
                Promise.allSettled(list.map(async item => {
                    const key = item[0]
                    const value = item[1]
                    // sendMessageWithRetryByBot({
                    //     messageText: `<b>BotType:</b> ${value.botType}\n💰 <b>Total Balance:</b> ${(value.totalBalanceAllBot).toFixed(3)}$`,
                    //     telegramID: value.telegramInfo.telegramID,
                    //     telegramToken: value.telegramInfo.telegramToken,
                    //     botName: "Total Bot"
                    // })

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

