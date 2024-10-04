import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { FormControl, FormLabel, Autocomplete, TextField, Button, Checkbox, RadioGroup, FormControlLabel, Radio, MenuItem, Switch, InputAdornment, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material"
import clsx from "clsx"
import { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useDispatch } from "react-redux"
import DialogCustom from "../../../../../../../../components/DialogCustom"
import { addMessageToast } from "../../../../../../../../store/slices/Toast"
import styles from "./CreateStrategy.module.scss"
import { createStrategiesSpot, getAllSymbolSpot, getMarginBorrowCheck } from "../../../../../../../../services/Configs/ByBIt/V1/marginService";
import { formatNumberString } from "../../../../../../../../functions"

function CreateStrategy({
    botListInput,
    onClose,
    symbolValueInput,
}) {

    const formControlMinValue = 0.01
    const groupList = [
        {
            name: "Group 1",
            value: "Group 1",
        }
    ]

    const positionSideList = [
        {
            name: "Both",
            value: "Both",
        },
        {
            name: "Long",
            value: "Long",
        },
        {
            name: "Short",
            value: "Short",
        },
    ]

    const candlestickList = [
        {
            name: "1m",
            value: "1m",
        },
        {
            name: "3m",
            value: "3m",
        },
        {
            name: "5m",
            value: "5m",
        },
        {
            name: "15m",
            value: "15m",
        },
        // {
        //     name: "30m",
        //     value: "30m",
        // },
        // {
        //     name: "60m",
        //     value: "60m",
        // },
    ]

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitted },
    } = useForm();

    const [symbolGroupData, setSymbolGroupData] = useState(symbolValueInput ? [symbolValueInput] : [])
    const [botList, setBotList] = useState([])
    const [spotMaxTradeAmountList, setSpotMaxTradeAmountList] = useState([]);
    const [showSpotBorrowList, setShowSpotBorrowList] = useState([]);
    const [positionSideValue, setPositionSideValue] = useState("");


    const dataChangeRef = useRef(false)

    const [symbolGroupDataList, setSymbolGroupDataList] = useState({
        label: "Symbol",
        list: []
    });

    const symbolListRef = useRef()

    const dispatch = useDispatch()

    const handleChangeRatio = (e) => {
        setSymbolGroupData([])
        const value = e.target.value
        setSymbolGroupDataList({
            label: value,
            list: value === "Group" ? groupList : symbolListRef.current
        })
    }

    const handleGetSymbolList = async () => {
        try {
            const res = await getAllSymbolSpot()
            const { status, message, data: symbolListDataRes } = res.data

            const newSymbolList = symbolListDataRes.map(item => ({ name: item, value: item }))

            symbolListRef.current = newSymbolList

            setSymbolGroupDataList({
                label: "Symbol",
                list: newSymbolList
            })
        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Get All Symbol Error",
            }))
        }
    }

    const handleSubmitCreate = async data => {

        if (symbolGroupData.length > 0 && botList.length > 0) {
            try {
                const res = await createStrategiesSpot({
                    data: data,
                    botListId: botList.map(item => item.value),
                    [symbolGroupDataList.label]: symbolGroupData.map(item => item.value)
                })
                const { status, message, data: symbolListDataRes } = res.data

                dispatch(addMessageToast({
                    status: status,
                    message: message
                }))

                if (status === 200) {
                    reset()
                    dataChangeRef.current = true
                }
            }
            catch (err) {
                dispatch(addMessageToast({
                    status: 500,
                    message: "Add New Error",
                }))
            }
            closeDialog()
        }
    }

    const handleSubmitCreateWithAddMore = async data => {

        if (symbolGroupData.length > 0 && botList.length > 0) {
            try {
                const res = await createStrategiesSpot({
                    data: data,
                    botListId: botList.map(item => item.value),
                    [symbolGroupDataList.label]: symbolGroupData.map(item => item.value)
                })
                const { status, message, data: symbolListDataRes } = res.data

                dispatch(addMessageToast({
                    status: status,
                    message: message
                }))

                if (status === 200) {
                    dataChangeRef.current = true
                }
            }
            catch (err) {
                dispatch(addMessageToast({
                    status: 500,
                    message: "Add New Error",
                }))
            }
        }
    }

    const closeDialog = () => {
        onClose({
            isOpen: false,
            dataChange: dataChangeRef.current
        })
        reset()
    }

    const handleGetSpotBorrowCheck = async (positionSide) => {
        try {
            const res = await getMarginBorrowCheck({
                botListData: botList,
                symbol: symbolGroupData[0].value,
                positionSide
            })
            const { status, message, data: newData } = res.data

            dispatch(addMessageToast({
                status: status,
                message: message
            }))

            if (status === 200) {
                setSpotMaxTradeAmountList(newData.map(item => ({
                    ...item,
                    spotMaxTradeAmount: formatNumberString((+item.spotMaxTradeAmount).toFixed(2))
                })))
            }
        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: err.message,
            }))
        }
    }

    useEffect(() => {
        handleGetSymbolList()
    }, []);

    useEffect(() => {
        const value = positionSideValue
        if (symbolGroupData.length === 1 && botList.length > 0 && value && value !== "Both") {
            handleGetSpotBorrowCheck(value)
        }
        else {
            setSpotMaxTradeAmountList([])
        }
    }, [symbolGroupData, botList, positionSideValue]);
    return (
        <DialogCustom
            dialogTitle="Create Strategy"
            open={true}
            onClose={() => { closeDialog() }}
            onSubmit={handleSubmit(handleSubmitCreate)}
            maxWidth="sm"
            addMore
            addMoreFuntion={handleSubmit(handleSubmitCreateWithAddMore)}
        >

            <form className={styles.dialogForm}>

                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>Bots</FormLabel>
                    <Autocomplete
                        multiple
                        limitTags={1}
                        value={botList}
                        disableCloseOnSelect
                        options={botListInput}
                        size="small"
                        getOptionLabel={(option) => option.name}
                        onChange={(e, value) => {
                            setBotList(value)
                        }}
                        renderInput={(params) => (
                            <TextField {...params} placeholder="Select..." />
                        )}
                        renderOption={(props, option, { selected, index }) => (
                            <>
                                {index === 0 && (
                                    <>
                                        <Button
                                            color="inherit"
                                            style={{ width: '50%' }}
                                            onClick={() => {
                                                setBotList(botListInput)
                                            }}
                                        >
                                            Select All
                                        </Button>
                                        <Button
                                            color="inherit"
                                            style={{ width: '50%' }}
                                            onClick={() => {
                                                setBotList([])
                                            }}
                                        >
                                            Deselect All
                                        </Button>
                                    </>
                                )}
                                <li {...props}>
                                    <Checkbox
                                        checked={selected || botList.findIndex(item => item.value === option.value) > -1}
                                    />
                                    {option.name}
                                </li>
                            </>
                        )}
                        renderTags={(value) => {
                            return <p style={{ marginLeft: "6px" }}>{value.length} items selected</p>
                        }}
                    >


                    </Autocomplete>
                    {errors.botID?.type === 'required' && <p className="formControlErrorLabel">The Bot Required.</p>}
                    {isSubmitted && !botList.length && <p className="formControlErrorLabel">The Bot Required.</p>}

                </FormControl>

                <FormControl className={styles.formControl} >
                    <RadioGroup
                        defaultValue="Symbol"
                        onChange={handleChangeRatio}
                        style={{
                            display: "flex",
                            flexDirection: "row"
                        }}
                    >
                        <FormControlLabel value="Symbol" control={<Radio />} label="Symbol" />
                        <FormControlLabel value="Group" control={<Radio />} label="Group" />
                    </RadioGroup>
                </FormControl>

                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>{symbolGroupDataList.label === "Group" ? "Group" : "Symbol"}</FormLabel>
                    <Autocomplete
                        multiple
                        limitTags={2}
                        value={symbolGroupData}
                        disableCloseOnSelect
                        options={symbolGroupDataList.list}
                        size="small"
                        getOptionLabel={(option) => option.name}
                        onChange={(e, value) => {
                            setSymbolGroupData(value)
                        }}
                        renderInput={(params) => (
                            <TextField {...params} placeholder="Select..." />
                        )}
                        renderOption={(props, option, { selected, index }) => (
                            <>
                                {index === 0 && (
                                    <>
                                        <Button
                                            color="inherit"
                                            style={{ width: '50%' }}
                                            onClick={() => {
                                                setSymbolGroupData(symbolGroupDataList.list)
                                            }}
                                        >
                                            Select All
                                        </Button>
                                        <Button
                                            color="inherit"
                                            style={{ width: '50%' }}
                                            onClick={() => {
                                                setSymbolGroupData([])
                                            }}
                                        >
                                            Deselect All
                                        </Button>
                                    </>
                                )}
                                <li {...props}>
                                    <Checkbox
                                        checked={selected || symbolGroupData.findIndex(item => item.value === option.value) > -1}
                                    />
                                    {option.name.split("USDT")[0]}
                                </li>
                            </>
                        )}
                        renderTags={(value) => {
                            return <p style={{ marginLeft: "6px" }}>{value.length} items selected</p>
                        }}
                    >


                    </Autocomplete>
                    {isSubmitted && !symbolGroupData.length && <p className="formControlErrorLabel">The {symbolGroupDataList.label} Required.</p>}

                </FormControl>

                <div className={styles.formMainData}>
                    <FormControl
                        className={clsx(styles.formControl, styles.formMainDataItem)}
                    >
                        <TextField
                            select
                            label="Position side"
                            variant="outlined"
                            // defaultValue={positionSideList[0].value}
                            size="medium"
                            {...register("PositionSide", { required: true, })}
                            onChange={e => {
                                setPositionSideValue(e.target.value);
                            }}
                        >
                            {

                                positionSideList.map(item => (
                                    <MenuItem value={item?.value} key={item?.value}>{item?.name}</MenuItem>
                                ))
                            }
                        </TextField>
                        {!positionSideValue && <p className="formControlErrorLabel">The Position Required.</p>}
                    </FormControl>


                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="OC"
                            variant="outlined"
                            defaultValue={4}
                            size="medium"
                            InputProps={{
                                endAdornment: <InputAdornment position="end">
                                    %
                                </InputAdornment>,
                            }}
                            {...register("OrderChange", { required: true, min: formControlMinValue })}
                        />
                        {errors.OrderChange?.type === 'required' && <p className="formControlErrorLabel">The OC Required.</p>}
                        {errors.OrderChange?.type === "min" && <p className="formControlErrorLabel">The OC must bigger 0.01.</p>}
                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Amount"
                            variant="outlined"
                            defaultValue={100}
                            size="medium"
                            InputProps={{
                                endAdornment: <InputAdornment position="end">
                                    USDT
                                </InputAdornment>
                            }}
                            {...register("Amount", {
                                required: true, min: formControlMinValue, ...(spotMaxTradeAmountList[0]?.spotMaxTradeAmount > 0 && { max: spotMaxTradeAmountList[0].spotMaxTradeAmount })
                            })}
                        />
                        {errors.Amount?.type === 'required' && <p className="formControlErrorLabel">The Amount Required.</p>}
                        {errors.Amount?.type === "min" && <p className="formControlErrorLabel">The Amount must bigger 0.01.</p>}
                        {errors.Amount?.type === "max" && <p className="formControlErrorLabel">The Amount must smaller {spotMaxTradeAmountList[0].spotMaxTradeAmount}.</p>}

                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Auto amount percent"
                            variant="outlined"
                            defaultValue={5}
                            size="medium"
                            InputProps={{
                                endAdornment: <InputAdornment position="end">
                                    %
                                </InputAdornment>
                            }}
                            {...register("AmountAutoPercent", { required: true, min: formControlMinValue })}
                        />
                        {errors.AmountAutoPercent?.type === 'required' && <p className="formControlErrorLabel">The AutoPercent Required.</p>}
                        {errors.AmountAutoPercent?.type === "min" && <p className="formControlErrorLabel">The AutoPercent must bigger 0.01.</p>}

                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Expire"
                            variant="outlined"
                            defaultValue={20}
                            size="medium"
                            InputProps={{
                                endAdornment: <InputAdornment position="end">
                                    min
                                </InputAdornment>
                            }}
                            {...register("Expire",)}
                        />

                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Limit"
                            variant="outlined"
                            defaultValue={200}
                            size="medium"
                            InputProps={{
                                endAdornment: <InputAdornment position="end">
                                    USDT
                                </InputAdornment>
                            }}
                            {...register("Limit", { required: true, min: formControlMinValue })}
                        />
                        {errors.Limit?.type === 'required' && <p className="formControlErrorLabel">The Limit Required.</p>}
                        {errors.Limit?.type === "min" && <p className="formControlErrorLabel">The Limit must bigger 0.01.</p>}

                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Amount increase OC"
                            variant="outlined"
                            defaultValue={8}
                            size="medium"
                            InputProps={{
                                endAdornment: <InputAdornment position="end">
                                    %
                                </InputAdornment>
                            }}
                            {...register("AmountIncreaseOC", { required: true, min: formControlMinValue })}
                        />
                        {errors.AmountIncreaseOC?.type === 'required' && <p className="formControlErrorLabel">The IncreaseOC Required.</p>}
                        {errors.AmountIncreaseOC?.type === "min" && <p className="formControlErrorLabel">The IncreaseOC must bigger 0.01.</p>}

                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Amount expire"
                            variant="outlined"
                            defaultValue={10}
                            size="medium"
                            InputProps={{
                                endAdornment: <InputAdornment position="end">
                                    min
                                </InputAdornment>
                            }}
                            {...register("AmountExpire")}
                        />

                    </FormControl>


                    <div style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        margin: "0 12px"
                    }}>
                        <FormControl className={clsx(styles.formControl)}>

                            <FormLabel className={styles.label}>IsActive</FormLabel>
                            <Switch
                                defaultChecked
                                title="IsActive"
                                {...register("IsActive")}
                            />
                        </FormControl>

                        <FormControl className={clsx(styles.formControl)}>
                            <FormLabel className={styles.label}>Adaptive</FormLabel>
                            <Switch
                                defaultChecked
                                title="Adaptive"
                                {...register("Adaptive")}

                            />
                        </FormControl>

                        <FormControl className={clsx(styles.formControl)}>
                            <FormLabel className={styles.label}>Reverse</FormLabel>
                            <Switch
                                title="Reverse"
                                {...register("Reverse")}

                            />
                        </FormControl>

                        <FormControl className={clsx(styles.formControl)}>
                            <FormLabel className={styles.label}>Remember</FormLabel>
                            <Switch
                                title="Remember"
                                {...register("Remember")}

                            />
                        </FormControl>
                    </div>
                </div>


            </form>

            {spotMaxTradeAmountList.length === 1 && <b><b style={{
                margin: "0 3px 0 10px",
                color: " #db2f2f",
                fontSize: "1rem",
            }}>MAX</b>: {spotMaxTradeAmountList[0].spotMaxTradeAmount}$</b>}
            {spotMaxTradeAmountList.length > 1 && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    marginLeft: "6px"
                }}>
                    <b style={{
                        marginRight: "10px",
                        background: "#db2f2f",
                        color: " #f9f9f9",
                        padding: "6px",
                        borderRadius: "6px",
                        fontSize: ".8rem",
                    }}>MAX:</b>
                    <RemoveRedEyeIcon
                        className={styles.icon}
                        onClick={() => {
                            setShowSpotBorrowList(spotMaxTradeAmountList)
                        }}
                    />
                </div>
            )}

            {
                showSpotBorrowList.length > 0 && (
                    <DialogCustom
                        open={true}
                        onClose={() => {
                            setShowSpotBorrowList([])
                        }}
                        dialogTitle='Details MAX'
                        hideActionBtn
                        backdrop
                    >
                        <Table className={styles.addMember}>
                            <TableHead>
                                <TableRow>
                                    <TableCell style={{ fontWeight: "bold" }}>STT </TableCell>
                                    <TableCell style={{ fontWeight: "bold" }}>Bot </TableCell>
                                    <TableCell style={{ fontWeight: "bold" }}>Max </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {
                                    showSpotBorrowList.map((data, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                {index + 1}
                                            </TableCell>
                                            <TableCell>
                                                {data.botData?.botName}
                                            </TableCell>
                                            <TableCell>
                                                {data.spotMaxTradeAmount}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                }
                            </TableBody>
                        </Table>
                    </DialogCustom>
                )
            }
        </DialogCustom>
    );
}

export default CreateStrategy;