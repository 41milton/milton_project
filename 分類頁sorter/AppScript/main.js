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
    console.log('Parsed JSON Response:', jsonResponse);
    return jsonResponse;
}
  

//   var payload = {
//     action: 'update_category_product_position',
//     categoryId: '118',
//     updateData: [
//       {
//         entity_id: 3205,
//         position: 3
//       },
//       {
//         entity_id: 3208,
//         position: 29
//       },
//     ]
//   };