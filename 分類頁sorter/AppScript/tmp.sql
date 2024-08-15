SELECT
    ccp.product_id,
    ccp.position,
    cpe.sku,
    MAX(CASE WHEN a.attribute_code = 'name' THEN cpev.value END) AS name,
    MAX(CASE WHEN a.attribute_code = 'mrl_sap_cumulative_qty' THEN cpev.value END) AS mrl_sap_cumulative_qty,
    MAX(CASE WHEN a.attribute_code = 'mrl_sap_available_qty' THEN cpev.value END) AS mrl_sap_available_qty,
    MAX(CASE WHEN a.attribute_code = 'mrl_sap_status' THEN cpev.value END) AS mrl_sap_status,
    MAX(CASE WHEN a.attribute_code = 'mrl_sap_purchase_qty' THEN cpet.value END) AS mrl_sap_purchase_qty,
    MAX(CASE WHEN a.attribute_code = 'mrl_sap_expected_start_date' THEN cpet.value END) AS mrl_sap_expected_start_date,
    MAX(CASE WHEN a.attribute_code = 'visibility' THEN eav_option_value.value END) AS visibility
FROM
    catalog_category_product AS ccp
JOIN
    catalog_product_entity AS cpe
    ON ccp.product_id = cpe.entity_id
LEFT JOIN
    catalog_product_entity_varchar AS cpev
    ON cpe.entity_id = cpev.entity_id
LEFT JOIN
    catalog_product_entity_text AS cpet
    ON cpe.entity_id = cpet.entity_id
LEFT JOIN
    catalog_product_entity_int AS cpei
    ON cpe.entity_id = cpei.entity_id
JOIN
    eav_attribute AS a
    ON cpev.attribute_id = a.attribute_id
    OR cpet.attribute_id = a.attribute_id
    OR cpei.attribute_id = a.attribute_id
LEFT JOIN
    eav_attribute_option_value AS eav_option_value
    ON cpei.value = eav_option_value.option_id
    AND a.attribute_code = 'visibility'
    AND eav_option_value.store_id = 0
WHERE
    ccp.category_id = 112
    AND a.attribute_code IN ('name', 'mrl_sap_cumulative_qty', 'mrl_sap_available_qty', 'mrl_sap_status', 'mrl_sap_purchase_qty', 'mrl_sap_expected_start_date', 'visibility')
    AND a.entity_type_id = (
        SELECT entity_type_id
        FROM eav_entity_type
        WHERE entity_type_code = 'catalog_product'
    )
GROUP BY
    ccp.product_id, cpe.sku;
