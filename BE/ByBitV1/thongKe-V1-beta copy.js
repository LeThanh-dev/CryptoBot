const OC = 4;
const numbs = 7;

const handleCalcOrderChange = ({ OrderChange, Numbs }) => {
    const result = [];
    const step = OrderChange * 0.02; // 2% của OrderChange

    if (Numbs % 2 === 0) { // Nếu numbs là số chẵn
        for (let i = -(Numbs / 2); i < Numbs / 2; i++) {
            result.push(OrderChange + i * step);
        }
    } else { // Nếu numbs là số lẻ
        for (let i = -Math.floor((Numbs - 1) / 2); i <= Math.floor((Numbs - 1) / 2); i++) {
            result.push(OrderChange + i * step);
        }
    }

    return result;
};

const result = handleCalcOrderChange({ OrderChange: OC, Numbs: numbs });
console.log(result);
