import { NumericFormat } from 'react-number-format';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useEffect, useState } from "react";

import { Checkbox, MenuItem, Select, Table, TableBody, TableCell, TableHead, TableRow, TextField } from "@mui/material";
import DialogCustom from '../../../../../../components/DialogCustom';
import { handleCheckAllCheckBox } from '../../../../../../functions';

function FilterDialog({
    onClose,
    filterQuantityRef,
    dataCheckTreeDefaultRef,
    setDataCheckTree,
    resetAfterSuccess,
    botListInput
}) {

    const compareFilterListDefault = [
        "=",
        ">",
        "<",
        ">=",
        "<=",
    ]



    const positionValueList = [
        {
            name: "Long",
            value: "Long"
        },
        {
            name: "Short",
            value: "Short"
        }
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

    const fieldFilterList = [

        {
            data: {
                compare: "=",
                value: "Long"
            },
            name: "Position",
            value: "PositionSide",
            compareFilterList: ["="],
        },
        {
            data: {
                compare: "=",
                value: ""
            },
            name: "Frame",
            value: "Frame",
            compareFilterList: ["="],
        },
        {
            data: {
                compare: "=",
                value: ""
            },
            name: "Candle",
            value: "Candle",
            compareFilterList: ["="],
        },
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
            name: "Elastic",
            value: "Elastic",
            compareFilterList: compareFilterListDefault,

        },
        {
            data: {
                compare: "=",
                value: ""
            },
            name: "Turnover",
            value: "Turnover",
            compareFilterList: compareFilterListDefault,
        },
        {
            data: {
                compare: "=",
                value: ""
            },
            name: "Expire",
            value: "Expire",
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
                value: botListInput[0].name
            },
            name: "Bot",
            value: "Bot",
            compareFilterList: ["="],
        },
    ]

    const [filterDataRowList, setFilterDataRowList] = useState([]);

    const addFilterRow = () => {
        setFilterDataRowList(filterRowList => [
            ...filterRowList,
            fieldFilterList[1]
        ])
    }

    const deleteFilterRow = (indexRow) => {
        setFilterDataRowList(filterRowList => filterRowList.filter((value, index) => index !== indexRow))
    }

    const checkFloatString = value => {
        return !isNaN(parseFloat(value)) && isFinite(value);
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

    const handleCompare = (value1, compareValue, value2, filterValue) => {


        if (![
            "PositionSide",
            "Frame",
            "Candle",
            "IsActive",
            "Bot"
        ].includes(filterValue)) {
            value1 = +value1
            value2 = +value2
        }
        // if (checkFloatString(value1)) {
        //     value1 = +value1
        // }
        // if (checkFloatString(value2)) {
        //     value2 = +value2
        // }

        switch (compareValue) {
            case "=":
                return value1 == value2

            case ">":
                return value1 > value2

            case "<":
                return value1 < value2

            case ">=":
                return value1 >= value2

            case "<=":
                return value1 <= value2
            default:
                return false

        }
    }

    const handleFiledValueElement = (item, indexRow) => {
        switch (item.value) {
            case "PositionSide":
                return <Select
                    value={item.data.value}
                    defaultValue=""
                    size="small"
                    style={{
                        width: "100%"
                    }}
                >
                    {
                        positionValueList.map(item => (
                            <MenuItem value={item.value} key={item.value}
                                onClick={() => { handleChangeValue(item.value, indexRow) }}
                            >{item.name}</MenuItem>
                        ))
                    }
                </Select>
            case "Frame":
                return <Select
                    value={item.data.value}
                    defaultValue=""
                    size="small"
                    style={{
                        width: "100%"
                    }}
                >
                    {
                        candlestickList.map(item => (
                            <MenuItem value={item.value} key={item.value}
                                onClick={() => { handleChangeValue(item.value, indexRow) }}
                            >{item.name}</MenuItem>
                        ))
                    }
                </Select>

            case "Candle":
                return <Select
                    value={item.data.value}
                    defaultValue=""
                    size="small"
                    style={{
                        width: "100%"
                    }}
                >
                    {
                        candlestickList.map(item => (
                            <MenuItem value={item.value} key={item.value}
                                onClick={() => { handleChangeValue(item.value, indexRow) }}
                            >{item.name}</MenuItem>
                        ))
                    }
                </Select>

            case "IsActive":
                return <Checkbox
                    checked={item.data.value}
                    onChange={(e) => { handleChangeValue(e.target.checked, indexRow) }}
                />
            case "Bot":
                return <Select
                    value={item.data.value}
                    size="small"
                    style={{
                        width: "100%"
                    }}
                    onChange={(e) => { handleChangeValue(e.target.value, indexRow) }}
                >
                    {
                        botListInput.map(item => (
                            <MenuItem value={item.value} key={item.value}>{item.name}</MenuItem>
                        ))
                    }
                </Select>
            default:
                // return <TextField
                //     type='number'
                //     value={item.data.value}
                //     onChange={(e) => { handleChangeValue(e.target.value, indexRow) }}
                //     size="small"
                //     style={{
                //         width: "100%"
                //     }}
                // >
                // </TextField>
                return <NumericFormat
                    thousandSeparator
                    value={item.data.value}
                    type='text'
                    onChange={(e) => {
                        const value = Number.parseFloat(e.target.value.replace(/,/g, ''))
                        handleChangeValue(value, indexRow)
                    }}
                    style={{
                        width: "100%",
                        height: "40px",
                        outline: "none",
                        border: "1px solid #c4c4c4",
                        padding: "0 12px",
                        borderRadius: "6px"
                    }}

                >
                </NumericFormat>
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


    const handleFilter = () => {

        filterQuantityRef.current = filterDataRowList
        setDataCheckTree(filterDataRowList.length > 0
            ? dataCheckTreeDefaultRef.current.filter(dataItem => {
                return filterDataRowList.every(filterRow => {
                    if (filterRow.value !== "Bot") {
                        return handleCompare(dataItem[filterRow.value], filterRow.data.compare, filterRow.data.value, filterRow.value)
                    }
                    return handleCompare(dataItem.botID._id, filterRow.data.compare, filterRow.data.value, filterRow.value)
                })
            })
            : dataCheckTreeDefaultRef.current)
        handleCheckAllCheckBox(false)
        resetAfterSuccess()
        onClose()
    }

    useEffect(() => {
        const filterLength = filterQuantityRef.current.length
        if (filterLength > 0) {
            setFilterDataRowList(filterQuantityRef.current)
        } else {
            setFilterDataRowList([fieldFilterList[3]])
        }
    }, [filterQuantityRef]);


    return (
        <DialogCustom
            open={true}
            onClose={onClose}
            dialogTitle='Filter'
            submitBtnText='Apply'
            maxWidth='sm'
            onSubmit={handleFilter}
            hideCloseBtn
        >
            <Table

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
                                            width: "100%"
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
                                            value={filterRow.data.compare}
                                            style={{
                                                width: "100%"
                                            }}
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

        </DialogCustom >);
}

export default FilterDialog;