const mysql = require('mysql');
const mysqlConfig = {
    host: process.env.mysql_server,
    user: process.env.mysql_user,
    password: process.env.mysql_password,
    database: process.env.mysql_database,
    connectTimeout: 30000,
};






// 執行 MySQL 動作
async function executeQuery(query, params = []) {
    const connection = mysql.createConnection(mysqlConfig);
    connection.connect();

    try {
        return await new Promise((resolve, reject) => {
            connection.query(query, params, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    } finally {
        connection.end();
    }
}





/**
 * 根據分類 ID 獲取分類數據
 *
 * @param {number} categoryId 分類 ID。
 * @returns {Promise<Object>} 分類數據。
 */
async function getCategoryById(categoryId) {
    const categoryName = await getCategoryNameById(categoryId);
    const categoryProducts = await getCategoryProductsById(categoryId);
    return {
            categoryName: categoryName,
            categoryProducts: categoryProducts
    };
}







/**
 * 根據分類 ID 獲取分類頁底下的product
 *
 * @param {number} categoryId 分類 ID。
 * @returns {Promise<Object>} 分類數據。
 */
async function getCategoryProductsById(categoryId) {
    const query =`
    SELECT
        ccp.product_id,
        cpe.sku,
        MAX(CASE WHEN a.attribute_code = 'name' THEN cpev.value END) AS name,
        MAX(CASE WHEN a.attribute_code = 'mrl_sap_cumulative_qty' THEN cpev.value END) AS mrl_sap_cumulative_qty,
        MAX(CASE WHEN a.attribute_code = 'mrl_sap_available_qty' THEN cpev.value END) AS mrl_sap_available_qty,
        MAX(CASE WHEN a.attribute_code = 'mrl_sap_status' THEN cpev.value END) AS mrl_sap_status,
        MAX(CASE WHEN a.attribute_code = 'mrl_sap_purchase_qty' THEN cpet.value END) AS mrl_sap_purchase_qty,
        MAX(CASE WHEN a.attribute_code = 'mrl_sap_expected_start_date' THEN cpet.value END) AS mrl_sap_expected_start_date
    FROM
        catalog_category_product AS ccp
    JOIN
        catalog_product_entity AS cpe
        ON ccp.product_id = cpe.entity_id
    LEFT JOIN
        catalog_product_entity_varchar AS cpev
        ON cpe.entity_id = cpev.entity_id
    LEFT JOIN
        catalog_product_entity_text AS cpet
        ON cpe.entity_id = cpet.entity_id
    JOIN
        eav_attribute AS a
        ON cpev.attribute_id = a.attribute_id
        OR cpet.attribute_id = a.attribute_id
    WHERE
        ccp.category_id = ${categoryId}
        AND a.attribute_code IN ('name', 'mrl_sap_cumulative_qty', 'mrl_sap_available_qty', 'mrl_sap_status', 'mrl_sap_purchase_qty', 'mrl_sap_expected_start_date')
        AND a.entity_type_id = (
            SELECT entity_type_id
            FROM eav_entity_type
            WHERE entity_type_code = 'catalog_product'
        )
    GROUP BY
        ccp.product_id, cpe.sku;
    `;
    return executeQuery(query);
}







/**
 * 根據分類 ID 獲取分類頁名稱
 *
 * @param {number} categoryId 分類 ID。
 * @returns {Promise<Object>} 分類數據。
 */
async function getCategoryNameById(categoryId) {
    const query =
            `SELECT value
            FROM catalog_category_entity_varchar 
            WHERE entity_id = ${categoryId}
            AND attribute_id IN (
                SELECT attribute_id 
                FROM eav_attribute 
                WHERE attribute_code = 'name'
            );`;
    return executeQuery(query);
}




/**
 * 更新新的分類頁position
 *
 * @param {number} categoryId 分類 ID。
 * @param {Array} updateData 更新數據，格式為 [{entity_id: number, position: number}, ...]。
 * @returns {Promise<void>}
 */
async function updateCategoryProductPosition(categoryId,updateData) {
    try {
        // 刪除舊數據
        const deleteValues = updateData.map(data => `(${categoryId}, ${data.entity_id})`).join(', ');
        const deleteQuery = `DELETE FROM catalog_category_product WHERE (category_id, product_id) IN (${deleteValues})`;
        await executeQuery(deleteQuery);


        // 插入新數據
        const insertValues = updateData.map(data => `(${categoryId}, ${data.entity_id}, ${data.position})`).join(', ');
        const insertQuery = `INSERT INTO catalog_category_product (category_id, product_id, position) VALUES ${insertValues}`;
        await executeQuery(insertQuery);

        return 'Category inserted';

    } catch (err) {
        console.error('Error updating data:', err);
        throw err;
    }
}

module.exports = { getCategoryById, updateCategoryProductPosition };
