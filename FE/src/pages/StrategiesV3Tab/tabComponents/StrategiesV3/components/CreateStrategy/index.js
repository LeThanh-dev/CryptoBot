import { useForm } from "react-hook-form";
import styles from "./CreateStrategy.module.scss"
import { Autocomplete, Button, Checkbox, FormControl, FormControlLabel, FormLabel, MenuItem, Radio, RadioGroup, Select, Switch, TextField } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useDispatch } from "react-redux";
import DialogCustom from "../../../../../../components/DialogCustom";
import { getAllSymbol, createStrategies } from "../../../../../../services/dataCoinByBitService";
import { setStrategiesHistoryData } from "../../../../../../store/slices/StrategiesHistory";
import { addMessageToast } from "../../../../../../store/slices/Toast";

function CreateStrategy({
    botListInput,
    onClose,
    symbolValueInput,
    dataCheckTreeDefaultRef
}) {

    const formControlMinValue = .1
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
        formState: { errors, isSubmitted }
    } = useForm();

    const [symbolGroupData, setSymbolGroupData] = useState(symbolValueInput || [])
    const [botList, setBotList] = useState([])

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
            const res = await getAllSymbol()
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

                dataCheckTreeDefaultRef.current.length > 0 && dispatch(setStrategiesHistoryData(dataCheckTreeDefaultRef.current))
                const res = await createStrategies({
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
                const res = await createStrategies({
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

    useEffect(() => {
        handleGetSymbolList()
    }, []);


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
                    {errors.botID?.type === 'required' && <p className="formControlErrorLabel">The Bot field is required.</p>}
                    {isSubmitted && !botList.length && <p className="formControlErrorLabel">The Bot field is required.</p>}

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
                        isOptionEqualToValue={(option, value) => option.value === value.value}
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
                                        checked={selected}
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
                    {isSubmitted && !symbolGroupData.length && <p className="formControlErrorLabel">The {symbolGroupDataList.label} field is required.</p>}

                </FormControl>

                <div className={styles.formMainData}>
                    <FormControl
                        className={clsx(styles.formControl, styles.formMainDataItem)}
                    >
                        <TextField
                            select
                            label="Position side"
                            variant="outlined"
                            defaultValue={positionSideList[0].value}
                            size="medium"
                            {...register("PositionSide", { required: true, })}
                        >
                            {

                                positionSideList.map(item => (
                                    <MenuItem value={item?.value} key={item?.value}>{item?.name}</MenuItem>
                                ))
                            }
                        </TextField>
                    </FormControl>
                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            select
                            label="Candlestick"
                            defaultValue={candlestickList[0].value}
                            size="medium"
                            {...register("Candlestick", { required: true, })}
                        >
                            {

                                candlestickList.map(item => (
                                    <MenuItem value={item?.value} key={item?.value}>{item?.name}</MenuItem>
                                ))
                            }
                        </TextField>
                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Order change"
                            variant="outlined"
                            defaultValue={4}
                            size="medium"
                            {...register("OrderChange", { required: true, min: formControlMinValue })}
                        />
                        {errors.OrderChange?.type === 'required' && <p className="formControlErrorLabel">The OC field is required.</p>}
                        {errors.OrderChange?.type === "min" && <p className="formControlErrorLabel">The OC must bigger 0.1.</p>}

                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Extended OC percent"
                            variant="outlined"
                            defaultValue={80}
                            size="medium"
                            {...register("ExtendedOCPercent", { required: true, min: formControlMinValue })}
                        />
                        {errors.ExtendedOCPercent?.type === 'required' && <p className="formControlErrorLabel">The Extended field is required.</p>}
                        {errors.ExtendedOCPercent?.type === "min" && <p className="formControlErrorLabel">The Extended must bigger 0.1.</p>}

                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Take profit"
                            variant="outlined"
                            defaultValue={50}
                            size="medium"
                            {...register("TakeProfit", { required: true, min: formControlMinValue })}
                        />
                        {errors.TakeProfit?.type === 'required' && <p className="formControlErrorLabel">The TP field is required.</p>}
                        {errors.TakeProfit?.type === "min" && <p className="formControlErrorLabel">The TP must bigger 0.1.</p>}

                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Reduce take profit"
                            variant="outlined"
                            defaultValue={45}
                            size="medium"
                            {...register("ReduceTakeProfit", { required: true, min: formControlMinValue })}
                        />
                        {errors.ReduceTakeProfit?.type === 'required' && <p className="formControlErrorLabel">The Reduce TP field is required.</p>}
                        {errors.ReduceTakeProfit?.type === "min" && <p className="formControlErrorLabel">The Reduce TP must bigger 0.1.</p>}

                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Amount"
                            variant="outlined"
                            defaultValue={100}
                            size="medium"
                            {...register("Amount", { required: true, min: formControlMinValue })}
                        />
                        {errors.Amount?.type === 'required' && <p className="formControlErrorLabel">The Amount field is required.</p>}
                        {errors.Amount?.type === "min" && <p className="formControlErrorLabel">The Amount must bigger 0.1.</p>}

                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Ignore"
                            variant="outlined"
                            defaultValue={85}
                            size="medium"
                            {...register("Ignore", { required: true, min: formControlMinValue })}
                        />
                        {errors.Ignore?.type === 'required' && <p className="formControlErrorLabel">The Ignore field is required.</p>}
                        {errors.Ignore?.type === "min" && <p className="formControlErrorLabel">The Ignore must bigger 0.1.</p>}

                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Entry Trailing"
                            variant="outlined"
                            defaultValue={40}
                            size="medium"
                            {...register("EntryTrailing", { min: formControlMinValue })}
                        />
                        {/* {errors.EntryTrailing?.type === 'required' && <p className="formControlErrorLabel">The Entry Trailing field is required.</p>} */}

                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Max OC (%)"
                            variant="outlined"
                            defaultValue={100}
                            size="medium"
                            {...register("StopLose", { required: true, min: 0.1 })}
                        />
                        {errors.StopLose?.type === 'required' && <p className="formControlErrorLabel">The Max OC field is required.</p>}
                        {errors.StopLose?.type === "min" && <p className="formControlErrorLabel">The Max OC must bigger 0.1.</p>}

                    </FormControl>

                    <FormControl className={clsx(styles.formControl)} style={{ flexBasis: "48%" }}>

                        <FormLabel className={styles.label}>IsActive</FormLabel>
                        <Switch
                            defaultChecked
                            title="IsActive"
                            {...register("IsActive")}

                        />
                    </FormControl>


                    <FormControl className={clsx(styles.formControl)} style={{ flexBasis: "48%" }}>
                        <FormLabel className={styles.label}>Remember</FormLabel>
                        <Switch
                            title="Remember"
                            {...register("Remember")}

                        />
                    </FormControl>
                </div>


            </form>
        </DialogCustom>
    );
}

export default CreateStrategy;