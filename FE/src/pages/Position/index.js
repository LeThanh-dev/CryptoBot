import { Tabs, Tab } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";


function PositionAll() {

    const location = useLocation()

    const navigate = useNavigate()

    const handleChangeTab = (e, newValue) => {
        navigate(`/${newValue}`)
    }

    return (
        <div style={{ marginBottom: "6px" }}>

            <Tabs value={location.pathname.split("/")[1]} onChange={handleChangeTab}>
                {/* <Tab label="V1" value="PositionV1"></Tab> */}
                <Tab label="V3" value="PositionV3" ></Tab>
            </Tabs>
        </div>
    );
}

export default PositionAll;