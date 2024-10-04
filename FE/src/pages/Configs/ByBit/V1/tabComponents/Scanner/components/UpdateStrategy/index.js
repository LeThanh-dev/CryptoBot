import CloudSyncIcon from '@mui/icons-material/CloudSync';
import { FormControl, FormLabel, Autocomplete, TextField, Button, Checkbox, Switch, InputAdornment, CircularProgress } from "@mui/material"
import clsx from "clsx"
import { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useDispatch } from "react-redux"
import DialogCustom from "../../../../../../../../components/DialogCustom"
import { addMessageToast } from "../../../../../../../../store/slices/Toast"
import styles from "./CreateStrategy.module.scss"
import { updateConfigByID } from '../../../../../../../../services/Configs/ByBIt/V1/scannerService';
import { getAllSymbolSpot, syncSymbolSpot } from '../../../../../../../../services/Configs/ByBIt/V1/spotService';
import { getAllSymbolSpot as getAllSymbolMargin, syncSymbolSpot as syncSymbolMargin } from '../../../../../../../../services/Configs/ByBIt/V1/marginService';

function UpdateStrategy({
    onClose,
    dataInput,
    setDataCheckTree,
    dataCheckTreeDefaultRef,
    dataCheckTreeDefaultObject
}) {

    const formControlMinValue = 0.01


    const marketList = [
        {
            name: "Margin",
            value: "Margin",
        },
        {
            name: "Spot",
            value: "Spot",
        },
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



    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitted }
    } = useForm();

    const onlyPairsSelectedInput = dataInput.OnlyPairs.map(item => ({ name: item, value: item }))
    const blackListSelectedInput = dataInput.Blacklist.map(item => ({ name: item, value: item }))
    const [onlyPairsSelected, setOnlyPairsSelected] = useState(onlyPairsSelectedInput || [])
    const [blackListSelected, setBlackListSelected] = useState(blackListSelectedInput || [])
    const [loadingSyncCoin, setLoadingSyncCoin] = useState(false);

    const dataChangeRef = useRef(false)
    const spotDataListRef = useRef([])
    const marginDataListRef = useRef([])

    const [symbolGroupDataList, setSymbolGroupDataList] = useState({
        label: dataInput.Market,
        list: []
    });

    const symbolListRef = useRef()

    const dispatch = useDispatch()

    const handleGetSpotDataList = async (syncNew = true) => {
        try {
            let newData = spotDataListRef.current
            if (syncNew) {
                const res = await getAllSymbolSpot()
                const { data: symbolListDataRes } = res.data
                newData = symbolListDataRes.map(item => ({ name: item, value: item }))
            }

            setBlackListSelected(blackListSelectedInput)
            setOnlyPairsSelected(onlyPairsSelectedInput)
            setSymbolGroupDataList(
                {
                    label: "Spot",
                    list: newData
                }
            )
            spotDataListRef.current = newData

        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: err.message,
            }))
        }
    }

    const handleGetMarginDataList = async (syncNew = true) => {
        try {

            let newData = marginDataListRef.current
            if (syncNew) {
                const res = await getAllSymbolMargin()
                const { data: symbolListDataRes } = res.data
                newData = symbolListDataRes.map(item => ({ name: item, value: item }))
            }

            setBlackListSelected(blackListSelectedInput)
            setOnlyPairsSelected(onlyPairsSelectedInput)
            setSymbolGroupDataList(
                {
                    label: "Margin",
                    list: newData
                }
            )
            marginDataListRef.current = newData
        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: err.message,
            }))
        }
    }

    const handleSyncSymbol = async () => {
        if (!loadingSyncCoin) {
            try {
                setLoadingSyncCoin(true)
                let res
                if (symbolGroupDataList.label === "Spot") {
                    res = await syncSymbolSpot()
                    handleGetSpotDataList()
                }
                else {
                    res = await syncSymbolMargin()
                    handleGetMarginDataList()
                }
                const { status, message, data: resData } = res.data

                dispatch(addMessageToast({
                    status: status,
                    message: message,
                }))

                setLoadingSyncCoin(false)
            }
            catch (err) {
                setLoadingSyncCoin(false)
                dispatch(addMessageToast({
                    status: 500,
                    message: "Sync Error",
                }))
            }
        }
    }

    const handleSubmitCreate = async data => {

        const configID = dataInput._id
        const newData = {
            ...dataInput,
            ...data,
            Blacklist: [... new Set(blackListSelected.map(item => item.value))],
            OnlyPairs: [... new Set(onlyPairsSelected.map(item => item.value))]
        }
        try {
            const res = await updateConfigByID({
                newData,
                configID
            })
            const { status, message, data: symbolListDataRes } = res.data

            dispatch(addMessageToast({
                status: status,
                message: message
            }))

            if (status === 200) {
                reset()
                dataChangeRef.current = true

                setDataCheckTree(dataCheckTree => dataCheckTree.map(item => {
                    if (item._id === configID) {
                        return newData
                    }
                    return item
                }))
                dataCheckTreeDefaultRef.current = dataCheckTreeDefaultRef.current.map(item => {
                    if (item._id === configID) {
                        dataCheckTreeDefaultObject.current[configID] = newData
                        return newData
                    }
                    return item
                })
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


    const closeDialog = () => {
        onClose({
            isOpen: false,
            dataChange: dataChangeRef.current
        })
        reset()
    }

    useEffect(() => {
        if (symbolGroupDataList.label === "Spot") {
            handleGetSpotDataList()
        }
        else {
            handleGetMarginDataList()
        }
    }, []);


    return (
        <DialogCustom
            dialogTitle="Update Config"
            open={true}
            onClose={() => { closeDialog() }}
            onSubmit={handleSubmit(handleSubmitCreate)}
            maxWidth="sm"
            submitBtnText='Update'
        >

            <form className={styles.dialogForm}>

                <FormControl className={styles.formControl}>

                    <FormLabel className={styles.label}>Bot</FormLabel>
                    <TextField
                        variant="outlined"
                        value={dataInput.botID?.botName}
                        size="medium"
                        disabled
                    >
                    </TextField>

                </FormControl>

                <FormControl
                    className={clsx(styles.formControl, styles.formMainDataItem)}
                >
                    <FormLabel className={styles.label}>Label</FormLabel>
                    <TextField
                        defaultValue={dataInput.Label}
                        variant="outlined"
                        size="small"
                        {...register("Label",)}
                    >
                    </TextField>
                    {errors.Label?.type === 'required' && <p className="formControlErrorLabel">The Label Required.</p>}
                </FormControl>

                <FormControl className={styles.formControl}>
                    <div style={{ display: "flex", "justifyContent": "space-between", alignItems: "center" }}>
                        <FormLabel className={styles.label}>Only pairs</FormLabel>
                        <span style={{ marginRight: "6px" }}>
                            {
                                !loadingSyncCoin ?
                                    <CloudSyncIcon
                                        style={{
                                            cursor: "pointer",
                                            color: "#959595"
                                        }}
                                        onClick={handleSyncSymbol} />
                                    :
                                    <CircularProgress style={{ width: "16px", height: "16px" }} />
                            }
                        </span>
                    </div>
                    <Autocomplete
                        multiple
                        limitTags={2}
                        value={onlyPairsSelected}
                        disableCloseOnSelect
                        options={symbolGroupDataList.list}
                        size="small"
                        getOptionLabel={(option) => option.name}
                        onChange={(e, value) => {
                            setOnlyPairsSelected(value)
                        }}
                        isOptionEqualToValue={(option, value) => option.value === value.value}
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
                                                setOnlyPairsSelected(symbolGroupDataList.list)
                                            }}
                                        >
                                            Select All
                                        </Button>
                                        <Button
                                            color="inherit"
                                            style={{ width: '50%' }}
                                            onClick={() => {
                                                setOnlyPairsSelected([])
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
                    {isSubmitted && !onlyPairsSelected.length && <p className="formControlErrorLabel">The Only pairs Required.</p>}

                </FormControl>
                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>Blacklist</FormLabel>
                    <Autocomplete
                        multiple
                        limitTags={2}
                        value={blackListSelected}
                        disableCloseOnSelect
                        options={symbolGroupDataList.list}
                        size="small"
                        isOptionEqualToValue={(option, value) => option.value === value.value}
                        getOptionLabel={(option) => option.name}
                        onChange={(e, value) => {
                            setBlackListSelected(value)
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
                                                setBlackListSelected(symbolGroupDataList.list)
                                            }}
                                        >
                                            Select All
                                        </Button>
                                        <Button
                                            color="inherit"
                                            style={{ width: '50%' }}
                                            onClick={() => {
                                                setBlackListSelected([])
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
                    {/* {isSubmitted && !blackListSelected.length && <p className="formControlErrorLabel">The Blacklist Required.</p>} */}

                </FormControl>

                <div className={styles.formMainData}>
                    <FormControl
                        className={clsx(styles.formControl, styles.formMainDataItem)}
                    >
                        <TextField
                            label="Market"
                            variant="outlined"
                            value={dataInput.Market}
                            size="medium"
                            disabled
                        >

                        </TextField>
                    </FormControl>
                    <FormControl
                        className={clsx(styles.formControl, styles.formMainDataItem)}
                    >
                        <TextField
                            label="Position side"
                            variant="outlined"
                            value={dataInput.PositionSide}
                            size="medium"
                            disabled
                        >

                        </TextField>
                    </FormControl>


                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="OC"
                            variant="outlined"
                            defaultValue={dataInput.OrderChange}
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
                            label="Elastic"
                            variant="outlined"
                            defaultValue={dataInput.Elastic}
                            size="medium"
                            InputProps={{
                                endAdornment: <InputAdornment position="end">
                                    %
                                </InputAdornment>
                            }}
                            {...register("Elastic")}
                        />

                    </FormControl>


                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Amount"
                            variant="outlined"
                            defaultValue={dataInput.Amount}
                            size="medium"
                            InputProps={{
                                endAdornment: <InputAdornment position="end">
                                    USDT
                                </InputAdornment>
                            }}
                            {...register("Amount", { required: true, min: formControlMinValue })}
                        />
                        {errors.Amount?.type === 'required' && <p className="formControlErrorLabel">The Amount Required.</p>}
                        {errors.Amount?.type === "min" && <p className="formControlErrorLabel">The Amount must bigger 0.01.</p>}

                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Numbs"
                            variant="outlined"
                            defaultValue={dataInput.Numbs}
                            size="medium"
                            // InputProps={{
                            //     endAdornment: <InputAdornment position="end">
                            //         %
                            //     </InputAdornment>
                            // }}
                            {...register("Numbs", { required: true, min: formControlMinValue })}
                        />
                        {errors.Numbs?.type === 'required' && <p className="formControlErrorLabel">The Numbs Required.</p>}
                        {errors.Numbs?.type === "min" && <p className="formControlErrorLabel">The Numbs must bigger 0.01.</p>}

                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Expire"
                            variant="outlined"
                            defaultValue={dataInput.Expire}
                            size="medium"
                            InputProps={{
                                endAdornment: <InputAdornment position="end">
                                    min
                                </InputAdornment>
                            }}
                            {...register("Expire")}
                        />

                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Limit"
                            variant="outlined"
                            defaultValue={dataInput.Limit}
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
                            label="Turnover"
                            variant="outlined"
                            defaultValue={dataInput.Turnover}
                            size="medium"
                            InputProps={{
                                endAdornment: <InputAdornment position="end">
                                    USDT
                                </InputAdornment>
                            }}
                            {...register("Turnover",)}
                        />

                    </FormControl>
                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>

                        <FormLabel className={styles.label}>IsActive</FormLabel>
                        <Switch
                            defaultChecked={dataInput.IsActive}
                            {...register("IsActive")}
                        />
                    </FormControl>
                </div>


            </form>
        </DialogCustom>
    );
}

export default UpdateStrategy;