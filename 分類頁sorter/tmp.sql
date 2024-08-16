SELECT
    ccp.product_id,
    ccp.position,
    cpe.sku,
    COALESCE(name_sub.name, '') AS name,
    COALESCE(mrl_sap_cumulative_qty_sub.mrl_sap_cumulative_qty, '') AS mrl_sap_cumulative_qty,
    COALESCE(mrl_sap_available_qty_sub.mrl_sap_available_qty, '') AS mrl_sap_available_qty,
    COALESCE(mrl_sap_status_sub.mrl_sap_status, '') AS mrl_sap_status,
    COALESCE(mrl_sap_purchase_qty_sub.mrl_sap_purchase_qty, '') AS mrl_sap_purchase_qty,
    COALESCE(mrl_sap_expected_start_date_sub.mrl_sap_expected_start_date, '') AS mrl_sap_expected_start_date,
    COALESCE(visibility_sub.visibility, '') AS visibility
FROM
    catalog_category_product AS ccp
JOIN
    catalog_product_entity AS cpe
    ON ccp.product_id = cpe.entity_id
LEFT JOIN (
    SELECT
        entity_id,
        MAX(CASE WHEN attribute_code = 'name' THEN value END) AS name
    FROM
        catalog_product_entity_varchar
    JOIN
        eav_attribute
    ON
        catalog_product_entity_varchar.attribute_id = eav_attribute.attribute_id
    WHERE
        eav_attribute.attribute_code = 'name'
    GROUP BY
        entity_id
) AS name_sub
ON
    cpe.entity_id = name_sub.entity_id
LEFT JOIN (
    SELECT
        entity_id,
        MAX(CASE WHEN attribute_code = 'mrl_sap_cumulative_qty' THEN value END) AS mrl_sap_cumulative_qty
    FROM
        catalog_product_entity_varchar
    JOIN
        eav_attribute
    ON
        catalog_product_entity_varchar.attribute_id = eav_attribute.attribute_id
    WHERE
        eav_attribute.attribute_code = 'mrl_sap_cumulative_qty'
    GROUP BY
        entity_id
) AS mrl_sap_cumulative_qty_sub
ON
    cpe.entity_id = mrl_sap_cumulative_qty_sub.entity_id
LEFT JOIN (
    SELECT
        entity_id,
        MAX(CASE WHEN attribute_code = 'mrl_sap_available_qty' THEN value END) AS mrl_sap_available_qty
    FROM
        catalog_product_entity_varchar
    JOIN
        eav_attribute
    ON
        catalog_product_entity_varchar.attribute_id = eav_attribute.attribute_id
    WHERE
        eav_attribute.attribute_code = 'mrl_sap_available_qty'
    GROUP BY
        entity_id
) AS mrl_sap_available_qty_sub
ON
    cpe.entity_id = mrl_sap_available_qty_sub.entity_id
LEFT JOIN (
    SELECT
        entity_id,
        MAX(CASE WHEN attribute_code = 'mrl_sap_status' THEN value END) AS mrl_sap_status
    FROM
        catalog_product_entity_varchar
    JOIN
        eav_attribute
    ON
        catalog_product_entity_varchar.attribute_id = eav_attribute.attribute_id
    WHERE
        eav_attribute.attribute_code = 'mrl_sap_status'
    GROUP BY
        entity_id
) AS mrl_sap_status_sub
ON
    cpe.entity_id = mrl_sap_status_sub.entity_id
LEFT JOIN (
    SELECT
        entity_id,
        MAX(CASE WHEN attribute_code = 'mrl_sap_purchase_qty' THEN value END) AS mrl_sap_purchase_qty
    FROM
        catalog_product_entity_text
    JOIN
        eav_attribute
    ON
        catalog_product_entity_text.attribute_id = eav_attribute.attribute_id
    WHERE
        eav_attribute.attribute_code = 'mrl_sap_purchase_qty'
    GROUP BY
        entity_id
) AS mrl_sap_purchase_qty_sub
ON
    cpe.entity_id = mrl_sap_purchase_qty_sub.entity_id
LEFT JOIN (
    SELECT
        entity_id,
        MAX(CASE WHEN attribute_code = 'mrl_sap_expected_start_date' THEN value END) AS mrl_sap_expected_start_date
    FROM
        catalog_product_entity_text
    JOIN
        eav_attribute
    ON
        catalog_product_entity_text.attribute_id = eav_attribute.attribute_id
    WHERE
        eav_attribute.attribute_code = 'mrl_sap_expected_start_date'
    GROUP BY
        entity_id
) AS mrl_sap_expected_start_date_sub
ON
    cpe.entity_id = mrl_sap_expected_start_date_sub.entity_id
LEFT JOIN (
    SELECT
        entity_id,
        MAX(CASE WHEN attribute_code = 'visibility' THEN value END) AS visibility
    FROM
        catalog_product_entity_int
    JOIN
        eav_attribute
    ON
        catalog_product_entity_int.attribute_id = eav_attribute.attribute_id
    WHERE
        eav_attribute.attribute_code = 'visibility'
    GROUP BY
        entity_id
) AS visibility_sub
ON
    cpe.entity_id = visibility_sub.entity_id
WHERE
    ccp.category_id = ${categoryId}
GROUP BY
    ccp.product_id, cpe.sku;
