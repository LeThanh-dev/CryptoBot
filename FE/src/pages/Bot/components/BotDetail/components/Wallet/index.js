import { Button, TextField } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import Transfer from './conmponents/Transfer';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SavingsIcon from '@mui/icons-material/Savings';
import styles from "./Overview.module.scss"
import { useParams } from 'react-router-dom';
import { getBotByID, updateBot } from '../../../../../../services/botService';
import { useDispatch } from 'react-redux';
import { addMessageToast } from '../../../../../../store/slices/Toast';
import { formatNumber } from '../../../../../../functions';
import { balanceWallet, getFutureAvailable, getSpotTotal } from '../../../../../../services/Configs/ByBIt/V3/configService';
import CurrencyFormat from 'react-currency-format';

function Wallet() {
    const [openTransfer, setOpenTransfer] = useState({
        isOpen: false,
        dataChange: false,
    });
    const [spotSaving, setSpotSaving] = useState(0);
    const [spotTotal, setSpotTotal] = useState(0);
    const [futureAvailable, setFutureAvailable] = useState(0);
    const futureAvailableDefault = useRef(0)
    const spotAvailable = useRef({
        dataBalance: 0,
        dataFirst: {
            spotSavings: 0,
            spotTotal: 0
        }
    })

    const { botID } = useParams()

    const dispatch = useDispatch()

    const handleGetFutureAvailable = async () => {

        try {
            const res = await getFutureAvailable(botID)
            const { status, data, message } = res.data

            if (status === 200) {
                const value = +data.result?.list?.[0]?.coin[0].walletBalance || 0
                setFutureAvailable(value)
                futureAvailableDefault.current = value
            }
            else {
                dispatch(addMessageToast({
                    status: status,
                    message: message,
                }))
            }

        } catch (error) {
            dispatch(addMessageToast({
                status: 500,
                message: "Get Future Available Error",
            }))
        }
    }

    const handleGetSpotTotal = async () => {

        // const newSpotTotal = 50000
        try {
            const res = await getSpotTotal(botID)
            const { status, data, message } = res.data

            const newSpotTotal = +data.result?.balance?.[0]?.walletBalance || 0
            spotAvailable.current = {
                dataBalance: 0,
                dataFirst: {
                    ...spotAvailable.current.dataFirst,
                    spotTotal: newSpotTotal
                }
            }

            if (status === 200) {
                setSpotTotal(newSpotTotal)
            }
            else {
                // dispatch(addMessageToast({
                //     status: status,
                //     message: message,
                // }))
            }
        } catch (error) {
            dispatch(addMessageToast({
                status: 500,
                message: "Get Spot Total Error",
            }))
        }
        // setSpotTotal(newSpotTotal)
    }

    const handleGetBotSaving = () => {
        getBotByID(botID)
            .then(res => {
                const data = res.data.data;
                if (data) {
                    const newSpotSavings = +data?.spotSavings || 0

                    spotAvailable.current = {
                        dataBalance: 0,
                        dataFirst: {
                            ...spotAvailable.current.dataFirst,
                            spotSavings: newSpotSavings
                        }
                    }

                    setSpotSaving(newSpotSavings)
                }
            }

            )
            .catch(error => {
                dispatch(addMessageToast({
                    status: 500,
                    message: "Get Bot Detail Error",
                }))
            })
    }

    // Cân ví
    const handleWalletBalance = async () => {

        const newSpotAvailable = spotTotal - spotSaving
        const average = (newSpotAvailable + futureAvailableDefault.current) / 2

        if (Math.abs(futureAvailableDefault.current - newSpotAvailable) >= 1) {
            try {
                const saveSpotSaving = updateBot({
                    id: botID,
                    data: {
                        spotSavings: spotSaving
                    }
                })
                setFutureAvailable(average)
                spotAvailable.current = {
                    ...spotAvailable.current,
                    dataBalance: average,
                }

                const balance = balanceWallet({
                    amount: Math.abs(newSpotAvailable - average),
                    futureLarger: futureAvailableDefault.current - newSpotAvailable > 0,
                    botID
                })

                const res = await Promise.all([saveSpotSaving, balance])

                if (res.every(item => item.data.status === 200)) {
                    dispatch(addMessageToast({
                        status: 200,
                        message: "Balance Wallet Successful",
                    }))
                }
                else {
                    dispatch(addMessageToast({
                        status: 400,
                        message: "Balance Wallet Failed",
                    }))
                }
                getAll()

            } catch (error) {
                dispatch(addMessageToast({
                    status: 500,
                    message: "Balance Wallet Error",
                }))
            }
        }
        else {
            dispatch(addMessageToast({
                status: 400,
                message: "Balance Wallet Failed",
            }))
        }
    }

    const getAll = () => {
        handleGetFutureAvailable()
        handleGetSpotTotal()
        handleGetBotSaving()
    }

    useEffect(() => {
        getAll()
    }, []);

    useEffect(() => {
        openTransfer.dataChange && getAll()
    }, [openTransfer]);

    return (
        <div className={styles.overview}>
            <div className={styles.overviewHeader}>
                <p className={styles.text}>Balance : {formatNumber(futureAvailable + spotTotal)} $</p>
            </div>

            <div className={styles.overviewInfo}>
                <div className={styles.overviewInfoList}>


                    <div className={styles.overviewInfoListItem}>
                        <p className={styles.label}>Spot Available</p>
                        <p>{formatNumber(spotAvailable.current.dataBalance || (spotAvailable.current.dataFirst.spotTotal - spotAvailable.current.dataFirst.spotSavings))} $</p>
                    </div>

                    <div className={styles.overviewInfoListItem}>
                        <p className={styles.label}>Spot Savings</p>

                        {/* <CurrencyFormat
                            value={spotSaving}
                            thousandSeparator={true}
                            isAllowed={({ floatValue }) => {
                                if (floatValue) {

                                    return formatNumber(floatValue) <= formatNumber(spotTotal) && floatValue > 0
                                }
                                return true
                            }}
                            prefix={'$'}
                            style={{
                                padding: "6px",
                                borderRadius: "6px",
                                outline: "none",
                                border: "1px solid #cbcbcb",
                                overflow: "hidden"
                            }}
                            onValueChange={values => {
                                const { value } = values;
                                +value <= spotTotal ? setSpotSaving(+value) : setSpotSaving(spotTotal)
                            }}
                        /> */}
                        <TextField
                            size="small"
                            value={spotSaving}
                            type='number'
                            onChange={e => {
                                const value = e.target.value;
                                value <= spotTotal ? setSpotSaving(value) : setSpotSaving(spotTotal)
                            }}
                        />
                    </div>

                    <div className={styles.overviewInfoListItem}>
                        <p className={styles.label}>Spot Total</p>
                        <p>{formatNumber(spotTotal)} $</p>
                    </div>
                </div>
                <div className={styles.overviewInfoList}>


                    <div className={styles.overviewInfoListItem}>
                        <p className={styles.label}>Futures Available</p>
                        <p>{formatNumber(futureAvailable)} $</p>
                    </div>

                    <div className={styles.overviewInfoListItem}>
                        <p className={styles.label}>Futures Total</p>
                        <p>0 $</p>
                    </div>

                    <div className={styles.overviewInfoListItem}>
                        <p className={styles.label}>Funding</p>
                        <p>0 $</p>
                    </div>
                </div>
            </div>

            <div className={styles.overviewBtnAction}>
                <Button
                    className={styles.btn}
                    size="small"
                    variant="contained"
                    startIcon={<AccountBalanceWalletIcon />}
                    onClick={() => {
                        setOpenTransfer({
                            isOpen: true,
                            dataChange: true,
                        })
                    }}
                >
                    Transfer
                </Button>
                <Button
                    className={styles.btn}
                    color='info'
                    size="small"
                    variant="contained"
                    startIcon={<SavingsIcon />}
                    onClick={handleWalletBalance}
                >
                    Savings
                </Button>
            </div>


            {openTransfer.isOpen && <Transfer
                open={openTransfer}
                botID={botID}
                onClose={(data) => {
                    setOpenTransfer(data)
                }}
                spotAvailableMax={spotAvailable.current.dataBalance || (spotAvailable.current.dataFirst.spotTotal - spotAvailable.current.dataFirst.spotSavings)}
                futureAvailableMax={futureAvailable}
            />}
            {/* 
            {openSavings && <Savings
                open={openSavings}
                onClose={() => {
                    setOpenSavings(false)
                }}
            />} */}

            {/* {openEditSpotSavings &&
                <DialogCustom
                    open={true}
                    onClose={closeDialogSotSaving}
                    dialogTitle='Change Spot Saving'
                    onSubmit={handleSubmit(handleChangeSpotSaving)}
                >
                    <form className={styles.dialogForm}>
                        <FormControl style={{
                            width: "100%"
                        }}>
                            <FormLabel style={{
                                marginBottom: "6px"
                            }}>
                                Spot Savings
                            </FormLabel>
                            <TextField
                                {
                                ...register(
                                    "spotSavings",
                                    {
                                        validate: value => value <= spotTotal || "The value cannot be greater than Spot Total"
                                    })
                                }
                                type="number"
                                size="small"
                            />
                            {errors.spotSavings?.type === 'validate' && <p className="formControlErrorLabel">{errors.spotSavings.message}</p>}
                        </FormControl>
                    </form>
                </DialogCustom>
            } */}
        </div>
    );
}

export default Wallet;