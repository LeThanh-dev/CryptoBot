import { NavLink } from "react-router-dom";
import styles from "./LayoutBox.module.scss"
import { useSelector } from "react-redux";
function LayoutBox({
    list = [],
}) {
    const userData = useSelector(state => state.userDataSlice.userData)

    const checkRoleList = link => {
        return userData?.roleList?.includes(link)
    }

    return (
        <div className={styles.LayoutBox}>
            {
                list.map((item) => (
                    checkRoleList(item.link.slice(1)) && <NavLink
                        className={styles.LayoutBoxItem}
                        to={item.link}
                        key={item.link}
                        style={item.style}
                    >
                        {item.label}
                    </NavLink>
                ))
            }
        </div>
    );
}

export default LayoutBox;