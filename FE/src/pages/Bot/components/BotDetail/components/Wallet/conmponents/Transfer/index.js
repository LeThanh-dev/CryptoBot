import { FormControl, FormLabel, MenuItem, Select, TextField } from "@mui/material";
import styles from "./Transfer.module.scss"
import { useForm } from "react-hook-form";
import { memo, useState } from "react";
import DialogCustom from "../../../../../../../../components/DialogCustom";
import { balanceWallet } from "../../../../../../../../services/dataCoinByBitService";
import { useDispatch } from "react-redux";
import { addMessageToast } from "../../../../../../../../store/slices/Toast";
import { formatNumber } from "../../../../../../../../functions";

const botTypeList = [
    {
        name: "Spot->Future",
        value: false
    },
    {
        name: "Future->Spot",
        value: true
    }
]

function Transfer({
    open,
    botID,
    onClose,
    spotAvailableMax,
    futureAvailableMax
}, ref) {

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm();

    const dispatch = useDispatch()
    const [limitMaxSpotAvailable, setLimitMaxSpotAvailable] = useState(spotAvailableMax);

    const handleSubmitTransfer = async data => {
        try {

            const res = await balanceWallet({
                amount: +data.TransferAmount,
                futureLarger: data.TransferFrom === true ? true : false,
                botID
            })
            const { status, message, data: resData } = res.data

            if (status === 200) {
                dispatch(addMessageToast({
                    status: 200,
                    message: "Transfer Successful",
                }))
                status === 200 && closeDialog(true)
            }

            else {
                dispatch(addMessageToast({
                    status: 500,
                    message: "Transfer Error",
                }))
            }

        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Transfer Error",
            }))
        }
    }

    const closeDialog = (dataChange = false) => {
        onClose({
            isOpen: false,
            dataChange
        })
        reset()
    }

    return (
        <DialogCustom
            open={open}
            onClose={() => { closeDialog() }}
            onSubmit={handleSubmit(handleSubmitTransfer)}
            dialogTitle="Transfer"
        >

            <form className={styles.dialogForm}>
                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>TransferFrom</FormLabel>
                    <Select
                        defaultValue={botTypeList[0].value}
                        size="small"
                        {...register("TransferFrom", { required: true })}
                        onChange={e=>{
                            e.target.value ? setLimitMaxSpotAvailable(futureAvailableMax) : setLimitMaxSpotAvailable(spotAvailableMax)
                        }}
                    >
                        {
                            botTypeList.map(item => (
                                <MenuItem value={item.value} key={item.value}>{item.name}</MenuItem>
                            ))
                        }
                    </Select>
                </FormControl>
                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>TransferAmount</FormLabel>
                    <TextField
                        {...register("TransferAmount", { required: true, max: limitMaxSpotAvailable })}
                        type="number"
                        size="small"
                    />
                    {errors.TransferAmount?.type === 'required' && <p className="formControlErrorLabel">The TransferAmount Required.</p>}
                    {errors.TransferAmount?.type === 'max' && <p className="formControlErrorLabel">The TransferAmount field is not bigger {formatNumber(limitMaxSpotAvailable)}.</p>}

                </FormControl>


            </form>
        </DialogCustom >
    );
}

export default memo(Transfer);