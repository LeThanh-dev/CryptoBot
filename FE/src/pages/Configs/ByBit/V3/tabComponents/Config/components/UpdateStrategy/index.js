import { useForm } from "react-hook-form";
import { FormControl, FormLabel, Switch, TextField } from "@mui/material";
import clsx from "clsx";
import styles from "../CreateStrategy/CreateStrategy.module.scss"
import { useDispatch } from "react-redux";
import { useRef } from "react";
import DialogCustom from "../../../../../../../../components/DialogCustom";
import { updateStrategiesByID } from "../../../../../../../../services/Configs/ByBIt/V3/configService";
import { addMessageToast } from "../../../../../../../../store/slices/Toast";

function UpdateStrategy({
    onClose,
    treeNodeValue,
    symbolValue,
    handleUpdateDataAfterSuccess
}) {
    const formControlMinValue= .1

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm();

    const dispatch = useDispatch()

    const formDataChangeRef = useRef(false)

    const handleSubmitUpdate = async data => {
        let dataChange = false
        if (formDataChangeRef.current) {

            const { parentID, ...dataTreeNode } = treeNodeValue

            const newData = {
                ...dataTreeNode,
                ...data
            }

            try {
                const res = await updateStrategiesByID({
                    id: newData._id,
                    data: {
                        parentID,
                        newData,
                        symbol:symbolValue
                    }
                })
                const { status, message } = res.data

                dispatch(addMessageToast({
                    status: status,
                    message: message,
                }))
                if (status === 200) {
                    dataChange = true
                    handleUpdateDataAfterSuccess(newData)
                }

            }
            catch (err) {
                dispatch(addMessageToast({
                    status: 500,
                    message: "Edit Error",
                }))
            }
        }
        closeDialog(dataChange)

    }

    const closeDialog = (dataChange = false) => {
        onClose({
            isOpen: false,
            dataChange
        })
    }


    return (
        <DialogCustom
            dialogTitle="Update Strategy"
            open={true}
            onClose={() => { closeDialog() }}
            onSubmit={handleSubmit(handleSubmitUpdate)}
            maxWidth="sm"
        >

            <form className={styles.dialogForm} onChange={e => {
                formDataChangeRef.current = true
            }}>

                <FormControl
                    className={clsx(styles.formControl, styles.formMainDataItem)}
                >
                    <FormLabel className={styles.label}>Bot</FormLabel>
                    <TextField
                        variant="outlined"
                        value={treeNodeValue.botID?.botName}
                        size="medium"
                        disabled
                    >
                    </TextField>
                </FormControl>

                <FormControl
                    className={clsx(styles.formControl, styles.formMainDataItem)}
                >
                    <FormLabel className={styles.label}>Symbol</FormLabel>
                    <TextField
                        variant="outlined"
                        value={symbolValue}
                        size="medium"
                        disabled
                    >
                    </TextField>
                </FormControl>

                <div className={styles.formMainData}>
                    <FormControl
                        className={clsx(styles.formControl, styles.formMainDataItem)}
                    >
                        <TextField
                            label="PositionSide"
                            variant="outlined"
                            value={treeNodeValue.PositionSide}
                            size="medium"
                            disabled
                        />
                    </FormControl>
                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            label="Candlestick"
                            variant="outlined"
                            value={treeNodeValue.Candlestick}
                            size="medium"
                            disabled
                        />
                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Order change"
                            variant="outlined"
                            defaultValue={treeNodeValue.OrderChange}
                            size="medium"
                            {...register("OrderChange", { required: true, min: formControlMinValue })}
                        />
                        {errors.OrderChange?.type === 'required' && <p className="formControlErrorLabel">The Order Change Required.</p>}
                        {errors.OrderChange?.type === "min" && <p className="formControlErrorLabel">The OC must bigger 0.1.</p>}

                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Extended OC percent"
                            variant="outlined"
                            defaultValue={treeNodeValue.ExtendedOCPercent}
                            size="medium"
                            {...register("ExtendedOCPercent", { required: true, min: formControlMinValue })}
                        />
                        {errors.ExtendedOCPercent?.type === 'required' && <p className="formControlErrorLabel">The Extended OC percent Required.</p>}
                        {errors.ExtendedOCPercent?.type === "min" && <p className="formControlErrorLabel">The Extended must bigger 0.1.</p>}

                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Take profit"
                            variant="outlined"
                            defaultValue={treeNodeValue.TakeProfit}
                            size="medium"
                            {...register("TakeProfit", { required: true, min: formControlMinValue })}
                        />
                        {errors.TakeProfit?.type === 'required' && <p className="formControlErrorLabel">The Take profit Required.</p>}
                        {errors.TakeProfit?.type === "min" && <p className="formControlErrorLabel">The TP must bigger 0.1.</p>}

                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Reduce take profit"
                            variant="outlined"
                            defaultValue={treeNodeValue.ReduceTakeProfit}
                            size="medium"
                            {...register("ReduceTakeProfit", { required: true, min: formControlMinValue })}
                        />
                        {errors.ReduceTakeProfit?.type === 'required' && <p className="formControlErrorLabel">The Reduce take profit Required.</p>}
                        {errors.ReduceTakeProfit?.type === "min" && <p className="formControlErrorLabel">The Reduce TP must bigger 0.1.</p>}

                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Amount"
                            variant="outlined"
                            defaultValue={treeNodeValue.Amount}
                            size="medium"
                            {...register("Amount", { required: true, min: formControlMinValue })}
                        />
                        {errors.Amount?.type === 'required' && <p className="formControlErrorLabel">The Amount Required.</p>}
                        {errors.Amount?.type === "min" && <p className="formControlErrorLabel">The Amount must bigger 0.1.</p>}

                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Ignore"
                            variant="outlined"
                            defaultValue={treeNodeValue.Ignore}
                            size="medium"
                            {...register("Ignore", { required: true, min: formControlMinValue })}
                        />
                        {errors.Ignore?.type === 'required' && <p className="formControlErrorLabel">The Ignore Required.</p>}
                        {errors.Ignore?.type === "min" && <p className="formControlErrorLabel">The Ignore must bigger 0.1.</p>}

                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Entry Trailing"
                            variant="outlined"
                            size="medium"
                            defaultValue={treeNodeValue.EntryTrailing}
                            {...register("EntryTrailing", { min: formControlMinValue })}
                        />
                        {/* {errors.EntryTrailing?.type === 'required' && <p className="formControlErrorLabel">The Entry Trailing Required.</p>} */}

                    </FormControl>

                    <FormControl className={clsx(styles.formControl, styles.formMainDataItem)}>
                        <TextField
                            type='number'
                            label="Max OC (%)"
                            variant="outlined"
                            defaultValue={treeNodeValue.StopLose}
                            size="medium"
                            {...register("StopLose", { required: true, min: formControlMinValue })}
                        />
                        {errors.StopLose?.type === 'required' && <p className="formControlErrorLabel">The Max OC Required.</p>}
                        {errors.StopLose?.type === "min" && <p className="formControlErrorLabel">The Max OC must bigger 0.1.</p>}

                    </FormControl>

                    <FormControl className={clsx(styles.formControl)} style={{ flexBasis: "48%" }}>

                        <FormLabel className={styles.label}>IsActive</FormLabel>
                        <Switch
                            defaultChecked={treeNodeValue.IsActive}
                            title="IsActive"
                            {...register("IsActive")}

                        />
                    </FormControl>


                    <FormControl className={clsx(styles.formControl)} style={{ flexBasis: "48%" }}>
                        <FormLabel className={styles.label}>Remember</FormLabel>
                        <Switch
                            defaultChecked={treeNodeValue.Remember}
                            title="Remember"
                            {...register("Remember")}

                        />
                    </FormControl>
                </div>


            </form>
        </DialogCustom>
    );
}

export default UpdateStrategy;