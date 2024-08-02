        SELECT 
            ItemCode, 
            U_mrl_eta,
            OpenQty
        FROM mid_Prod.midOPOR_POR1 
        WHERE ItemCode IN ('1017965')


        SELECT 
            ItemCode, 
            OnHand
        FROM mid_Prod.midOITW 
        WHERE ItemCode IN ('1017965')