SELECT
    cpe.entity_id,
    cpe.sku,
    COALESCE(varchar_attributes.name, '') AS name,
    COALESCE(varchar_attributes.mrl_sap_cumulative_qty, '') AS mrl_sap_cumulative_qty,
    COALESCE(varchar_attributes.mrl_sap_available_qty, '') AS mrl_sap_available_qty,
    COALESCE(varchar_attributes.mrl_sap_status, '') AS mrl_sap_status,

    COALESCE(varchar_attributes.mrl_sap_subcategory, '') AS mrl_sap_subcategory,
    COALESCE(varchar_attributes.mrl_sap_space, '') AS mrl_sap_space,

    COALESCE(text_attributes.mrl_sap_purchase_qty, '') AS mrl_sap_purchase_qty,
    COALESCE(text_attributes.mrl_sap_expected_start_date, '') AS mrl_sap_expected_start_date,
    COALESCE(int_attributes.visibility, '') AS visibility,
    COALESCE(ccp.position, 'null') AS position
FROM
    catalog_product_entity AS cpe
LEFT JOIN (
    SELECT
        entity_id,
        MAX(CASE WHEN attribute_code = 'name' THEN value END) AS name,
        MAX(CASE WHEN attribute_code = 'mrl_sap_cumulative_qty' THEN value END) AS mrl_sap_cumulative_qty,
        MAX(CASE WHEN attribute_code = 'mrl_sap_available_qty' THEN value END) AS mrl_sap_available_qty,
        MAX(CASE WHEN attribute_code = 'mrl_sap_status' THEN value END) AS mrl_sap_status,
        MAX(CASE WHEN attribute_code = 'mrl_sap_subcategory' THEN value END) AS mrl_sap_subcategory,
        MAX(CASE WHEN attribute_code = 'mrl_sap_space' THEN value END) AS mrl_sap_space
    FROM
        catalog_product_entity_varchar
    JOIN
        eav_attribute
    ON
        catalog_product_entity_varchar.attribute_id = eav_attribute.attribute_id
    WHERE
        eav_attribute.attribute_code IN ('name', 'mrl_sap_cumulative_qty', 'mrl_sap_available_qty', 'mrl_sap_status', 'mrl_sap_subcategory', 'mrl_sap_space')
    GROUP BY
        entity_id
) AS varchar_attributes
ON
    cpe.entity_id = varchar_attributes.entity_id
LEFT JOIN (
    SELECT
        entity_id,
        MAX(CASE WHEN attribute_code = 'mrl_sap_purchase_qty' THEN value END) AS mrl_sap_purchase_qty,
        MAX(CASE WHEN attribute_code = 'mrl_sap_expected_start_date' THEN value END) AS mrl_sap_expected_start_date
    FROM
        catalog_product_entity_text
    JOIN
        eav_attribute
    ON
        catalog_product_entity_text.attribute_id = eav_attribute.attribute_id
    WHERE
        eav_attribute.attribute_code IN ('mrl_sap_purchase_qty', 'mrl_sap_expected_start_date')
    GROUP BY
        entity_id
) AS text_attributes
ON
    cpe.entity_id = text_attributes.entity_id
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
) AS int_attributes
ON
    cpe.entity_id = int_attributes.entity_id
LEFT JOIN (
    SELECT * FROM catalog_category_product WHERE category_id = ${categoryId}
) AS ccp
ON
    cpe.entity_id = ccp.product_id
WHERE
    cpe.entity_id IN (
        SELECT product_id FROM catalog_category_product WHERE category_id = ${categoryId}
    )

OR
    (
        mrl_sap_status = IN ('常備品')
    AND
        mrl_sap_space = IN ('客廳')
    AND
        mrl_sap_subcategory IN ('LHF')
    AND
        visibility IN (4)
    )
    
GROUP BY
    cpe.entity_id, cpe.sku, ccp.position; 
