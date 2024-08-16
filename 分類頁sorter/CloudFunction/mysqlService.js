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
            ccp.position,
            cpe.sku,
            COALESCE(name_sub.name, '') AS name,
            COALESCE(mrl_sap_cumulative_qty_sub.mrl_sap_cumulative_qty, '') AS mrl_sap_cumulative_qty,
            COALESCE(mrl_sap_available_qty_sub.mrl_sap_available_qty, '') AS mrl_sap_available_qty,
            COALESCE(mrl_sap_status_sub.mrl_sap_status, '') AS mrl_sap_status,
            COALESCE(mrl_sap_purchase_qty_sub.mrl_sap_purchase_qty, '') AS mrl_sap_purchase_qty,
            COALESCE(mrl_sap_expected_start_date_sub.mrl_sap_expected_start_date, '') AS mrl_sap_expected_start_date,
            COALESCE(visibility_sub.visibility, '') AS visibility
        FROM
            catalog_category_product AS ccp
        JOIN
            catalog_product_entity AS cpe
            ON ccp.product_id = cpe.entity_id
        LEFT JOIN (
            SELECT
                entity_id,
                MAX(CASE WHEN attribute_code = 'name' THEN value END) AS name
            FROM
                catalog_product_entity_varchar
            JOIN
                eav_attribute
            ON
                catalog_product_entity_varchar.attribute_id = eav_attribute.attribute_id
            WHERE
                eav_attribute.attribute_code = 'name'
            GROUP BY
                entity_id
        ) AS name_sub
        ON
            cpe.entity_id = name_sub.entity_id
        LEFT JOIN (
            SELECT
                entity_id,
                MAX(CASE WHEN attribute_code = 'mrl_sap_cumulative_qty' THEN value END) AS mrl_sap_cumulative_qty
            FROM
                catalog_product_entity_varchar
            JOIN
                eav_attribute
            ON
                catalog_product_entity_varchar.attribute_id = eav_attribute.attribute_id
            WHERE
                eav_attribute.attribute_code = 'mrl_sap_cumulative_qty'
            GROUP BY
                entity_id
        ) AS mrl_sap_cumulative_qty_sub
        ON
            cpe.entity_id = mrl_sap_cumulative_qty_sub.entity_id
        LEFT JOIN (
            SELECT
                entity_id,
                MAX(CASE WHEN attribute_code = 'mrl_sap_available_qty' THEN value END) AS mrl_sap_available_qty
            FROM
                catalog_product_entity_varchar
            JOIN
                eav_attribute
            ON
                catalog_product_entity_varchar.attribute_id = eav_attribute.attribute_id
            WHERE
                eav_attribute.attribute_code = 'mrl_sap_available_qty'
            GROUP BY
                entity_id
        ) AS mrl_sap_available_qty_sub
        ON
            cpe.entity_id = mrl_sap_available_qty_sub.entity_id
        LEFT JOIN (
            SELECT
                entity_id,
                MAX(CASE WHEN attribute_code = 'mrl_sap_status' THEN value END) AS mrl_sap_status
            FROM
                catalog_product_entity_varchar
            JOIN
                eav_attribute
            ON
                catalog_product_entity_varchar.attribute_id = eav_attribute.attribute_id
            WHERE
                eav_attribute.attribute_code = 'mrl_sap_status'
            GROUP BY
                entity_id
        ) AS mrl_sap_status_sub
        ON
            cpe.entity_id = mrl_sap_status_sub.entity_id
        LEFT JOIN (
            SELECT
                entity_id,
                MAX(CASE WHEN attribute_code = 'mrl_sap_purchase_qty' THEN value END) AS mrl_sap_purchase_qty
            FROM
                catalog_product_entity_text
            JOIN
                eav_attribute
            ON
                catalog_product_entity_text.attribute_id = eav_attribute.attribute_id
            WHERE
                eav_attribute.attribute_code = 'mrl_sap_purchase_qty'
            GROUP BY
                entity_id
        ) AS mrl_sap_purchase_qty_sub
        ON
            cpe.entity_id = mrl_sap_purchase_qty_sub.entity_id
        LEFT JOIN (
            SELECT
                entity_id,
                MAX(CASE WHEN attribute_code = 'mrl_sap_expected_start_date' THEN value END) AS mrl_sap_expected_start_date
            FROM
                catalog_product_entity_text
            JOIN
                eav_attribute
            ON
                catalog_product_entity_text.attribute_id = eav_attribute.attribute_id
            WHERE
                eav_attribute.attribute_code = 'mrl_sap_expected_start_date'
            GROUP BY
                entity_id
        ) AS mrl_sap_expected_start_date_sub
        ON
            cpe.entity_id = mrl_sap_expected_start_date_sub.entity_id
        LEFT JOIN (
            SELECT
                entity_id,
                MAX(CASE WHEN attribute_code = 'visibility' THEN value END) AS visibility
            FROM
                catalog_product_entity_int
            JOIN
                eav_attribute
            ON
                catalog_product_entity_int.attribute_id = eav_attribute.attribute_id
            WHERE
                eav_attribute.attribute_code = 'visibility'
            GROUP BY
                entity_id
        ) AS visibility_sub
        ON
            cpe.entity_id = visibility_sub.entity_id
        WHERE
            ccp.category_id = ${categoryId}
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
        const deleteQuery = `DELETE FROM catalog_category_product WHERE category_id = ${categoryId}`;
        await executeQuery(deleteQuery);


        // 插入新數據
        const insertValues = updateData.map(data => `(${categoryId}, ${data.entity_id}, ${data.position})`).join(', ');
        const insertQuery = `INSERT INTO catalog_category_product (category_id, product_id, position) VALUES ${insertValues}`;
        await executeQuery(insertQuery);

        return {
            success: true,
            message: '更新成功',
        };

    } catch (err) {
        console.error('Error updating data:', err);
        return {
            success: false,
            message: 'Error updating category product positions',
            error: err.message,
        };
    }
}

module.exports = { getCategoryById, updateCategoryProductPosition };
