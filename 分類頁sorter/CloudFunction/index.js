const { getCategoryById, updateCategoryProductPosition } = require('./mysqlService');


/**
 * 處理 HTTP 請求和 POST 數據。
 *
 * @param {!Object} request HTTP 請求上下文。
 * @param {!Object} response HTTP 響應上下文。
 */



exports.cfM2CategoryPageSorter = async (request, response) => {
  try {
    if (request.method !== 'POST') {
      response.status(405).send('Method Not Allowed');
      return;
    }

    const action = request.body.action;
    const categoryId = request.body.categoryId;



    switch (action) {



      //取得分類頁下的內容
      case 'get_category_product_by_id':
        const data = await getCategoryById(categoryId);
        response.status(200).json(data);
        break;



      //修改分類頁的內容
      case 'update_category_product_position':
        const updateData = request.body.updateData;
        const updateResponse = await updateCategoryProductPosition(categoryId , updateData);
        response.status(201).json(updateResponse);
        break;




      default:
        response.status(400).send('Bad Request: Unknown action');
    }
  } catch (error) {
    console.error('Error:', error);
    response.status(500).send('Internal Server Error');
  }
};
