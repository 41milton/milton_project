const { getCategoryById, updateCategoryProductPosition , getCategoryByAttributeAndId } = require('./mysqlService');
const { filterData } = require('./dataFilter');


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
    let categoryId;
    let responseData;


    switch (action) {



      //取得分類頁下的內容
      case 'get_category_product_by_id':
        categoryId = request.body.categoryId;
        responseData = await getCategoryById(categoryId);
        response.status(200).json(responseData);
        break;




      //用attribute取得分類頁下的內容
      case 'get_category_product_by_attribute_and_id':
        categoryId = request.body.categoryId;
        const attribute = request.body.attribute;
        responseData = await getCategoryByAttributeAndId(attribute , categoryId);
        response.status(200).json(responseData);
        break;

        


      //修改分類頁的內容
      case 'update_category_product_position':
        categoryId = request.body.categoryId;
        const updateData = request.body.updateData;
        const updateResponse = await updateCategoryProductPosition(categoryId , updateData);
        response.status(201).json(updateResponse);
        break;


      

      //對data做篩選
      case 'filter_data':
        const data = request.body.data;
        const filteredData = filterData(data);
        response.status(200).json(filteredData);
        break;




      default:
        response.status(400).send('Bad Request: Unknown action');
    }
  } catch (error) {
    console.error('Error:', error);
    response.status(500).send('Internal Server Error');
  }
};
