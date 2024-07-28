import { Button } from "@mui/material";
import AddBreadcrumbs from "../../components/BreadcrumbsCutom";
import { useState } from "react";
import axios from 'axios';
import { useDispatch } from "react-redux";
import { addMessageToast } from "../../store/slices/Toast";


function BackupData() {
    const [file, setFile] = useState(null);
    const dispatch = useDispatch()
    const onFileChange = (event) => {
        setFile(event.target.files[0]);
    };
    const onRestore = async () => {
        if (!file) {
            alert('Please select a file first.');
            return;
        }

        dispatch(addMessageToast({
            status:900,
            message:"Loading..."
        }))
        const formData = new FormData();
        formData.append('file', file);

        try {
            const api = axios.create({
                baseURL: `${process.env.REACT_APP_BASE_URL}`,
            });

            const response = await api.post('/lt/rs', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            const { status, message, data: resData } = response.data
            dispatch(addMessageToast({
                status,
                message
            }))
        } catch (error) {
            console.error('Error restoring database:', error);
            dispatch(addMessageToast({
                status: 500,
                message: error.message
            }))
        }
    };
    return (
        <div>
            <AddBreadcrumbs list={["BackupData"]} />
            <div>
                <input type="file" onChange={onFileChange} />
                {file && <Button variant="contained" onClick={onRestore}>Restore</Button>}
            </div>
        </div>
    );
}

export default BackupData;