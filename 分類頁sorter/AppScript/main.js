var spread = SpreadsheetApp.getActiveSpreadsheet();
var categoryResorterA = spread.getSheetByName('分類頁resorter A');
var categoryResorterB = spread.getSheetByName('分類頁resorter B');
var tempStorageA = spread.getSheetByName('resorter_temp_storage_table_A');
var tempStorageB = spread.getSheetByName('resorter_temp_storage_table_B');
var mappingTable = spread.getSheetByName('Mapping Table');
const visibilityMap = {
    1: 'Not Visible Individually',
    2: 'Catalog',
    3: 'Search',
    4: 'Catalog, Search'
};


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

        // 將數據寫入 A8 到 J 列
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

        //寫進storage
        tempStorageA.deleteRows(4, tempStorageA.getMaxRows() - 3);
        tempStorageA.getRange(1 , 1, tempStorageA.getMaxRows(), tempStorageA.getMaxColumns()).clearContent();
        tempStorageA.getRange('B3').setValue(response.categoryName[0].value);
        tempStorageA.getRange('A3').setValue(categoryId);
        tempStorageA.getRange(8, 1, numRows, 10).setValues(data);
        tempStorageA.getRange(1, 1).setValue(new Date().toLocaleString());
    }
    // SpreadsheetApp.getUi().alert('讀取完成');

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


function getCategoryByAttributeAndId(){
    categoryResorterB.getRange('B16:B'+ categoryResorterB.getLastRow()).removeCheckboxes(); 
    const categoryId = categoryResorterB.getRange('A3').getValue();
    const params = {
        action: 'get_category_product_by_attribute_and_id',
        categoryId: categoryId,
        attribute: getCategoryDetailsById(categoryId)
    };
    const response = sendDataToCloudFunction(params);

    // 寫分類頁名稱
    categoryResorterB.getRange('B3').setValue(response.categoryName[0].value);

    // list product
    categoryResorterB.getRange('A16:L').clearContent();
    const categoryProducts = response.categoryProducts;
    const numRows = categoryProducts.length;
    if (numRows > 0) {
        const data = categoryProducts.map(product => {
            const dates = JSON.parse(product.mrl_sap_expected_start_date || '[]');
            const datesString = dates.join('\n');
            const purchaseQtyList = JSON.parse(product.mrl_sap_purchase_qty || '[]');
            const purchaseQtyFormatted = purchaseQtyList.map(item => {
                return `${item.purchaseQty}(於${item.remainder})`;
            }).join('\n');
            const visibilityText = visibilityMap[product.visibility] || 'Unknown';
            const isPositionNumber = !isNaN(parseFloat(product.position)) && isFinite(product.position);
            const price = (parseFloat(product.mrl_discount_price) === 0) ? product.original_price : product.mrl_discount_price;
            return [
                product.position,
                isPositionNumber,
                product.product_id,
                product.name,
                product.sku,
                product.mrl_sap_cumulative_qty,
                product.mrl_sap_available_qty,
                purchaseQtyFormatted,
                datesString,
                product.mrl_sap_status,
                visibilityText,
                price
            ];
        });

        // 將數據寫入 A16 到 L 列
        categoryResorterB.getRange(16, 1, numRows, 12).setValues(data);


        // 將 B 列的值設定為複選框
        const checkboxRange = categoryResorterB.getRange(16, 2, numRows);
        const checkboxRule = SpreadsheetApp.newDataValidation()
            .requireCheckbox()
            .build();
        checkboxRange.setDataValidation(checkboxRule);


        // 將負數的 cumulative_qty 列字體顏色設置為紅色
        const cumulativeQtyRange = categoryResorterB.getRange(16, 7, numRows);
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
        const lastDataRow = categoryResorterB.getLastRow();
        const lastRow = categoryResorterB.getMaxRows();
        let deleteRow = lastRow - lastDataRow;
        if(deleteRow > 2){
            categoryResorterB.deleteRows(lastDataRow + 1, deleteRow - 2);
        }
        else{
            categoryResorterB.insertRowsAfter(lastDataRow, 2);
        }


        //寫進storage
        tempStorageB.deleteRows(4, tempStorageB.getMaxRows() - 3);
        tempStorageB.getRange(1 , 1, tempStorageB.getMaxRows(), tempStorageB.getMaxColumns()).clearContent();
        tempStorageB.getRange('B3').setValue(response.categoryName[0].value);
        tempStorageB.getRange('A3').setValue(categoryId);
        tempStorageB.getRange(16, 1, numRows, 12).setValues(data);
        tempStorageB.getRange(1, 1).setValue(new Date().toLocaleString());
    }
    // SpreadsheetApp.getUi().alert('讀取完成');

}



function getCategoryDetailsById(categoryId) {    
    const dataRange = mappingTable.getDataRange();
    const data = dataRange.getValues();
    
    let result = {};
    const reverseVisibilityMap = Object.fromEntries(
        Object.entries(visibilityMap).map(([key, value]) => [value, key])
    );
    for (let i = 2; i < data.length; i++) {
        if (data[i][0] == categoryId) {
            if (data[i][2]) {
                result.mrl_sap_space = data[i][2].split(',').map(status => status.trim());
            }
            
            if (data[i][3]) {
                result.mrl_sap_subcategory = data[i][3].split(',').map(status => status.trim());
            }
            
            if (data[i][4]) {
                result.mrl_sap_status = data[i][4].split(',').map(status => status.trim());
            }
            
            if (data[i][5]) {
                result.visibility = [reverseVisibilityMap[data[i][5].trim()] || 'Unknown'];
            }
            break;
        }
    }
    
    return result;
}



function updateCategoryProductPositionWithBoolean(){
    const categoryId = categoryResorterB.getRange('A3').getValue();
    const data = categoryResorterB.getRange('A16:C' + categoryResorterB.getLastRow()).getValues();
    var updateData = data.filter(row => row[1] === true).map(row => ({
        entity_id: row[2],
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



function onFilter(){
    var items = categoryResorterB.getRange('A16:L').getValues();
    var [title] = categoryResorterB.getRange('A15:L15').getValues();
    //將預計交期起算轉成yyyy-mm-dd
    // const dateIndex = title.indexOf('預計交期起算');
    // for (let i = 0; i < items.length; i++) {
    //     if (items[i][dateIndex] instanceof Date) {
    //         items[i][dateIndex] = Utilities.formatDate(items[i][dateIndex], Session.getScriptTimeZone(), 'yyyy-MM-dd');
    //     } else {
    //         items[i][dateIndex] = String(items[i][dateIndex]);
    //     }
    // }
    var priceCondition = {name:'折扣後金額'};
    var minPrice = categoryResorterB.getRange('B8').getValues();
    var maxPrice = categoryResorterB.getRange('D8').getValues();
    if(minPrice != '') priceCondition.minPrice = minPrice;
    if(maxPrice != '') priceCondition.maxPrice = maxPrice;
    var dateCondition = {name:'預計交期起算'};
    var conditionDateTime = categoryResorterB.getRange('B7').getValues();
    if(conditionDateTime != '') dateCondition.conditionDate = conditionDateTime;
    var params = {
        action: 'filter_data',
        data: {
            items: items,
            title: title,
            condition: [
                dateCondition,
                priceCondition
            ]
        }
    };


    const data = sendDataToCloudFunction(params); 
    const numRows = data.length;
    categoryResorterB.getRange('B16:B'+ categoryResorterB.getLastRow()).removeCheckboxes();
    categoryResorterB.getRange('A16:L').clearContent();

    // 將數據寫入 A16 到 L 列
    categoryResorterB.getRange(16, 1, numRows, 12).setValues(data);


    // 將 B 列的值設定為複選框
    const checkboxRange = categoryResorterB.getRange(16, 2, numRows);
    const checkboxRule = SpreadsheetApp.newDataValidation()
        .requireCheckbox()
        .build();
    checkboxRange.setDataValidation(checkboxRule);


    // 將負數的 cumulative_qty 列字體顏色設置為紅色
    const cumulativeQtyRange = categoryResorterB.getRange(16, 7, numRows);
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
    const lastDataRow = categoryResorterB.getLastRow();
    const lastRow = categoryResorterB.getMaxRows();
    let deleteRow = lastRow - lastDataRow;
    if(deleteRow > 2){
        categoryResorterB.deleteRows(lastDataRow + 1, deleteRow - 2);
    }
    else{
        categoryResorterB.insertRowsAfter(lastDataRow, 2);
    }
}




function saveTempDataToSheetA() {
    const tempData = tempStorageA.getRange('A8:J').getValues();
    categoryResorterA.getRange('A3').setValue(tempStorageA.getRange('A3').getValue());
    categoryResorterA.getRange('B3').setValue(tempStorageA.getRange('B3').getValue());
    categoryResorterA.getRange('A8:J').clearContent();
    categoryResorterA.getRange(8, 1, tempData.length, tempData[0].length).setValues(tempData);

    // 將負數的 cumulative_qty 列字體顏色設置為紅色
    const cumulativeQtyRange = categoryResorterA.getRange(8, 6, tempData.length);
    const cumulativeQtyValues = cumulativeQtyRange.getValues();
    
    for (let i = 0; i < tempData.length; i++) {
        const cumulativeQty = parseFloat(cumulativeQtyValues[i][0]);
        if (cumulativeQty < 0) {
            cumulativeQtyRange.getCell(i + 1, 1).setFontColor('red');
        } else {
            cumulativeQtyRange.getCell(i + 1, 1).setFontColor('black');
        }
    }

    // 刪除最後一個非空行以下的所有行
    const lastDataRow = categoryResorterA.getLastRow();
    const lastRow = categoryResorterA.getMaxRows();
    const deleteRowCount = lastRow - lastDataRow;
    
    if (deleteRowCount > 2) {
        categoryResorterA.deleteRows(lastDataRow + 1, deleteRowCount - 2);
    } else {
        categoryResorterA.insertRowsAfter(lastDataRow, 2);
    }
    SpreadsheetApp.getUi().alert('已回復分類頁: '+ tempStorageA.getRange('A3').getValue() +' '+ tempStorageA.getRange('B3').getValue() +'\n在 '+ tempStorageA.getRange('A1').getValue() +'\n的查詢內容');
}


function saveTempDataToSheetB() {
    categoryResorterB.getRange('B16:B' + categoryResorterB.getLastRow()).removeCheckboxes(); 
    const tempData = tempStorageB.getRange('A16:L').getValues();    
    categoryResorterB.getRange('A3').setValue(tempStorageB.getRange('A3').getValue());
    categoryResorterB.getRange('B3').setValue(tempStorageB.getRange('B3').getValue());    
    categoryResorterB.getRange('A16:L').clearContent();
    categoryResorterB.getRange(16, 1, tempData.length, tempData[0].length).setValues(tempData);


    // 將負數的 cumulative_qty 列字體顏色設置為紅色
    const cumulativeQtyRange = categoryResorterB.getRange(16, 7, tempData.length);
    const cumulativeQtyValues = cumulativeQtyRange.getValues();
    
    for (let i = 0; i < tempData.length; i++) {
        const cumulativeQty = parseFloat(cumulativeQtyValues[i][0]);
        if (cumulativeQty < 0) {
            cumulativeQtyRange.getCell(i + 1, 1).setFontColor('red');
        } else {
            cumulativeQtyRange.getCell(i + 1, 1).setFontColor('black');
        }
    }

    // 刪除最後一個非空行以下的所有行
    const lastDataRow = categoryResorterB.getLastRow();
    const lastRow = categoryResorterB.getMaxRows();
    const deleteRowCount = lastRow - lastDataRow;
    
    if (deleteRowCount > 2) {
        categoryResorterB.deleteRows(lastDataRow + 1, deleteRowCount - 2);
    } else {
        categoryResorterB.insertRowsAfter(lastDataRow, 2);
    }



    // 將 B 列的值設定為複選框
    const checkboxRange = categoryResorterB.getRange(16, 2, tempData.length);
    const checkboxRule = SpreadsheetApp.newDataValidation()
        .requireCheckbox()
        .build();
    checkboxRange.setDataValidation(checkboxRule);



    SpreadsheetApp.getUi().alert('已回復分類頁: '+ tempStorageB.getRange('A3').getValue() +' '+ tempStorageB.getRange('B3').getValue() +'\n在 '+ tempStorageB.getRange('A1').getValue() +'\n的查詢內容');
}