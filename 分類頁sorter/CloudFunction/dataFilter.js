/**
 * 過濾資料項目
 * @param {Object} data - 包含 items 和 condition 的資料對象
 * @returns {Array} - 只包含符合條件的 items
 */
function filterData(data) {
    const { title, items, condition } = data;
    const priceIndex = title.indexOf('折扣後金額');
    const deliveryDateIndex = title.indexOf('預計交期起算');
    const quantityIndex = title.indexOf('可銷售數量');
    const stockIndex = title.indexOf('預計進貨量');


    if (priceIndex === -1) {
        throw new Error('折扣後金額的標題未找到');
    }
    if (deliveryDateIndex === -1) {
        throw new Error('預計交期起算的標題未找到');
    }
    if (quantityIndex === -1) {
        throw new Error('可銷售數量的標題未找到');
    }
    if (stockIndex === -1) {
        throw new Error('預計進貨量的標題未找到');
    }


    const filteredByPrice = filterPriceData(items,condition,priceIndex);



    return filteredByPrice;
}





function filterPriceData(items,condition,priceIndex){
    const { minPrice = 0, maxPrice = Infinity } = condition.find(cond => cond.name === '折扣後金額') || {};

    return items.filter(item => {
        const discountPrice = parseInt(item[priceIndex], 10);
        return discountPrice >= minPrice && discountPrice <= maxPrice;
    });
}

module.exports = { filterData };
