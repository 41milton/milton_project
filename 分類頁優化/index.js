/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
const { productSapToM2Handler } = require('./productSapToM2Handler');

exports.cfProductSapToM2 = (req, res) => {
    productSapToM2Handler(req, res)
        // .then(() => res.status(200).send('Data updated successfully'))
        .then(result => res.status(200).send(result))
        .catch((error) => res.status(500).send(`Error: ${error.message}`));
};
