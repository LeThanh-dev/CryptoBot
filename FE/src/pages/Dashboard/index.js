import { Button } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { closeAllBotForUpCode } from "../../services/Configs/ByBIt/V3/configService";
import { addMessageToast } from "../../store/slices/Toast";
import { useState } from "react";
import DialogCustom from "../../components/DialogCustom";
import { closeAllBotForUpCodeV1 } from "../../services/Configs/ByBIt/V1/scannerService";

function Dashboard() {
    const dispatch = useDispatch()
    const userData = useSelector(state => state.userDataSlice.userData)
    const [confirmOFF, setConfirmOFF] = useState("");

    const handleCloseOffAll = async () => {
        let res
        switch (confirmOFF) {
            case "ByBitV3":
                res = await closeAllBotForUpCode()
                break;
            case "ByBitV1":
                res = await closeAllBotForUpCodeV1()
                break;
            default:
                return;
        }

        const { message } = res.data

        dispatch(addMessageToast({
            status: 200,
            message,
        }))
        setConfirmOFF("")
    }
    return (
        <div>
            <p>Dashboard</p>
            {userData.roleName === "SuperAdmin" && (
                <div>
                    <Button
                        variant="contained"
                        size="medium"
                        color="error"
                        onClick={() => {
                            setConfirmOFF("ByBitV3")
                        }}
                    >
                        Off ByBit V3
                    </Button>
                    <b><code>sdsd</code></b>
                    <Button
                        variant="contained"
                        size="medium"
                        color="warning"
                        onClick={() => {
                            setConfirmOFF("ByBitV1")
                        }}
                        style={{ marginLeft: "12px" }}
                    >
                        Off ByBit V1
                    </Button>
                </div>
            )
            }
            {
                confirmOFF && (
                    <DialogCustom
                        backdrop
                        open={true}
                        onClose={() => {
                            setConfirmOFF(false)
                        }}
                        onSubmit={handleCloseOffAll}
                        dialogTitle="The action requires confirmation"
                        submitBtnColor="error"
                        submitBtnText="Off"
                        reserveBtn
                        position="center"
                    >
                        <p style={{ textAlign: "center" }}>Do you want to off-all?</p>
                    </DialogCustom >
                )
            }
        </div>
    );
}

export default Dashboard;