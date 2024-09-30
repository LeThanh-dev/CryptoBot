import AddIcon from '@mui/icons-material/Add';
import styles from './Group.module.scss'
import { useState, useEffect } from 'react';
import DataGridCustom from '../../../components/DataGridCustom';
import { Button } from '@mui/material';

function Group() {

    const tableColumns = [
        {
            field: 'id',
            headerName: '#',
            renderCell: (params) => params.api.getAllRowIds().indexOf(params.id)+1
        },
        { field: 'Group', headerName: 'Group' },
        { field: 'Actions', headerName: 'Actions' },
    ]

    const [tableRows, setTableRows] = useState([]);

    useEffect(() => {
        // setTimeout(() => {
        //     setTableRows([
        //         {
        //             "id": "1000000VINU",
        //             "Group": "1000000VINU",
        //             "Actions": "286.35K"
        //         },
        //         {
        //             "id": "BTC",
        //             "Group": "BTC",
        //             "Actions": "351.54M"
        //         },
        //     ])
        // }, 1000)
    }, []);
    return (
        <div className={styles.group}>
            <p style={{textAlign:"center"}}>This feature is not yet available</p>
            {/* <div style={{ textAlign: "right", marginBottom: '16px' }}>
                <Button variant="contained" startIcon={<AddIcon />}>
                    Group
                </Button>
            </div>
            <DataGridCustom
                tableColumns={tableColumns}
                tableRows={tableRows}
                checkboxSelection={false}
            /> */}
        </div>
    );
}

export default Group;