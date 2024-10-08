import { NavLink } from "react-router-dom";
import styles from "./LayoutBox.module.scss"
function LayoutBox({
    list = []
}) {
    return (
        <div className={styles.LayoutBox}>
            {
                list.map((item, index) => (
                    <NavLink
                        className={styles.LayoutBoxItem}
                        key={index}
                        to={item.link}
                    >
                        {item.label}
                    </NavLink>
                ))
            }
        </div>
    );
}

export default LayoutBox;