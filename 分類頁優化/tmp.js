// 示例數據
const attributeMappings = [
    { attribute_code: 'mrl_sap_available_qty', attribute_id: 327 },
    { attribute_code: 'mrl_sap_cumulative_qty', attribute_id: 326 },
    { attribute_code: 'mrl_sap_expected_start_date', attribute_id: 329 },
    { attribute_code: 'mrl_sap_purchase_qty', attribute_id: 328 },
    { attribute_code: 'mrl_sap_space', attribute_id: 332 },
    { attribute_code: 'mrl_sap_status', attribute_id: 330 },
    { attribute_code: 'mrl_sap_subcategory', attribute_id: 331 }
];

const productData = [
    {
        entity_id: 3106,
        sku: '22-0050-0-19',
        mrl_sap_available_qty: '23',
        mrl_sap_status: '常備品',
        mrl_sap_cumulative_qty: '1093',
        mrl_sap_subcategory: '客廳',
        mrl_sap_space: '電視櫃',
        mrl_sap_expected_start_date: [
            { value: '2024-08-10T00:00:00' },
            { value: '2024-09-12T00:00:00' },
            { value: '2024-10-17T00:00:00' },
            { value: '2024-11-15T00:00:00' }
        ],
        mrl_sap_purchase_qty: ['20', '20', '30', '30']
    }
    // 更多數據...
];










// 更新產品數據
function updateProductData(data) {
    const deletePromises = data.map(item => {
        // return executeQuery(
        //     `DELETE FROM catalog_product_entity_varchar
        //      WHERE entity_id = ? AND attribute_id = ?`,
        //     [item.entity_id, item.attribute_id]
        // );
    });

    try {
        // 刪除舊數據
        Promise.all(deletePromises);

        // 插入新數據
        const insertPromises = data.map(item => {
            console.log(item)
            // return executeQuery(
            //     `INSERT INTO catalog_product_entity_varchar (entity_id, attribute_id, store_id, value)
            //      VALUES (?, ?, 0, ?)`,
            //     [item.entity_id, item.attribute_id, item.value]
            // );
        });
        Promise.all(insertPromises);

        console.log('Data updated successfully');
    } catch (err) {
        console.error('Error updating data:', err);
    }
}



let data = [
    {
        "entity_id": 3106,
        "attribute_id": 327,
        "value": "22"
    },
    {
        "entity_id": 3106,
        "attribute_id": 330,
        "value": "常備品"
    },
    {
        "entity_id": 3106,
        "attribute_id": 326,
        "value": "1094"
    },
    {
        "entity_id": 3106,
        "attribute_id": 331,
        "value": "客廳"
    },
    {
        "entity_id": 3106,
        "attribute_id": 332,
        "value": "電視櫃"
    },
    {
        "entity_id": 3106,
        "attribute_id": 329,
        "value": "[\"2024-08-10T00:00:00\",\"2024-09-12T00:00:00\",\"2024-10-17T00:00:00\",\"2024-11-15T00:00:00\"]"
    },
    {
        "entity_id": 3106,
        "attribute_id": 328,
        "value": "[\"20\",\"20\",\"30\",\"30\"]"
    }
]


updateProductData(data)