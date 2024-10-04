
import { FormControl, FormLabel, TextField, Switch, InputAdornment } from "@mui/material";
import clsx from "clsx";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import DialogCustom from "../../../../../../../../components/DialogCustom";
import { addMessageToast } from "../../../../../../../../store/slices/Toast";
import styles from "../CreateStrategy/CreateStrategy.module.scss"
import { updateStrategiesSpotByID } from "../../../../../../../../services/Configs/ByBIt/V1/marginService";

function UpdateStrategy({
    onClose,
    treeNodeValue,
    symbolValue,
    handleUpdateDataAfterSuccess
}) {
    const formControlMinValue = 0.01

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
                const res = await updateStrategiesSpotByID({
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
                            type='number'
                            label="OC"
                            variant="outlined"
                            defaultValue={treeNodeValue.OrderChange}
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
                            defaultValue={treeNodeValue.Amount}
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
                            label="Auto amount percent"
                            variant="outlined"
                            defaultValue={treeNodeValue.AmountAutoPercent}
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
                            defaultValue={treeNodeValue.Expire}
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
                            defaultValue={treeNodeValue.Limit}
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
                            defaultValue={treeNodeValue.AmountIncreaseOC}
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
                            defaultValue={treeNodeValue.AmountExpire}
                            size="medium"
                            InputProps={{
                                endAdornment: <InputAdornment position="end">
                                    min
                                </InputAdornment>
                            }}
                            {...register("AmountExpire", )}
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
                                defaultChecked={treeNodeValue.IsActive}
                                title="IsActive"
                                {...register("IsActive")}
                            />
                        </FormControl>

                        <FormControl className={clsx(styles.formControl)}>
                            <FormLabel className={styles.label}>Adaptive</FormLabel>
                            <Switch
                                defaultChecked={treeNodeValue.Adaptive}
                                title="Adaptive"
                                {...register("Adaptive")}

                            />
                        </FormControl>

                        <FormControl className={clsx(styles.formControl)}>
                            <FormLabel className={styles.label}>Reverse</FormLabel>
                            <Switch
                                defaultChecked={treeNodeValue.Reverse}
                                title="Reverse"
                                {...register("Reverse")}

                            />
                        </FormControl>

                        <FormControl className={clsx(styles.formControl)}>
                            <FormLabel className={styles.label}>Remember</FormLabel>
                            <Switch
                                defaultChecked={treeNodeValue.Remember}
                                title="Remember"
                                {...register("Remember")}

                            />
                        </FormControl>
                    </div>

                </div>


            </form>
        </DialogCustom>
    );
}

export default UpdateStrategy;