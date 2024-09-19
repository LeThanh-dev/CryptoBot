require('dotenv').config();

const { RestClientV5 } = require('bybit-api');


let Symbol = []

var historyAllBySymbol = {};
[1, 3, 5, 15].forEach(candle => {
    historyAllBySymbol[candle] = {}
});

let CoinInfo = new RestClientV5({
    testnet: false
});

const roundNumber = (number) => {
    return Math.round(number * 10000) / 100
}


async function ListSymbol() {
    let data = []
    await CoinInfo.getTickers({ category: 'linear' })
        .then((rescoin) => {
            rescoin.result.list.forEach((e) => {
                if (e.symbol.indexOf("USDT") > 0) {
                    data.push(e.symbol)
                }
            })
        })
        .catch((error) => {
            console.error(error);
        });
    return data
}

async function TimeS0(interval) {
    let TimeStart = []
    await CoinInfo.getKline({
        category: 'linear',
        symbol: "BTCUSDT",
        interval,
    })
        .then((response) => {
            TimeStart.push(response.result.list[0][0])
        })
        .catch((error) => {
            console.error(error);
        });
    return TimeStart
}

const sortListReverse = (arr) => {
    arr.sort((a, b) => Math.abs(b.OC) - Math.abs(a.OC));
    return arr.slice(0, 15)
}

const history = async ({
    symbol,
    OpenTime,
    limitNen = 50,
    interval
}) => {
    const TimeStart = OpenTime - limitNen * 60000 * interval
    const TimeSop = OpenTime - 60000 * interval

    await CoinInfo.getKline({
        category: 'linear',
        symbol,
        interval,
        start: TimeStart,
        end: TimeSop,
        limit: limitNen,
    })
        .then((response) => {
            const listOC = [];
            const listOCLong = [];

            let index = 0
            for (let i = limitNen - 1; i >= 0; i--) {
                const dataCoin = response.result.list[i]

                const Open = dataCoin[1]
                const Highest = dataCoin[2]
                const Lowest = dataCoin[3]
                const Close = dataCoin[4]

                const startTime = new Date(+dataCoin[0]).toLocaleString("vi-vn")

                let TP = Math.abs((Highest - Close) / (Highest - Open)) || 0

                let TPLong = Math.abs(Close - Lowest) / (Open - Lowest) || 0


                let TPCheck = TP
                let TPCheckLong = TPLong

                if (index > 0) {
                    if (Lowest < Open) {
                        const dataPre = listOC[index - 1].dataCoin
                        const OpenPre = +dataPre[1]
                        const HighestPre = +dataPre[2]
                        TPCheck = Math.abs((Lowest - HighestPre) / (HighestPre - OpenPre)) || 0
                    }
                    if (Highest > Open) {
                        const dataPre = listOCLong[index - 1].dataCoin
                        const OpenPre = +dataPre[1]
                        const LowestPre = +dataPre[3]
                        TPCheckLong = Math.abs((Highest - LowestPre) / (LowestPre - OpenPre)) || 0
                    }
                }

                if (TP == "Infinity") {
                    TP = 0
                    TPCheck = 0
                }
                if (TPLong == "Infinity") {
                    TPLong = 0
                    TPCheckLong = 0
                }
                listOC.push({
                    OC: roundNumber((Highest - Open) / Open),
                    TP: roundNumber(TP),
                    TPCheck: roundNumber(TPCheck),
                    startTime,
                    dataCoin
                })
                listOCLong.push({
                    OC: roundNumber((Lowest - Open) / Open),
                    TP: roundNumber(TPLong),
                    TPCheckLong: roundNumber(TPCheckLong),
                    startTime,
                    dataCoin
                })
                index++
            }

            historyAllBySymbol[interval][symbol] = {
                listOC: (listOC),
                listOCLong: (listOCLong),
            }

            console.dir(historyAllBySymbol[15]["MEWUSDT"], { depth: null });

        })
        .catch((error) => {
            console.error(error, symbol);
        });
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function getHistoryAllCoin({ coinList, limitNen, interval }) {
    console.log(`[...] Processing history candle ( ${interval}m )`);
    for (const index in coinList) {
        const OpenTime = await TimeS0(interval);
        await history({
            OpenTime,
            limitNen,
            symbol: coinList[index],
            interval
        });
    }
    console.log(`[V] Process history candle ( ${interval}m ) finished`);
}

const handleStatistic = async () => {

    Symbol = await ListSymbol()

    const limitNen = 5;

    await Promise.allSettled([1, 3, 5, 15].map(async interval => {
        await getHistoryAllCoin({
            coinList: ["MEWUSDT"],
            limitNen,
            interval
        })
    }))

}


let Main = async () => {

    handleStatistic()

};

try {
    Main()
}

catch (e) {
    console.log("Error Main:", e)
}