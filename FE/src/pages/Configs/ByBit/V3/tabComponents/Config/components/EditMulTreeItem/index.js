import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useEffect, useMemo, useState } from "react";
import { Autocomplete, Button, Checkbox, FormControl, FormControlLabel, MenuItem, Radio, RadioGroup, Select, Table, TableBody, TableCell, TableHead, TableRow, TextField } from "@mui/material";
import { useDispatch, useSelector } from 'react-redux';
import { verifyTokenVIP } from '../../../../../../../../services/authService';
import { getAllBotActive } from '../../../../../../../../services/botService';
import { updateStrategiesMultiple, deleteStrategiesMultiple, copyMultipleStrategiesToSymbol, copyMultipleStrategiesToBot, getAllSymbol } from '../../../../../../../../services/dataCoinByBitService';
import { getUserByID } from '../../../../../../../../services/userService';
import { setStrategiesHistoryData } from '../../../../../../../../store/slices/StrategiesHistory';
import DialogCustom from '../../../../../../../../components/DialogCustom';
import { addMessageToast } from '../../../../../../../../store/slices/Toast';

function EditMulTreeItem({
    onClose,
    botListInput,
    dataCheckTreeSelected,
    dataCheckTreeDefaultRef
}) {

    const userData = useSelector(state => state.userDataSlice.userData)

    const compareFilterListDefault = [
        "=",
        "+",
        "-",
        "=%",
        "+%",
        "-%",
    ]

    const fieldFilterList = [

        {
            data: {
                compare: "=",
                value: ""
            },
            name: "Amount",
            value: "Amount",
            compareFilterList: compareFilterListDefault,
        },
        {
            data: {
                compare: "=",
                value: ""
            },
            name: "OC",
            value: "OrderChange",
            compareFilterList: compareFilterListDefault,
        },
        {
            data: {
                compare: "=",
                value: ""
            },
            name: "Extended",
            value: "ExtendedOCPercent",
            compareFilterList: compareFilterListDefault,

        },

        {
            data: {
                compare: "=",
                value: ""
            },
            name: "TP",
            value: "TakeProfit",
            compareFilterList: compareFilterListDefault,

        },
        {
            data: {
                compare: "=",
                value: ""
            },
            name: "Reduce",
            value: "ReduceTakeProfit",
            compareFilterList: compareFilterListDefault,
        },
        {
            data: {
                compare: "=",
                value: ""
            },
            name: "Ignore",
            value: "Ignore",
            compareFilterList: compareFilterListDefault,
        },
        {
            data: {
                compare: "=",
                value: false
            },
            name: "Active",
            value: "IsActive",
            compareFilterList: ["="],
        },
        {
            data: {
                compare: "=",
                value: ""
            },
            name: "EntryTrailing",
            value: "EntryTrailing",
            compareFilterList: compareFilterListDefault,
        },
        {
            data: {
                compare: "=",
                value: ""
            },
            name: "Max OC (%)",
            value: "StopLose",
            compareFilterList: compareFilterListDefault,
        },
    ]

    const dispatch = useDispatch()



    const [copyType, setCopyType] = useState("Symbol");
    const [symbolListData, setSymbolListData] = useState([]);
    const [symbolListSelected, setSymbolListSelected] = useState([]);

    // const [botListData, setBotListData] = useState([]);
    const [botLisSelected, setBotLisSelected] = useState([]);
    const [botListInputVIP, setBotListInputVIP] = useState([]);

    const [filterDataRowList, setFilterDataRowList] = useState([fieldFilterList[1]]);
    const [radioValue, setRadioValue] = useState("Update");
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [roleNameMainVIP, setRoleNameMainVIP] = useState("");

    const handleDataCheckTreeSelected = useMemo(() => {
        return dataCheckTreeSelected.map(item => JSON.parse(item))
    }, [dataCheckTreeSelected])

    const handleVerifyLogin = async () => {
        try {
            const res = await verifyTokenVIP({
                token: localStorage.getItem("tk_crypto")
            })
            const userData = res.data.data

            const resUser = await getUserByID(userData._id)
            const { data: resUserData } = resUser.data
            setRoleNameMainVIP(resUserData.roleName === "SuperAdmin" || resUserData.roleName === "Admin")
        } catch (error) {
            dispatch(addMessageToast({
                status: 500,
                message: "Get Role User Main Error",
            }))
        }
    }
    const handleGetAllBot = async () => {
        try {
            const res = await getAllBotActive("ByBitV3")
            const { data: resUserData } = res.data
            setBotListInputVIP(resUserData.map(item => ({
                name: item.botName,
                value: item._id
            })))

        } catch (error) {
            dispatch(addMessageToast({
                status: 500,
                message: "Get Role User Main Error",
            }))
        }
    }



    const addFilterRow = () => {
        setFilterDataRowList(filterRowList => [
            ...filterRowList,
            fieldFilterList[0]
        ])
    }

    const handleChangeRatioCopy = (e) => {
        const value = e.target.value
        setCopyType(value)
    }

    const deleteFilterRow = (indexRow) => {
        setFilterDataRowList(filterRowList => filterRowList.filter((value, index) => index !== indexRow))
    }

    const handleChangeValue = (value, indexInput) => {

        setFilterDataRowList(filterDataRowList => filterDataRowList.map((item, index) => {
            if (index === indexInput) {
                return {
                    ...item,
                    data: {
                        ...item.data,
                        value: value
                    }
                }
            }
            return item
        }))
    }

    const handleFiledValueElement = (item, indexRow) => {
        switch (item.name) {
            case "Active":
                return <Checkbox
                    checked={item.data.value}
                    onChange={(e) => {
                        handleChangeValue(e.target.checked, indexRow)
                    }}
                />
            default:
                return <TextField
                    type='number'
                    value={item.data.value}
                    onChange={(e) => { handleChangeValue(e.target.value, indexRow) }}
                    size="small"
                    style={{
                        width: "100%"
                    }}
                >
                </TextField>
        }
    }

    const handleChangeField = (itemInput, indexInput) => {

        setFilterDataRowList(filterDataRowList => filterDataRowList.map((item, index) => {
            if (index === indexInput) {
                return itemInput
            }
            return item
        }))
    }

    const handleChangeCompare = (compareValue, indexInput) => {

        setFilterDataRowList(filterDataRowList => filterDataRowList.map((item, index) => {
            if (index === indexInput) {
                return {
                    ...item,
                    data: {
                        ...item.data,
                        compare: compareValue
                    }
                }
            }
            return item
        }))
    }

    const handleCompare = (valueDefault, compareValue, valueChange) => {
        if (typeof (valueChange) === "string") {
            valueChange = +valueChange
        }
        if (typeof (valueDefault) === "string") {
            valueDefault = +valueDefault
        }
        switch (compareValue) {
            case "=":
                return valueChange

            case "+":
                return valueDefault + valueChange

            case "-":
                return valueDefault - valueChange

            case "=%":
                return valueDefault * valueChange / 100

            case "+%":
                return valueDefault * (100 + valueChange) / 100
            case "-%":
                return valueDefault * (100 - valueChange) / 100

            default:
                return false

        }
    }

    const handleUpdate = async () => {

        let checkValueMin = true

        try {
            const newData = handleDataCheckTreeSelected.map((dataCheckTreeItem) => (
                {
                    id: dataCheckTreeItem._id,
                    parentID: dataCheckTreeItem.parentID,
                    UpdatedFields: filterDataRowList.map(filterRow => {
                        let valueHandle = handleCompare(dataCheckTreeItem[filterRow.value], filterRow.data.compare, filterRow.data.value)
                        if (typeof (valueHandle) === "number") {
                            valueHandle = parseFloat(valueHandle.toFixed(4))
                            if (valueHandle < 0.1) {
                                checkValueMin = false
                            }
                        }
                        return {
                            [filterRow.value]: valueHandle
                        }
                    }).reduce((accumulator, currentObject) => {
                        const { parentID, ...oldData } = dataCheckTreeItem
                        return { ...oldData, ...accumulator, ...currentObject };
                    }, {})

                }
            ))

            if (checkValueMin) {
                setLoadingSubmit(true)

                dataCheckTreeDefaultRef.current.length > 0 && dispatch(setStrategiesHistoryData(dataCheckTreeDefaultRef.current))

                const res = await updateStrategiesMultiple(newData)

                const { status, message } = res.data

                dispatch(addMessageToast({
                    status: status,
                    message: message,
                }))
                if (status === 200) {
                    closeDialog(true)
                }
            }
            else {
                dispatch(addMessageToast({
                    status: 400,
                    message: "All Field Value >= 0.1",
                }))
            }
        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Update All Error",
            }))

        }
    }

    const handleDelete = async () => {

        setLoadingSubmit(true)

        let dataChange = false

        try {
            const newData = handleDataCheckTreeSelected.map((dataCheckTreeItem) => ({
                id: dataCheckTreeItem._id,
                parentID: dataCheckTreeItem.parentID,
            }))

            dataCheckTreeDefaultRef.current.length > 0 && dispatch(setStrategiesHistoryData(dataCheckTreeDefaultRef.current))

            const res = await deleteStrategiesMultiple(newData)

            const { status, message } = res.data

            dispatch(addMessageToast({
                status: status,
                message: message,
            }))
            dataChange = true

        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Delete All Error",
            }))
        }
        closeDialog(dataChange)
    }

    const handleExport = () => {
        dispatch(addMessageToast({
            status: 1,
            message: "Export"
        }))
    }

    const handleCopy = async () => {

        if (symbolListSelected.length > 0 || botLisSelected.length > 0) {
            let dataChange = false
            setLoadingSubmit(true)
            dataCheckTreeDefaultRef.current.length > 0 && dispatch(setStrategiesHistoryData(dataCheckTreeDefaultRef.current))

            try {
                let res
                if (copyType === "Symbol") {
                    res = await copyMultipleStrategiesToSymbol({
                        symbolListData: handleDataCheckTreeSelected,
                        symbolList: symbolListSelected.map(item => item.value)
                    })
                }
                else {
                    res = await copyMultipleStrategiesToBot({
                        symbolListData: handleDataCheckTreeSelected,
                        symbolList: botLisSelected.map(item => item.value)
                    })
                }
                const { status, message } = res.data

                dispatch(addMessageToast({
                    status: status,
                    message: message
                }))
                if (status === 200) {
                    dataChange = true
                }
            }
            catch (err) {
                dispatch(addMessageToast({
                    status: 500,
                    message: "Copy Strategies Error",
                }))
                setLoadingSubmit(false)
            }
            closeDialog(dataChange)
        }
    }

    const handleOnALL = async () => {
        setLoadingSubmit(true)
        let dataChange = false

        try {
            const newData = handleDataCheckTreeSelected.map((dataCheckTreeItem) => (
                {
                    id: dataCheckTreeItem._id,
                    parentID: dataCheckTreeItem.parentID,
                    UpdatedFields: {
                        ...dataCheckTreeItem,
                        IsActive: true
                    }

                }
            ))

            const res = await updateStrategiesMultiple(newData)

            const { status, message } = res.data

            dispatch(addMessageToast({
                status: status,
                message: message,
            }))
            dataChange = true

        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Update All Error",
            }))
        }
        closeDialog(dataChange)
    }

    const handleOffALL = async () => {
        setLoadingSubmit(true)
        let dataChange = false

        try {
            const newData = handleDataCheckTreeSelected.map((dataCheckTreeItem) => (
                {
                    id: dataCheckTreeItem._id,
                    parentID: dataCheckTreeItem.parentID,
                    UpdatedFields: {
                        ...dataCheckTreeItem,
                        IsActive: false
                    }

                }
            ))

            const res = await updateStrategiesMultiple(newData)

            const { status, message } = res.data

            dispatch(addMessageToast({
                status: status,
                message: message,
            }))
            if (status === 200) {
                dataChange = true
            }

        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Update All Error",
            }))
        }
        closeDialog(dataChange)
    }

    const handleEdit = () => {
        switch (radioValue) {
            case "Update":
                handleUpdate()
                break
            case "Delete":
                handleDelete()
                break
            case "Export":
                handleExport()
                break
            case "Copy":
                handleCopy()
                break
            case "ON":
                handleOnALL()
                break
            case "OFF":
                handleOffALL()
                break

        }
    }

    const handleChangeRatio = (e) => {
        setRadioValue(e.target.value)

    }


    const handleGetSymbolList = async () => {
        try {
            const res = await getAllSymbol()
            const { status, message, data: symbolListDataRes } = res.data

            if (status === 200) {
                const newSymbolList = symbolListDataRes.map(item => ({ name: item, value: item }))
                // const newSymbolList = symbolListDataRes.map(item => ({ name: item.split("USDT")[0], value: item }))

                setSymbolListData(newSymbolList)
            }
            else {
                dispatch(addMessageToast({
                    status,
                    message
                }))
            }
        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Get All Symbol Error",
            }))
        }
    }



    const handleRenderContentRadio = () => {
        switch (copyType) {
            case "Symbol":
                return <div>
                    <Autocomplete
                        multiple
                        limitTags={1}
                        value={symbolListSelected}
                        disableCloseOnSelect
                        options={symbolListData}
                        size="small"
                        getOptionLabel={(option) => option.name}
                        onChange={(e, value) => {
                            setSymbolListSelected(value)
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
                                                setSymbolListSelected(symbolListData)
                                            }}
                                        >
                                            Select All
                                        </Button>
                                        <Button
                                            color="inherit"
                                            style={{ width: '50%' }}
                                            onClick={() => {
                                                setSymbolListSelected([])
                                            }}
                                        >
                                            Deselect All
                                        </Button>
                                    </>
                                )}
                                <li {...props}>
                                    <Checkbox
                                        checked={selected || symbolListSelected.findIndex(item => item.value === option.value) > -1}
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
                    {!symbolListSelected.length && <p className="formControlErrorLabel">The {copyType} Required.</p>}
                </div>
            case "Bot":
                return <div>
                    <Autocomplete
                        multiple
                        limitTags={1}
                        value={botLisSelected}
                        disableCloseOnSelect
                        options={botListInput}
                        size="small"
                        getOptionLabel={(option) => option.name}
                        onChange={(e, value) => {
                            setBotLisSelected(value)
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
                                                setBotLisSelected(botListInput)
                                            }}
                                        >
                                            Select All
                                        </Button>
                                        <Button
                                            color="inherit"
                                            style={{ width: '50%' }}
                                            onClick={() => {
                                                setBotLisSelected([])
                                            }}
                                        >
                                            Deselect All
                                        </Button>
                                    </>
                                )}
                                <li {...props}>
                                    <Checkbox
                                        checked={selected || botLisSelected.findIndex(item => item.value === option.value) > -1}
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
                    {!botLisSelected.length && <p className="formControlErrorLabel">The {copyType} Required.</p>}
                </div>
            case "BotVip":
                return roleNameMainVIP && <div>
                    <Autocomplete
                        multiple
                        limitTags={1}
                        value={botLisSelected}
                        disableCloseOnSelect
                        options={botListInputVIP}
                        size="small"
                        getOptionLabel={(option) => option.name}
                        onChange={(e, value) => {
                            setBotLisSelected(value)
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
                                                setBotLisSelected(botListInputVIP)
                                            }}
                                        >
                                            Select All
                                        </Button>
                                        <Button
                                            color="inherit"
                                            style={{ width: '50%' }}
                                            onClick={() => {
                                                setBotLisSelected([])
                                            }}
                                        >
                                            Deselect All
                                        </Button>
                                    </>
                                )}
                                <li {...props}>
                                    <Checkbox
                                        checked={selected || botLisSelected.findIndex(item => item.value === option.value) > -1}
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
                    {!botLisSelected.length && <p className="formControlErrorLabel">The {copyType} Required.</p>}
                </div>
        }
    }
    const handleElementWhenChangeRatio = () => {
        switch (radioValue) {
            case "Update":
                return <Table

                    sx={{
                        ".MuiTableCell-root": {
                            border: "none",
                            padding: "6px",
                            fontSize: '1.2rem'
                        },
                    }}>
                    <TableHead >
                        <TableRow>
                            <TableCell style={{ width: "16px" }}>
                                <AddCircleOutlineIcon
                                    style={{
                                        cursor: "pointer",
                                        verticalAlign: "bottom"
                                    }}
                                    onClick={addFilterRow}
                                />
                            </TableCell>
                            <TableCell>Field</TableCell>
                            <TableCell>Com</TableCell>
                            <TableCell>Value</TableCell>
                        </TableRow>

                    </TableHead>

                    <TableBody>
                        {
                            filterDataRowList.map((filterRow, indexRow) => (
                                <TableRow
                                    key={`${filterRow.value}-${indexRow}`}
                                >
                                    <TableCell
                                    >
                                        <DeleteOutlineIcon
                                            style={{
                                                cursor: "pointer",
                                                verticalAlign: "bottom"
                                            }}
                                            onClick={() => { deleteFilterRow(indexRow) }}
                                        />
                                    </TableCell>
                                    <TableCell
                                        style={{
                                            maxWidth: "150px",
                                            width: "150px"
                                        }}
                                    >
                                        <Select
                                            value={filterRow.value}
                                            size="small"
                                            style={{
                                                width: "100%",
                                            }}
                                        >
                                            {
                                                fieldFilterList.map((item) => (
                                                    <MenuItem
                                                        value={item.value}
                                                        key={item.value}
                                                        onClick={() => { handleChangeField(item, indexRow) }}
                                                    >{item.name}</MenuItem>
                                                ))
                                            }
                                        </Select>
                                    </TableCell>
                                    <TableCell
                                        style={{
                                            maxWidth: "80px",
                                            width: "80px"
                                        }}
                                    >
                                        {
                                            <Select
                                                size="small"
                                                style={{
                                                    width: "100%"
                                                }}
                                                value={filterRow.data.compare}
                                            >
                                                {
                                                    filterRow.compareFilterList.map(item => (
                                                        <MenuItem
                                                            value={item}
                                                            key={item}
                                                            onClick={() => { handleChangeCompare(item, indexRow) }}

                                                        >{item}</MenuItem>
                                                    ))
                                                }
                                            </Select>
                                        }
                                    </TableCell>
                                    <TableCell >
                                        {
                                            handleFiledValueElement(filterRow, indexRow)
                                        }
                                    </TableCell>
                                </TableRow>
                            ))
                        }
                    </TableBody>
                </Table>
            case "Delete":
                return <></>
            case "Export":
                return <></>
            case "Copy":
                return (
                    <div>
                        <FormControl style={{ marginBottom: "6px" }} >
                            <RadioGroup
                                defaultValue="Symbol"
                                onChange={handleChangeRatioCopy}
                                style={{
                                    display: "flex",
                                    flexDirection: "row"
                                }}
                            >
                                <FormControlLabel value="Symbol" control={<Radio />} label="Symbol" />
                                <FormControlLabel value="Bot" control={<Radio />} label="Bot" />
                                {roleNameMainVIP && <FormControlLabel value="BotVip" control={<Radio />} label="Bot VIP" style={{ color: "var(--blueLightColor)" }} />}
                            </RadioGroup>
                        </FormControl>
                        {handleRenderContentRadio()}
                    </div>
                )
            default:
                return <></>

        }
    }

    const closeDialog = (dataChange = false) => {
        onClose({
            isOpen: false,
            dataChange
        })
        setLoadingSubmit(false)
    }

    useEffect(() => {
        if (radioValue === "Copy") {
            handleGetSymbolList()
            handleVerifyLogin()
            handleGetAllBot()
        }
        // handleGetAllBot()
    }, [radioValue]);

    return (
        <DialogCustom
            open={true}
            onClose={() => { closeDialog(false) }}
            dialogTitle='Bulk'
            submitBtnText='Apply'
            maxWidth='sm'
            onSubmit={handleEdit}
            loading={loadingSubmit}
            hideCloseBtn
        >
            <p style={{
                fontWeight: "600",
                marginBottom: "6px",
                fontSize: "1.1rem",
            }}>{dataCheckTreeSelected.length} items selected</p>
            <div style={{
                padding: "6px 12px",
                margin: "12px 0",
                border: "1px solid #d5d5d5"
            }}>
                <RadioGroup
                    defaultValue={radioValue}
                    onChange={handleChangeRatio}
                    style={{
                        display: "flex",
                        flexWrap: "nowrap",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        margin: "0 -6px"
                    }}
                >
                    <div  >
                        <FormControlLabel value="Update" control={<Radio />} label="Update" />
                        <FormControlLabel value="Delete" control={<Radio />} label="Delete" />
                        <FormControlLabel value="Copy" control={<Radio />} label="Copy" />
                    </div>
                    <div >
                        <FormControlLabel value="ON" control={<Radio />} label="ON" />
                        <FormControlLabel value="OFF" control={<Radio />} label="OFF" />
                    </div>
                    {/* <FormControlLabel value="Export" control={<Radio />} label="Export" /> */}
                </RadioGroup>
            </div>

            {
                handleElementWhenChangeRatio()
            }

        </DialogCustom>);
}

export default EditMulTreeItem;