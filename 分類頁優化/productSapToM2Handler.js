const { getProductData, updateProductDataTypeVarchar , updateProductDataTypeInt , updateProductDataTypeText } = require('./mysqlService');
const { fetchProductDetails } = require('./bigqueryService');
const { processProductData } = require('./dataProcessor');

async function productSapToM2Handler(req, res) {
    try {
        const products = await getProductData();                                    //取得m2所有的product(500、600左右)
        const productDetails = await fetchProductDetails(products);                 //從bigquery select出sap資料(用m2的product去select)
        const processedData = await processProductData(products,productDetails);    //將select出來的資料轉換成m2 table的格式
        await updateProductDataTypeVarchar(processedData.productDataTypeVarchar);   //更新資料至mysql(type varchar)
        await updateProductDataTypeInt(processedData.productDataTypeInt);           //更新資料至mysql(type int)
        await updateProductDataTypeText(processedData.productDataTypeText);         //更新資料至mysql(type text)
        return [processedData,products];
    } catch (error) {
        console.error('Error processing data:', error);
        throw error;
    }
}

module.exports = { productSapToM2Handler };
