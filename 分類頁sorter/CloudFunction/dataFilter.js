/**
 * 過濾資料項目
 * @param {Object} data - 包含 items 和 condition 的資料對象
 * @returns {Array} - 只包含符合條件的 items
 */
function filterData(data) {
    const { title, items, condition } = data;
    const priceIndex = title.indexOf('折扣後金額');

    if (priceIndex === -1) {
        throw new Error('折扣後金額的標題未找到');
    }

    const { minPrice = 0, maxPrice = Infinity } = condition.find(cond => cond.name === '折扣後金額') || {};

    return items.filter(item => {
        const discountPrice = parseInt(item[priceIndex], 10);
        return discountPrice >= minPrice && discountPrice <= maxPrice;
    });
}

module.exports = { filterData };
