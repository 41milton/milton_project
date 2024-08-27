/**
 * 過濾資料項目
 * @param {Object} data - 包含 items 和 condition 的資料對象
 * @returns {Array} - 只包含符合條件的 items
 */
function filterData(data) {
    const { title, items, condition } = data;
    const indexList = {
        priceIndex: title.indexOf('折扣後金額'),
        deliveryDateIndex: title.indexOf('預計交期起算'),
        quantityIndex: title.indexOf('可銷售數量'),
        stockIndex: title.indexOf('預計進貨量')
    }


    if (indexList.priceIndex === -1) {
        throw new Error('折扣後金額的標題未找到');
    }
    if (indexList.deliveryDateIndex === -1) {
        throw new Error('預計交期起算的標題未找到');
    }
    if (indexList.quantityIndex === -1) {
        throw new Error('可銷售數量的標題未找到');
    }
    if (indexList.stockIndex === -1) {
        throw new Error('預計進貨量的標題未找到');
    }


    const filteredByPrice = filterPriceData(items,condition,indexList);

    const filteredByDate = filterDateData(filteredByPrice,condition,indexList);


    return filteredByDate;
}



function filterDateData(items, condition, indexList) {
    const { conditionDate } = condition.find(cond => cond.name === '預計交期起算') || {};
    const conditionDateObj = conditionDate ? new Date(conditionDate) : null;

    return items.filter(item => {
        const quantity = parseInt(item[indexList.quantityIndex], 10);
        const stock = extractStockNumbers(item[indexList.stockIndex]);
        const deliveryDate = item[indexList.deliveryDateIndex].split('\n');

        if (!conditionDateObj) {
            return true;
        }

        if (quantity > 0) {
            return true;
        } else {
            if (!stock.length) {
                return false;
            } else {
                const lastZeroIndex = stock.lastIndexOf(0);

                if (lastZeroIndex === stock.length - 1 || lastZeroIndex >= deliveryDate.length) {
                    return false;
                }

                if (lastZeroIndex === -1) {
                    var lastDataRow = deliveryDate[0];
                }
                else{
                    var lastDataRow = deliveryDate[lastZeroIndex + 1];
                }
                const lastDataDateObj = new Date(lastDataRow);


                // 確保日期有效
                if (isNaN(lastDataDateObj)) {
                    return false;
                }


                return lastDataDateObj <= conditionDateObj;
            }
        }
    });
}


function filterPriceData(items,condition,indexList){
    const { minPrice = 0, maxPrice = Infinity } = condition.find(cond => cond.name === '折扣後金額') || {};

    return items.filter(item => {
        const discountPrice = parseInt(item[indexList.priceIndex], 10);
        return discountPrice >= minPrice && discountPrice <= maxPrice;
    });
}





/**
 * 從預計進貨量的字串中提取 "於" 後的數字
 * @param {String} stockStr - 包含預計進貨量的字串，如 '1(於0)\n2(於0)\n3(於2)'
 * @returns {Array} - 提取的數字組成的數組，如 [0, 0, 2]
 */
function extractStockNumbers(stockStr) {
    return stockStr.split('\n').map(item => {
        const match = item.match(/於(\d+)/);
        return match ? parseInt(match[1], 10) : 0; // 默認為 0 如果無法匹配
    });
}

module.exports = { filterData };
