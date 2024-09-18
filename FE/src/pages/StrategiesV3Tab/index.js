import { Tabs, Tab } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";


function StrategiesV3Tab() {

    const location = useLocation()

    const navigate = useNavigate()

    const handleChangeTab = (e, newValue) => {
        navigate(`/${newValue}`)
    }

    return (
        <div>

            <Tabs value={location.pathname.split("/")[1]} onChange={handleChangeTab}>
                <Tab label="Config" value="Strategies"></Tab>
                <Tab label="Scanner" value="ScannerV3" ></Tab>
            </Tabs>
        </div>
    );
}

export default StrategiesV3Tab;