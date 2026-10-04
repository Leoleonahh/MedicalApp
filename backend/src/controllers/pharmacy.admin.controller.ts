import { Request, Response } from "express";

import {
    getPendingPharmacies,
    approvePharmacy,
    rejectPharmacy,
} from "../services/pharmacy.service";


// ========================================
// ดูร้านที่รออนุมัติ
// ========================================

export const listPendingPharmacies = async (
    req: Request & { user?: any },
    res: Response
) => {

    try {

        const pharmacies =
            await getPendingPharmacies();

        return res.json({

            success: true,

            message:
                "Pending pharmacies retrieved successfully",

            data:
                pharmacies,

            count:
                pharmacies.length,

        });

    } catch (error: any) {

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to retrieve pending pharmacies",

        });

    }
};


// ========================================
// Approve Pharmacy
// ========================================

export const approvePharmacyByAdmin = async (
    req: Request & { user?: any },
    res: Response
) => {

    try {

        const pharmacyId =
            Number(req.params.id);

        if (
            isNaN(pharmacyId) ||
            pharmacyId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid pharmacy ID",

            });

        }

        const result =
            await approvePharmacy(
                pharmacyId
            );

        return res.json({

            success: true,

            message:
                "Pharmacy approved successfully",

            data:
                result,

        });

    } catch (error: any) {

        const status =
            error.message
                ?.toLowerCase()
                .includes("not found")
                ? 404
                : 400;

        return res.status(status).json({

            success: false,

            message:
                error.message ||
                "Failed to approve pharmacy",

        });

    }
};


// ========================================
// Reject Pharmacy
// ========================================

export const rejectPharmacyByAdmin = async (
    req: Request & { user?: any },
    res: Response
) => {

    try {

        const pharmacyId =
            Number(req.params.id);

        if (
            isNaN(pharmacyId) ||
            pharmacyId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid pharmacy ID",

            });

        }

        const result =
            await rejectPharmacy(
                pharmacyId
            );

        return res.json({

            success: true,

            message:
                "Pharmacy rejected successfully",

            data:
                result,

        });

    } catch (error: any) {

        const status =
            error.message
                ?.toLowerCase()
                .includes("not found")
                ? 404
                : 400;

        return res.status(status).json({

            success: false,

            message:
                error.message ||
                "Failed to reject pharmacy",

        });

    }
};