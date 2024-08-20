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




async function getCategoryByAttributeAndId(attribute,categoryId) {
    const categoryName = await getCategoryNameById(categoryId);
    const categoryProducts = await getCategoryProductsByAttributeAndId(attribute,categoryId);

    return {
            categoryName: categoryName,
            categoryProducts: categoryProducts
    };
}




async function getCategoryProductsByAttributeAndId(attributes,categoryId) {
    const conditions = [];
    for (const [key, values] of Object.entries(attributes)) {
        if (values.length > 0) {
            conditions.push(`${key} IN (${values.map(value => `'${value}'`).join(', ')})`);
        }
    }
    const attributeConditions = conditions.length > 0 ? conditions.join(' AND ') : '1=1';


    const query = `
        SELECT
            cpe.entity_id AS product_id,
            cpe.sku,
            COALESCE(varchar_attributes.name, '') AS name,
            COALESCE(varchar_attributes.mrl_sap_cumulative_qty, '') AS mrl_sap_cumulative_qty,
            COALESCE(varchar_attributes.mrl_sap_available_qty, '') AS mrl_sap_available_qty,
            COALESCE(varchar_attributes.mrl_sap_status, '') AS mrl_sap_status,
            COALESCE(varchar_attributes.mrl_sap_subcategory, '') AS mrl_sap_subcategory,
            COALESCE(varchar_attributes.mrl_sap_space, '') AS mrl_sap_space,
            COALESCE(text_attributes.mrl_sap_purchase_qty, '') AS mrl_sap_purchase_qty,
            COALESCE(text_attributes.mrl_sap_expected_start_date, '') AS mrl_sap_expected_start_date,
            COALESCE(int_attributes.visibility, '') AS visibility,
            COALESCE(ccp.position, 'null') AS position
        FROM
            catalog_product_entity AS cpe
        LEFT JOIN (
            SELECT
                entity_id,
                MAX(CASE WHEN attribute_code = 'name' THEN value END) AS name,
                MAX(CASE WHEN attribute_code = 'mrl_sap_cumulative_qty' THEN value END) AS mrl_sap_cumulative_qty,
                MAX(CASE WHEN attribute_code = 'mrl_sap_available_qty' THEN value END) AS mrl_sap_available_qty,
                MAX(CASE WHEN attribute_code = 'mrl_sap_status' THEN value END) AS mrl_sap_status,
                MAX(CASE WHEN attribute_code = 'mrl_sap_subcategory' THEN value END) AS mrl_sap_subcategory,
                MAX(CASE WHEN attribute_code = 'mrl_sap_space' THEN value END) AS mrl_sap_space
            FROM
                catalog_product_entity_varchar
            JOIN
                eav_attribute
            ON
                catalog_product_entity_varchar.attribute_id = eav_attribute.attribute_id
            WHERE
                eav_attribute.attribute_code IN ('name', 'mrl_sap_cumulative_qty', 'mrl_sap_available_qty', 'mrl_sap_status', 'mrl_sap_subcategory', 'mrl_sap_space')
            GROUP BY
                entity_id
        ) AS varchar_attributes
        ON
            cpe.entity_id = varchar_attributes.entity_id
        LEFT JOIN (
            SELECT
                entity_id,
                MAX(CASE WHEN attribute_code = 'mrl_sap_purchase_qty' THEN value END) AS mrl_sap_purchase_qty,
                MAX(CASE WHEN attribute_code = 'mrl_sap_expected_start_date' THEN value END) AS mrl_sap_expected_start_date
            FROM
                catalog_product_entity_text
            JOIN
                eav_attribute
            ON
                catalog_product_entity_text.attribute_id = eav_attribute.attribute_id
            WHERE
                eav_attribute.attribute_code IN ('mrl_sap_purchase_qty', 'mrl_sap_expected_start_date')
            GROUP BY
                entity_id
        ) AS text_attributes
        ON
            cpe.entity_id = text_attributes.entity_id
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
        ) AS int_attributes
        ON
            cpe.entity_id = int_attributes.entity_id
        LEFT JOIN (
            SELECT * FROM catalog_category_product WHERE category_id = ${categoryId}
        ) AS ccp
        ON
            cpe.entity_id = ccp.product_id
        WHERE
            cpe.entity_id IN (
                SELECT product_id FROM catalog_category_product WHERE category_id = ${categoryId}
            )

        OR
            (${attributeConditions})
            
        GROUP BY
            cpe.entity_id, cpe.sku, ccp.position; 

    `;

    return executeQuery(query);
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
            COALESCE(varchar_attributes.name, '') AS name,
            COALESCE(varchar_attributes.mrl_sap_cumulative_qty, '') AS mrl_sap_cumulative_qty,
            COALESCE(varchar_attributes.mrl_sap_available_qty, '') AS mrl_sap_available_qty,
            COALESCE(varchar_attributes.mrl_sap_status, '') AS mrl_sap_status,
            COALESCE(text_attributes.mrl_sap_purchase_qty, '') AS mrl_sap_purchase_qty,
            COALESCE(text_attributes.mrl_sap_expected_start_date, '') AS mrl_sap_expected_start_date,
            COALESCE(int_attributes.visibility, '') AS visibility
        FROM
            catalog_category_product AS ccp
        JOIN
            catalog_product_entity AS cpe
            ON ccp.product_id = cpe.entity_id
        LEFT JOIN (
            SELECT
                entity_id,
                MAX(CASE WHEN attribute_code = 'name' THEN value END) AS name,
                MAX(CASE WHEN attribute_code = 'mrl_sap_cumulative_qty' THEN value END) AS mrl_sap_cumulative_qty,
                MAX(CASE WHEN attribute_code = 'mrl_sap_available_qty' THEN value END) AS mrl_sap_available_qty,
                MAX(CASE WHEN attribute_code = 'mrl_sap_status' THEN value END) AS mrl_sap_status
            FROM
                catalog_product_entity_varchar
            JOIN
                eav_attribute
            ON
                catalog_product_entity_varchar.attribute_id = eav_attribute.attribute_id
            WHERE
                eav_attribute.attribute_code IN ('name', 'mrl_sap_cumulative_qty', 'mrl_sap_available_qty', 'mrl_sap_status')
            GROUP BY
                entity_id
        ) AS varchar_attributes
        ON
            cpe.entity_id = varchar_attributes.entity_id
        LEFT JOIN (
            SELECT
                entity_id,
                MAX(CASE WHEN attribute_code = 'mrl_sap_purchase_qty' THEN value END) AS mrl_sap_purchase_qty,
                MAX(CASE WHEN attribute_code = 'mrl_sap_expected_start_date' THEN value END) AS mrl_sap_expected_start_date
            FROM
                catalog_product_entity_text
            JOIN
                eav_attribute
            ON
                catalog_product_entity_text.attribute_id = eav_attribute.attribute_id
            WHERE
                eav_attribute.attribute_code IN ('mrl_sap_purchase_qty', 'mrl_sap_expected_start_date')
            GROUP BY
                entity_id
        ) AS text_attributes
        ON
            cpe.entity_id = text_attributes.entity_id
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
        ) AS int_attributes
        ON
            cpe.entity_id = int_attributes.entity_id
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

module.exports = { getCategoryById, updateCategoryProductPosition , getCategoryByAttributeAndId };
