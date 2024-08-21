
/**
 * 過濾資料項目
 * @param {Object} data - 包含 items 和 condition 的資料對象
 * @returns {Array} - 只包含符合條件的 items
 */
function filterData(data) {
    const title = data.title;
    const items = data.items;
    let minPrice = 0;
    let maxPrice = Infinity;
    
    const priceIndex = title.indexOf('折扣後金額');
    if (priceIndex === -1) {
        throw new Error('折扣後金額的標題未找到');
    }
    
    const priceCondition = data.condition.find(cond => cond.name === '折扣後金額');
    
    if (priceCondition) {
        if (priceCondition.minPrice) {
            minPrice = parseInt(priceCondition.minPrice, 10);
        }
        if (priceCondition.maxPrice) {
            maxPrice = parseInt(priceCondition.maxPrice, 10);
        }
    }

    // 篩選 items 中的項目
    const filteredItems = items.filter(item => {
        const discountPrice = parseInt(item[priceIndex], 10);
        return discountPrice >= minPrice && discountPrice <= maxPrice;
    });

    return filteredItems;
}

module.exports = { filterData };
