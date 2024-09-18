import CloudSyncIcon from '@mui/icons-material/CloudSync';
import { FormControl, FormLabel, Autocomplete, TextField, Button, Checkbox, MenuItem, Switch, InputAdornment, CircularProgress } from "@mui/material"
import clsx from "clsx"
import { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useDispatch } from "react-redux"
import DialogCustom from "../../../../../../components/DialogCustom"
import { addMessageToast } from "../../../../../../store/slices/Toast"
import styles from "./CreateStrategy.module.scss"
import { getAllSymbolSpot, syncSymbolSpot } from '../../../../../../services/spotService';
import { getAllSymbolSpot as getAllSymbolMargin, syncSymbolSpot as syncSymbolMargin } from '../../../../../../services/marginService';
import { createConfigScannerV3 } from '../../../../../../services/scannerV3Service';
import { getAllSymbol, syncSymbol } from '../../../../../../services/dataCoinByBitService';

function CreateStrategy({
    botListInput,
    onClose,
}) {

    const formControlMinValue = 0.01

    const positionSideListDefault = [
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
    ]



    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitted },
        setValue
    } = useForm();

    const [onlyPairsSelected, setOnlyPairsSelected] = useState([])
    const [blackListSelected, setBlackListSelected] = useState([])
    const [botList, setBotList] = useState([])
    const [loadingSyncCoin, setLoadingSyncCoin] = useState(false);

    const dataChangeRef = useRef(false)
    const spotDataListRef = useRef([])


    const [symbolGroupDataList, setSymbolGroupDataList] = useState({
        list: []
    });

    const dispatch = useDispatch()

    const handleGetStrategyDataList = async (syncNew = true) => {
        try {
            const res = await getAllSymbol()
            const { data: symbolListDataRes } = res.data
            const newData = symbolListDataRes.map(item => ({ name: item, value: item }))

            setBlackListSelected([])
            setOnlyPairsSelected([])
            setSymbolGroupDataList(
                {
                    list: newData
                }
            )
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
                const res = await syncSymbol()
                handleGetStrategyDataList()
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

        if (onlyPairsSelected.length > 0 && botList.length > 0) {

            try {
                const res = await createConfigScannerV3({
                    data: data,
                    botListId: botList.map(item => item.value),
                    Blacklist: blackListSelected.map(item => item.value),
                    OnlyPairs: onlyPairsSelected.map(item => item.value)
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

        try {
            const res = await createConfigScannerV3({
                data: data,
                botListId: botList.map(item => item.value),
                Blacklist: blackListSelected.map(item => item.value),
                OnlyPairs: onlyPairsSelected.map(item => item.value)
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

    const closeDialog = () => {
        onClose({
            isOpen: false,
            dataChange: dataChangeRef.current
        })
        reset()
    }

    useEffect(() => {
        handleGetStrategyDataList()
    }, []);


    return (
        <DialogCustom
            dialogTitle="Create Config"
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

                <FormControl
                    className={clsx(styles.formControl, styles.formMainDataItem)}
                >
                    <FormLabel className={styles.label}>Label</FormLabel>
                    <TextField
                        variant="outlined"
                        size="small"
                        {...register("Label", { required: true, })}
                    >
                    </TextField>
                    {errors.Label?.type === 'required' && <p className="formControlErrorLabel">The Label field is required.</p>}
                </FormControl>

                <div className={styles.formMainData} style={{ marginTop: "12px" }}>
                    <FormControl
                        className={clsx(styles.formControl, styles.formMainDataItem)}
                    >
                        <TextField
                            select
                            label="Frame"
                            variant="outlined"
                            size="medium"
                            defaultValue={"15m"}
                            {...register("Frame", { required: true, })}
                        >
                            {
                                candlestickList.map(item => (
                                    <MenuItem value={item?.value} key={item?.value}>{item?.name}</MenuItem>
                                ))
                            }
                        </TextField>
                        {errors.Frame?.type === 'required' && <p className="formControlErrorLabel">The Frame field is required.</p>}
                    </FormControl>

                    <FormControl
                        className={clsx(styles.formControl, styles.formMainDataItem)}
                    >
                        <TextField
                            select
                            label="Candle"
                            variant="outlined"
                            size="medium"
                            {...register("Candle", { required: true, })}
                        >
                            {
                                candlestickList.map(item => (
                                    <MenuItem value={item?.value} key={item?.value}>{item?.name}</MenuItem>
                                ))
                            }
                        </TextField>
                        {errors.Candle?.type === 'required' && <p className="formControlErrorLabel">The Candle field is required.</p>}
                    </FormControl>

                </div>

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
                                        checked={selected || onlyPairsSelected.findIndex(item => item === option.value) > -1}
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
                    {isSubmitted && !onlyPairsSelected.length && <p className="formControlErrorLabel">The Only pairs field is required.</p>}

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
                                        checked={selected || blackListSelected.findIndex(item => item === option.value) > -1}
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
                    {/* {isSubmitted && !blackListSelected.length && <p className="formControlErrorLabel">The Blacklist field is required.</p>} */}

                </FormControl>

                <div className={styles.formMainData} style={{ marginTop: "6px" }}>

                    <FormControl
                        className={clsx(styles.formControl, styles.formMainDataItem)}
                    >
                        <TextField
                            select
                            label="Position side"
                            variant="outlined"
                            size="medium"
                            {...register("PositionSide", { required: true, })}
                        >
                            {
                                positionSideListDefault.map(item => (
                                    <MenuItem value={item?.value} key={item?.value}>{item?.name}</MenuItem>
                                ))
                            }
                        </TextField>
                        {errors.PositionSide?.type === 'required' && <p className="formControlErrorLabel">The Position field is required.</p>}
                    </FormControl>


                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="OC"
                            variant="outlined"
                            defaultValue={1}
                            size="medium"
                            InputProps={{
                                endAdornment: <InputAdornment position="end">
                                    %
                                </InputAdornment>,
                            }}
                            {...register("OrderChange", { required: true, min: formControlMinValue })}
                        />
                        {errors.OrderChange?.type === 'required' && <p className="formControlErrorLabel">The OC field is required.</p>}
                        {errors.OrderChange?.type === "min" && <p className="formControlErrorLabel">The OC must bigger 0.01.</p>}
                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            label="Longest_% || Elastic || Ratio_%"
                            variant="outlined"
                            defaultValue={"20-80-30"}
                            size="medium"
                            InputProps={{
                                endAdornment: <InputAdornment position="end">
                                    %
                                </InputAdornment>
                            }}
                            {...register("Elastic", {
                                required: true,
                                pattern: {
                                    value: /^\d+-\d+-\d+$/,
                                    message: 'Input must match the pattern a-b-c where a, b, and c are numbers',
                                }
                            })}
                        />
                        {errors.Elastic?.type === 'required' && <p className="formControlErrorLabel">The Elastic field is required.</p>}
                        {errors.Elastic?.type === 'pattern' && <p className="formControlErrorLabel">The Elastic pattern num-num-num.</p>}

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
                                    %
                                </InputAdornment>
                            }}
                            {...register("Amount", { required: true, min: formControlMinValue })}
                        />
                        {errors.Amount?.type === 'required' && <p className="formControlErrorLabel">The Amount field is required.</p>}
                        {errors.Amount?.type === "min" && <p className="formControlErrorLabel">The Amount must bigger 0.01.</p>}

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
                            {...register("Expire")}
                        />

                    </FormControl>


                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Turnover Avg"
                            variant="outlined"
                            defaultValue={4000}
                            size="medium"
                            InputProps={{
                                endAdornment: <InputAdornment position="end">
                                    USDT
                                </InputAdornment>
                            }}
                            {...register("Turnover", { required: true, min: formControlMinValue })}
                        />
                        {errors.Turnover?.type === 'required' && <p className="formControlErrorLabel">The Turnover Avg field is required.</p>}
                        {errors.Turnover?.type === "min" && <p className="formControlErrorLabel">The Turnover Avg must bigger 0.01.</p>}

                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>

                        <FormLabel className={styles.label}>IsActive</FormLabel>
                        <Switch
                            defaultChecked
                            title="IsActive"
                            {...register("IsActive")}
                        />
                    </FormControl>
                </div>


            </form>
        </DialogCustom>
    );
}

export default CreateStrategy;