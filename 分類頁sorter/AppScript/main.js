var spread = SpreadsheetApp.getActiveSpreadsheet();
var categoryResorterA = spread.getSheetByName('分類頁resorter A');
var categoryResorterB = spread.getSheetByName('分類頁resorter B');



function sendDataToCloudFunction(params) {
    var url = 'https://asia-east1-czechrepublic-290206.cloudfunctions.net/dev_cf_m2_category_page_sorter';  
    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(params)
    };
  
    var response = UrlFetchApp.fetch(url, options);
    var responseText = response.getContentText();
    var jsonResponse;
    try {
      jsonResponse = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse JSON response:', e);
      jsonResponse = null;
    }
    // console.log('Parsed JSON Response:', jsonResponse);
    return jsonResponse;
}
  


function getCategoryById(){
    const categoryId = categoryResorterA.getRange('A3').getValue();
    const params = {
        action: 'get_category_product_by_id',
        categoryId: categoryId
    };
    const response = sendDataToCloudFunction(params);

    // 寫分類頁名稱
    categoryResorterA.getRange('B3').setValue(response.categoryName[0].value);

    // list product
    categoryResorterA.getRange('A8:J').clearContent();
    const categoryProducts = response.categoryProducts;
    const numRows = categoryProducts.length;
    const visibilityMap = {
        1: 'Not Visible Individually',
        2: 'Catalog',
        3: 'Search',
        4: 'Catalog, Search'
    };
    if (numRows > 0) {
        const data = categoryProducts.map(product => {
            const dates = JSON.parse(product.mrl_sap_expected_start_date || '[]');
            const datesString = dates.join('\n');
            const purchaseQtyList = JSON.parse(product.mrl_sap_purchase_qty || '[]');
            const purchaseQtyFormatted = purchaseQtyList.map(item => {
                return `${item.purchaseQty}(於${item.remainder})`;
            }).join('\n');
            const visibilityText = visibilityMap[product.visibility] || 'Unknown';
            return [
                product.position,
                product.product_id,
                product.name,
                product.sku,
                product.mrl_sap_cumulative_qty,
                product.mrl_sap_available_qty,
                purchaseQtyFormatted,
                datesString,
                product.mrl_sap_status,
                visibilityText
            ];
        });

        // 將數據寫入 A4 到 J 列
        categoryResorterA.getRange(8, 1, numRows, 10).setValues(data);


        // 將負數的 cumulative_qty 列字體顏色設置為紅色
        const cumulativeQtyRange = categoryResorterA.getRange(8, 6, numRows);
        const cumulativeQtyValues = cumulativeQtyRange.getValues();
        for (let i = 0; i < numRows; i++) {
            const cumulativeQty = parseFloat(cumulativeQtyValues[i][0]);
            if (cumulativeQty < 0) {
                cumulativeQtyRange.getCell(i + 1, 1).setFontColor('red');
            }
            else{
                cumulativeQtyRange.getCell(i + 1, 1).setFontColor('black');
            }
        }

        // 删除最后一个非空行以下的所有行
        const lastDataRow = categoryResorterA.getLastRow();
        const lastRow = categoryResorterA.getMaxRows();
        let deleteRow = lastRow - lastDataRow;
        if(deleteRow > 2){
            categoryResorterA.deleteRows(lastDataRow + 1, deleteRow - 2);
        }
        else{
            categoryResorterA.insertRowsAfter(lastDataRow, 2);
        }
    }

}




function updateCategoryProductPosition(){
    const categoryId = categoryResorterA.getRange('A3').getValue();
    const data = categoryResorterA.getRange('A8:B' + categoryResorterA.getLastRow()).getValues();
    var updateData = data.map(row => ({
        entity_id: row[1],
        position: row[0]
      }));

    var params = {
        action: 'update_category_product_position',
        categoryId: categoryId,
        updateData: updateData
    };
    const response = sendDataToCloudFunction(params);  
    if(!response.success){
        console.log(response.error);
    } 
    SpreadsheetApp.getUi().alert(response.message);
}
