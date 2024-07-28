import { Alert, Snackbar } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { closeToast } from "../../store/slices/Toast";

function ToastCustom({
}) {

    const { isOpen, status, message } = useSelector(state => state.toastSlice)
    const dispatch = useDispatch()

    const handleClose = () => {
        dispatch(closeToast())
    }

    const handleErrorType = () => {
        switch (status) {
            case 200:
                return "success"
            case 500:
                return "error"
            case 900:
                return "info"
            default:
                return "warning"
        }
    }
    return (
        <Snackbar
            open={isOpen}
            autoHideDuration={2000}
            onClose={handleClose}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}

        >
            <Alert
                onClose={handleClose}
                severity={handleErrorType()}
                variant="standard"
            >
                {message || "Error"}
            </Alert>
        </Snackbar>
    );
}

export default ToastCustom;