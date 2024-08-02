const { BigQuery } = require('@google-cloud/bigquery');

const bigquery = new BigQuery();






/**
 * 執行 BigQuery 查詢
 * @param {string} query - SQL 查詢語句
 * @returns {Promise<Array<Object>>} - 查詢結果
 */
async function executeQuery(query) {
    try {
        const [rows] = await bigquery.query(query);
        return rows;
    } catch (error) {
        console.error('執行查詢時發生錯誤:', error);
        return [];
    }
}








/**
 * 將產品 SKU 轉換為 SQL 查詢中的字串格式
 * @param {Array<Object>} products - 產品物件數組
 * @returns {string} - SQL 查詢字串
 */
function formatSkusForQuery(products) {
    if (products.length === 1) {
        return `'${products[0].sku}'`;
    }
    const skus = products.map(product => `'${product.sku}'`);
    return skus.join(', ');
}






/**
 * 獲取產品詳細信息
 * @param {Array<Object>} products - 產品物件數組
 * @returns {Promise<Object>} - 最終結果物件
 */
async function fetchProductDetails(products) {
    const skuString = formatSkusForQuery(products);
    const query = `
        SELECT 
            p.sku,
            ps.qty_snapshot_sales_all          AS  mrl_sap_available_qty,
            ps.U_item_status_value             AS  mrl_sap_status,
            pq.total_sales                     AS  mrl_sap_cumulative_qty,
            pq.U_space_cat_value               AS  mrl_sap_subcategory,
            pq.U_item_c3_value                 AS  mrl_sap_space,
            pd.U_mrl_eta_list                  AS  mrl_sap_expected_start_date,
            pd.OpenQty_list                    AS  mrl_sap_purchase_qty
        FROM (SELECT DISTINCT sku FROM UNNEST([${skuString}]) AS sku) AS p
        LEFT JOIN (
            SELECT
                itemCode,
                qty_snapshot_sales_all,
                U_item_status_value
            FROM Unima_Prod.appropriation_qty
            WHERE itemCode IN (${skuString})
        ) AS ps ON p.sku = ps.itemCode
        LEFT JOIN (
            SELECT
                product_id,
                SUM(quantity) AS total_sales,
                U_space_cat_value,
                U_item_c3_value
            FROM Unima_Prod.order_return_details
            WHERE product_id IN (${skuString})
            GROUP BY product_id, U_space_cat_value, U_item_c3_value
        ) AS pq ON p.sku = pq.product_id
        LEFT JOIN (
            SELECT
                ItemCode,
                ARRAY_AGG(U_mrl_eta) AS U_mrl_eta_list,
                ARRAY_AGG(OpenQty) AS OpenQty_list
            FROM mid_Prod.midOPOR_POR1
            WHERE ItemCode IN (${skuString})
            GROUP BY ItemCode
        ) AS pd ON p.sku = pd.ItemCode
    `;
    return executeQuery(query);
}

module.exports = { fetchProductDetails };
