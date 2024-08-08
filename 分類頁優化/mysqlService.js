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





// 獲取產品數據
async function getProductData() {
    const query = `SELECT entity_id, sku FROM catalog_product_entity`;
    return executeQuery(query);
}







// 獲取屬性 ID、type
async function getAttributeId(attributeCodeList) {
    const formattedCodeList = attributeCodeList.map(code => `'${code}'`).join(', ');
    const query = `
        SELECT attribute_code, attribute_id , backend_type
        FROM eav_attribute 
        WHERE attribute_code IN (${formattedCodeList})
    `;
    return executeQuery(query);
}



//獲取 現貨/預購 的option id
async function getStockAndPreorderOptionIds(){
    const query = `
        SELECT option_id , value
        FROM eav_attribute_option_value
        WHERE (value = '現貨家具' OR value = '預購家具')
        AND store_id = 1;
    `;
    return executeQuery(query);
}







// 更新產品數據 type varchar
async function updateProductDataTypeVarchar(data) {
    return await updateProductAttributesInTable(data,'catalog_product_entity_varchar');
}





// 更新產品數據 type int
async function updateProductDataTypeInt(data){
    return await updateProductAttributesInTable(data,'catalog_product_entity_int');
}




// 更新產品數據 type text
async function updateProductDataTypeText(data){
    return await updateProductAttributesInTable(data,'catalog_product_entity_text');
}








async function updateProductAttributesInTable(data, table) {
    try {
        // 構建批量刪除 SQL 語句
        const deleteValues = data.map(item => `(${item.entity_id}, ${item.attribute_id})`).join(', ');
        const deleteQuery = `DELETE FROM ${table} WHERE (entity_id, attribute_id) IN (${deleteValues})`;

        // 刪除舊數據
        await executeQuery(deleteQuery);

        // 構建批量插入 SQL 語句
        const insertValues = data.map(item => `(${item.entity_id}, ${item.attribute_id}, 0, '${item.value}')`).join(', ');
        const insertQuery = `INSERT INTO ${table} (entity_id, attribute_id, store_id, value) VALUES ${insertValues}`;

        // 插入新數據
        await executeQuery(insertQuery);
        console.log('Data updated successfully');
    } catch (err) {
        console.error('Error updating data:', err);
    }
}


module.exports = { getProductData , getAttributeId , updateProductDataTypeVarchar , updateProductDataTypeInt , updateProductDataTypeText , getStockAndPreorderOptionIds };
